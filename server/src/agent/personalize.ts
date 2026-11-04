// "Now with YOUR idea": after the general example (oranges, cakes), each lesson shows a worked example
// and a practice question about the kid's own business, so a kid who wants to build websites learns
// with websites. The model writes the situation; for money phases it only proposes example inputs
// (materials, packs, counts) and code computes every number shown (RNF-03).

import { z } from "zod";
import { calculateCosts, closeCashbox, comparePrices } from "../core/index.js";
import { MASCOT_SYSTEM } from "./persona.js";
import { containsContactInfo } from "./safety.js";
import { askJson } from "./tools.js";

export interface PersonalLesson {
  example: { title: string; steps: string[]; result: string };
  question: { prompt: string; options: string[]; answer: number; explain: string };
}

export interface BusinessContext {
  idea: string;
  why?: string;
  how?: string;
  what?: string;
  ageRange?: string;
}

const peso = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

/** What each phase teaches, so the model's example practices exactly that idea. */
export const CONCEPTS: Record<string, string> = {
  discover: "Business ideas come from what you HAVE, what you KNOW how to do, and what people NEAR YOU need.",
  choose: "Check an idea with four questions: can I make it, does someone want it, is it safe (or will an adult help), can I start with little money.",
  golden_circle: "The golden circle: WHY people need it (the need), HOW it is special, WHAT you sell.",
  validate: "Before spending, ask 5 people you know if they would really buy and how much they'd pay, with open, non-pushy questions. Fewer than half saying yes means adjust the idea.",
  capital: "Two jars: business money (for materials and keeping the business going) and personal money. Start with what you have, no loans.",
  test_batch: "Test small first: make a small batch or a first version, ask for honest opinions, improve, test again.",
  brand: "A brand is your team jersey: name, colors, short slogan. Get known with word of mouth, free samples and posters. Never put personal data on posters.",
  sales: "Selling like a good host: greet, listen to the worry, explain why it's worth it, ask for the sale, stay kind if they say no.",
  decide: "With profit you can repeat, change the price, or save part. Each plan is a guess to test, not a promise.",
  shopping: "Compare the price of ONE unit at two stores: divide the price by how many you get.",
  price: "Cost of one = all materials ÷ how many you make. Profit = price − cost, and it must be positive.",
  cashbox: "Count at opening and closing: sold = morning − night, money in = sold × price. A mismatch is a clue.",
};

const NUMERIC = new Set(["shopping", "price", "cashbox"]);
export const PERSONAL_PHASES = new Set(Object.keys(CONCEPTS));

const short = (max: number) => z.string().min(1).max(max);

const TextLesson = z.object({
  example: z.object({ title: short(80), steps: z.array(short(180)).min(2).max(4), result: short(220) }),
  // Options must be real sentences: the model sometimes answers with just a letter ("A").
  question: z.object({ prompt: short(200), correct: z.string().min(8).max(110), wrong: z.array(z.string().min(8).max(110)).length(2), explain: short(220) }),
});

const ShoppingInputs = z.object({
  material: short(30),
  unit: short(16),
  storeA: z.object({ name: short(30), packSize: z.number().int().min(1).max(500), price: z.number().int().min(100).max(1_000_000) }),
  storeB: z.object({ name: short(30), packSize: z.number().int().min(1).max(500), price: z.number().int().min(100).max(1_000_000) }),
});

const PriceInputs = z.object({
  product: short(40),
  unit: short(20),
  materials: z.array(z.object({ name: short(30), quantity: z.number().int().min(1).max(1000), unitCost: z.number().int().min(10).max(500_000) })).min(1).max(4),
  units: z.number().int().min(1).max(500),
  price: z.number().int().min(100).max(2_000_000),
});

const CashboxInputs = z.object({
  product: short(40),
  unit: short(20),
  unitsAtOpen: z.number().int().min(2).max(300),
  unitsAtClose: z.number().int().min(0).max(300),
  price: z.number().int().min(100).max(2_000_000),
});

const STYLE = "Write in English, in plain text (no markdown, no asterisks). Keep names short: 1 to 3 words.";

