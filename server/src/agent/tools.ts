// Agent tools (plan: "Agent tools" table). Models read voice and photos and talk; code does every number.
// Model output is validated against a schema, retried once, then handed back to the kid to confirm.

import { z } from "zod";
import * as meta from "../meta/client.js";
import {
  COP_COIN_DENOMINATIONS,
  countCustomerSources,
  evaluateSale,
  MAX_CUSTOMER_TURNS,
  summarizeInterviews,
  type CustomerSource,
  type SalesTags,
} from "../core/index.js";
import { CUSTOMER_SYSTEM, MASCOT_SYSTEM } from "./persona.js";
import { checkKidInput, containsPersonalData, SAFE_REPLIES } from "./safety.js";

/** The model output could not be trusted; the app should ask the kid to say or type the value. */
export class NeedsConfirmationError extends Error {
  constructor(readonly tool: string) {
    super(`${tool}: model output failed validation, ask the kid to confirm`);
  }
}

async function askJson<T extends z.ZodType>(
  tool: string,
  schema: T,
  messages: meta.ChatMessage[],
  model?: string,
): Promise<z.infer<T>> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await meta.chatJson({ messages, schemaName: tool, schema: jsonSchema, model });
      const parsed = schema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    } catch (err) {
      if (err instanceof meta.MetaApiError && err.status < 500 && err.status !== 429) throw err;
    }
  }
  throw new NeedsConfirmationError(tool);
}

const imageMessage = (instruction: string, imageDataUrl: string): meta.ChatMessage => ({
  role: "user",
  content: [
    { type: "text", text: instruction },
    { type: "image_url", image_url: { url: imageDataUrl } },
  ],
});

// transcribe_voice
export async function transcribeVoice(wav: Buffer): Promise<{ transcript: string }> {
  const { transcript } = await meta.transcribe(wav);
  return { transcript: transcript.trim() };
}

// Phase 1: discover ideas from what the kid knows and has.
const SeedIdeas = z.object({ ideas: z.array(z.object({ title: z.string(), why: z.string() })).length(3) });
export async function discoverIdeas(kidSaid: string) {
  const guard = checkKidInput(kidSaid);
  if (!guard.ok) return { blocked: SAFE_REPLIES[guard.reason], ideas: [] };
  return askJson("seed_ideas", SeedIdeas, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `The kid said what they know how to do and what they have:\n"""${kidSaid}"""\nPropose exactly 3 simple, safe, low-cost business ideas a kid could start this week with that. "why" must point to what the kid said.`,
    },
  ]);
}

// Phase 3: golden circle into a business card the kid confirms.
const BusinessCard = z.object({ why: z.string(), how: z.string(), what: z.string() });
export async function goldenCircle(kidSaid: string, idea: string) {
  return askJson("business_card", BusinessCard, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `Idea: ${idea}\nThe kid explained their idea:\n"""${kidSaid}"""\nWrite their why, how and what as one short sentence each, using the kid's own words. Do not invent facts.`,
    },
  ]);
}

// summarize_interviews: the model only tags each transcript; code counts and computes the price range.
const InterviewTag = z.object({
  wouldBuy: z.boolean().nullable(),
  priceMentioned: z.number().int().positive().nullable(),
  quote: z.string(),
});
export async function summarizeInterviewTranscripts(idea: string, transcripts: string[]) {
  const tags = await Promise.all(
    transcripts.map((t) =>
      askJson("interview_tags", InterviewTag, [
        {
          role: "system",
          content:
            "You tag market interview transcripts. wouldBuy is true only if the person clearly says they would buy, false if they clearly would not, null if unclear. priceMentioned is the price in Colombian pesos they said they would pay, or null. quote is their most useful sentence.",
        },
        { role: "user", content: `Product: ${idea}\nTranscript:\n"""${t}"""` },
      ]),
    ),
  );
  return { tags, summary: summarizeInterviews(tags) };
}

// read_photo: prices from a shelf label or receipt. Every value must be confirmed by the kid.
export const LOW_CONFIDENCE = 0.7;
const ReceiptItems = z.object({
  store: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number().int().nonnegative(),
      packSize: z.number().int().positive(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});
export async function readPricePhoto(imageDataUrl: string, lookingFor: string[]) {
  const result = await askJson(
    "receipt_items",
    ReceiptItems,
    [
      imageMessage(
        `Read this price label or receipt from a Colombian store. Extract only these items if present: ${lookingFor.join(", ")}. price is in pesos as an integer, packSize is how many units that price buys (1 if unsure). confidence is how sure you are the price is legible. Do not guess unreadable prices; omit them.`,
        imageDataUrl,
      ),
    ],
  );
  return {
    ...result,
    items: result.items.map((i) => ({ ...i, needsVoiceConfirmation: i.confidence < LOW_CONFIDENCE })),
  };
}

// count_objects: SAM 3.1 counts; the kid confirms ("I see 20, is that right?").
export async function countObjects(imageUrl: string, noun: string) {
  const boxes = await meta.segment(imageUrl, noun);
  return { count: boxes.length, boxes, needsConfirmation: true as const };
}

// classify_coins: Muse Spark reads denominations; code checks them and adds them up.
const Coins = z.object({ coins: z.array(z.object({ denomination: z.number().int(), count: z.number().int().nonnegative() })) });
export async function classifyCoins(imageDataUrl: string) {
  const { coins } = await askJson("coins", Coins, [
    imageMessage(
      `Count the Colombian peso coins in this photo by denomination. Valid denominations: ${COP_COIN_DENOMINATIONS.join(", ")}. Ignore bills and other objects.`,
      imageDataUrl,
    ),
  ]);
  const valid = coins.filter((c) => (COP_COIN_DENOMINATIONS as readonly number[]).includes(c.denomination));
  const byDenomination = Object.fromEntries(valid.map((c) => [String(c.denomination), c.count]));
  return {
    coins: byDenomination,
    total: valid.reduce((s, c) => s + c.denomination * c.count, 0),
    rejected: coins.length - valid.length,
    needsConfirmation: true as const,
  };
}

// create_brand
const BrandOptions = z.object({
  options: z
    .array(z.object({ name: z.string().max(40), slogan: z.string().max(80), colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(3) }))
    .length(3),
});
export async function createBrand(business: { idea: string; why: string; what: string }) {
  const result = await askJson("brand_options", BrandOptions, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `Business: ${business.what}. Idea: ${business.idea}. Why: ${business.why}.\nPropose 3 short, original brand names with a slogan and 2-3 hex colors each. No people's names, places, schools or contact details.`,
    },
  ]);
  return { options: result.options.filter((o) => !containsPersonalData(`${o.name} ${o.slogan}`)) };
}