/** Removes markdown the model sometimes adds anyway. */
const plain = (s: string) => s.replace(/\*\*|__|`|#+\s/g, "").replace(/\s+/g, " ").trim();
/** Options sometimes come numbered ("A) …", "1. …"); the app adds its own badges. */
const option = (s: string) => plain(s).replace(/^([A-Ca-c]|[1-3])[).:]\s+/, "");
/** "One Website" → "website", so sentences read "the cost of one website". */
const unitName = (s: string) => plain(s).replace(/^(one|a|an|1)\s+/i, "").toLowerCase();

function contextText(b: BusinessContext): string {
  return [
    `The kid's business idea: ${b.idea}.`,
    b.why ? `Why: ${b.why}.` : "",
    b.how ? `How: ${b.how}.` : "",
    b.what ? `What: ${b.what}.` : "",
    `Age range: ${b.ageRange ?? "8-12"}. Prices in Colombian pesos, realistic for a small town.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function textQuestion(q: z.infer<typeof TextLesson>["question"]): PersonalLesson["question"] {
  return { prompt: q.prompt, options: [q.correct, ...q.wrong], answer: 0, explain: q.explain };
}

async function textLesson(phase: string, b: BusinessContext): Promise<PersonalLesson> {
  const r = await askJson("personal_text", TextLesson, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `${contextText(b)}
The lesson teaches: ${CONCEPTS[phase]}
Write a worked example that applies this lesson to THE KID'S OWN business (not juice, not cakes unless that is their idea): a short title (max 6 words), 2-4 simple steps (max 18 words each), and a one-sentence result.
Then write one multiple-choice question about their business that checks they understood the lesson: the full text of the correct option, the full text of two plausible wrong options (never just a letter), and why the correct one is right. All three options must have a similar length, at most 14 words each, so the length never gives the answer away.
Simple words for kids. Do not invent statistics or promise earnings. No people's real names, schools, places or contact details. ${STYLE}`,
    },
  ]);
  return {
    example: { title: plain(r.example.title), steps: r.example.steps.map(plain), result: plain(r.example.result) },
    question: textQuestion({ prompt: plain(r.question.prompt), correct: option(r.question.correct), wrong: r.question.wrong.map(option), explain: plain(r.question.explain) }),
  };
}

async function shoppingLesson(b: BusinessContext): Promise<PersonalLesson> {
  const r = await askJson("personal_shopping", ShoppingInputs, [
    { role: "system", content: "You propose realistic example inputs for a kid's lesson. Numbers are hypothetical examples. Reply only with the requested fields." },
    {
      role: "user",
      content: `${contextText(b)}
Pick the ONE main material or supply this business buys most (for a service or digital business, a supply it really pays for). Give its unit name (singular), and two local stores that sell it in different pack sizes and prices, so the cheaper one per unit is NOT the one with the lower total price. Store names are generic (like "Corner shop", "Market"), never real businesses. ${STYLE}`,
    },
  ]);
  r.unit = unitName(r.unit);
  r.material = unitName(r.material);
  const c = comparePrices([
    { store: r.storeA.name, item: r.material, price: r.storeA.price, packSize: r.storeA.packSize },
    { store: r.storeB.name, item: r.material, price: r.storeB.price, packSize: r.storeB.packSize },
  ]);
  const [a, bq] = c.quotes;
  const winner = c.cheapestStore;
  const loser = winner === a.store ? bq : a;
  const best = winner === a.store ? a : bq;
  return {
    example: {
      title: `Buying ${r.material}`,
      steps: [
        `${a.store}: ${peso(r.storeA.price)} ÷ ${r.storeA.packSize} = ${peso(a.pricePerUnit)} per ${r.unit}.`,
        `${bq.store}: ${peso(r.storeB.price)} ÷ ${r.storeB.packSize} = ${peso(bq.pricePerUnit)} per ${r.unit}.`,
      ],
      result: winner ? `${winner} is cheaper per ${r.unit}!` : "Both cost the same per unit.",
    },
    question: winner
      ? {
          prompt: `Which store sells ${r.material} cheaper per ${r.unit}?`,
          options: [`${best.store}: ${peso(best.pricePerUnit)} per ${r.unit}`, `${loser.store}: ${peso(loser.pricePerUnit)} per ${r.unit}`, "They cost the same"],
          answer: 0,
          explain: `Divide each price by how many you get: ${peso(best.pricePerUnit)} is less than ${peso(loser.pricePerUnit)}.`,
        }
      : {
          prompt: `Which store sells ${r.material} cheaper per ${r.unit}?`,
          options: ["They cost the same", a.store, bq.store],
          answer: 0,
          explain: "Both come to the same price per unit.",
        },
  };
}

async function priceLesson(b: BusinessContext): Promise<PersonalLesson> {
  const r = await askJson("personal_price", PriceInputs, [
    { role: "system", content: "You propose realistic example inputs for a kid's lesson. Numbers are hypothetical examples. Reply only with the requested fields." },
    {
      role: "user",
      content: `${contextText(b)}
Name the product or service unit this business sells (singular), list 1-4 materials or supplies with quantity and cost of one, how many units those make, and a fair selling price per unit that is higher than the cost of one unit. ${STYLE}`,
    },
  ]);
  r.unit = unitName(r.unit);
  const c = calculateCosts({ items: r.materials, units: r.units, price: r.price });
  const list = r.materials.map((m) => `${m.quantity} ${m.name}`).join(" + ");
  return {
    example: {
      title: `The cost of one ${r.unit}`,
      steps: [
        r.units === 1 ? `${list} = ${peso(c.totalCost)} to make one ${r.unit}.` : `${list} = ${peso(c.totalCost)} to make ${r.units} (${r.unit} × ${r.units}).`,
        `Cost of one = ${peso(c.totalCost)} ÷ ${r.units} = ${peso(c.unitCost)}.`,
        `Price ${peso(r.price)} − cost ${peso(c.unitCost)}.`,
      ],
      result: c.profitPerUnit > 0 ? `${peso(c.profitPerUnit)} profit per ${r.unit}!` : `${peso(c.profitPerUnit)} per ${r.unit}: the price must go up!`,
    },
    question: {
      prompt: `One ${r.unit} costs ${peso(c.unitCost)} to make and you sell it for ${peso(r.price)}. What's the profit?`,
      options: [peso(r.price - c.unitCost), peso(r.price + c.unitCost), peso(c.unitCost)],
      answer: 0,
      explain: `Price minus cost: ${peso(r.price)} − ${peso(c.unitCost)} = ${peso(r.price - c.unitCost)}.`,
    },
  };
}

async function cashboxLesson(b: BusinessContext): Promise<PersonalLesson> {
  const r = await askJson("personal_cashbox", CashboxInputs, [
    { role: "system", content: "You propose realistic example inputs for a kid's lesson. Numbers are hypothetical examples. Reply only with the requested fields." },
    {
      role: "user",
      content: `${contextText(b)}
Name the unit this business counts each day (singular: a product, or a booked slot or job for a service), how many it had at opening, how many were left at closing (fewer than at opening), and the price of one. ${STYLE}`,
    },
  ]);
  r.unit = unitName(r.unit);
  const close = Math.min(r.unitsAtClose, r.unitsAtOpen - 1);
  const c = closeCashbox({ unitsAtOpen: r.unitsAtOpen, unitsAtClose: close, price: r.price });
  return {
    example: {
      title: `A day of selling: ${unitName(r.product)}`,
      steps: [`Opening: ${r.unitsAtOpen} (${r.unit}). Closing: ${close}.`, `Sold: ${r.unitsAtOpen} − ${close} = ${c.soldByCount}.`, `Money in: ${c.soldByCount} × ${peso(r.price)}.`],
      result: peso(c.revenue),
    },
    question: {
      prompt: `You sold ${c.soldByCount} (${r.unit}) at ${peso(r.price)} each. How much money came in?`,
      // Wrong options are the classic slips: counting one too many, or forgetting to multiply.
      options: [peso(c.revenue), peso((c.soldByCount + 1) * r.price), peso(r.price)],
      answer: 0,
      explain: `Sold × price: ${c.soldByCount} × ${peso(r.price)} = ${peso(c.revenue)}.`,
    },
  };
}

/** Builds the personal example and question for one phase. Returns null when there is no idea yet. */
export async function personalizeLesson(phase: string, b: BusinessContext): Promise<PersonalLesson | null> {
  if (!b.idea?.trim() || !PERSONAL_PHASES.has(phase)) return null;
  const lesson = !NUMERIC.has(phase) ? await textLesson(phase, b) : phase === "shopping" ? await shoppingLesson(b) : phase === "price" ? await priceLesson(b) : await cashboxLesson(b);
  const text = [lesson.example.title, ...lesson.example.steps, lesson.example.result, lesson.question.prompt, ...lesson.question.options].join(" ");
  // Generated text is shown to a kid: drop it if it carries contact details.
  return containsContactInfo(text) ? null : lesson;
}