// generate_poster: Muse Image, with personal data checked before and after.
export async function generatePoster(brand: { name: string; slogan: string; product: string; price?: number; colors?: string[] }) {
  const text = `${brand.name} ${brand.slogan} ${brand.product}`;
  if (containsPersonalData(text)) return { blocked: SAFE_REPLIES.personal_data };
  // The app draws the name, slogan and price on top, so the art itself carries no text and stays legible.
  const prompt = [
    `Cheerful hand-drawn poster art for a kid's small ${brand.product} stand, in the mood of "${brand.slogan}".`,
    brand.colors?.length ? `Color palette: ${brand.colors.join(", ")}.` : "",
    "Flat illustration, bright, friendly, portrait. Leave the bottom third simple for text added later.",
    "No text, letters or numbers. No people, no faces.",
  ]
    .filter(Boolean)
    .join(" ");
  const image = await meta.generateImage(prompt);
  return { ...image, prompt };
}

// simulate_customer: max three turns, friendly tone, stops on distress.
const CustomerReply = z.object({ reply: z.string().max(300), endConversation: z.boolean() });
export async function simulateCustomer(input: {
  scenario: string;
  product: string;
  price: number;
  history: Array<{ role: "kid" | "customer"; text: string }>;
}) {
  const lastKid = [...input.history].reverse().find((h) => h.role === "kid");
  if (lastKid) {
    const guard = checkKidInput(lastKid.text);
    if (!guard.ok && guard.reason === "distress") return { reply: SAFE_REPLIES.distress, endConversation: true, turn: 0, stoppedForSafety: true };
  }
  const customerTurns = input.history.filter((h) => h.role === "customer").length;
  if (customerTurns >= MAX_CUSTOMER_TURNS) return { reply: "", endConversation: true, turn: customerTurns, stoppedForSafety: false };

  const result = await askJson("customer_reply", CustomerReply, [
    { role: "system", content: `${CUSTOMER_SYSTEM}\nProduct: ${input.product} at ${input.price} pesos. Your objection: ${input.scenario}.` },
    ...input.history.map((h): meta.ChatMessage => ({ role: h.role === "kid" ? "user" : "assistant", content: h.text })),
  ]);
  const turn = customerTurns + 1;
  return { ...result, endConversation: result.endConversation || turn >= MAX_CUSTOMER_TURNS, turn, stoppedForSafety: false };
}

// evaluate_sale: the model tags; code scores with the fixed rubric.
const SaleTagsSchema = z.object({ greeted: z.boolean(), saidPrice: z.boolean(), answeredObjection: z.boolean(), closed: z.boolean() });
export async function evaluateSaleConversation(history: Array<{ role: "kid" | "customer"; text: string }>, objection: string) {
  const transcript = history.map((h) => `${h.role.toUpperCase()}: ${h.text}`).join("\n");
  const tags: SalesTags = await askJson("sale_tags", SaleTagsSchema, [
    {
      role: "system",
      content:
        "You label a kid's sales practice conversation. Answer only with booleans: did the KID greet, say the price, respond to the customer's objection with a reason, and ask for the sale? Judge only the KID lines.",
    },
    { role: "user", content: `Objection: ${objection}\n${transcript}` },
  ]);
  return { tags, feedback: evaluateSale(tags) };
}

// count_customer_sources
export function countSources(sources: CustomerSource[]) {
  return countCustomerSources(sources);
}

// Mascot line for any screen; numbers must be passed in, never computed by the model.
const MascotLine = z.object({ text: z.string().max(240) });
export async function mascotSay(situation: string, facts: Record<string, string | number> = {}) {
  return askJson("mascot_line", MascotLine, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `Situation: ${situation}\nFacts (use these exact numbers, do not compute new ones): ${JSON.stringify(facts)}\nSay one or two short sentences to the kid.`,
    },
  ]);
}

// Phase 12: pitch by voice with one strength and one suggestion.
const PitchFeedback = z.object({ strength: z.string(), suggestion: z.string() });
export async function pitchFeedback(transcript: string) {
  return askJson("pitch_feedback", PitchFeedback, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `The kid pitched their business:\n"""${transcript}"""\nGive one specific strength and one specific suggestion. No grades.`,
    },
  ]);
}
