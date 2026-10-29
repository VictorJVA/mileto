// Deterministic stand-ins for Meta models, used when no API key is configured.
// Fixtures follow the demo story: Mateo sells orange juice.

import type { ChatMessage, SamBox } from "./client.js";

// 1x1 transparent PNG; the app renders its own poster template around it in mock mode.
const BLANK_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const lastUserText = (messages: ChatMessage[]): string => {
  const m = [...messages].reverse().find((x) => x.role === "user");
  if (!m) return "";
  if (typeof m.content === "string") return m.content;
  return m.content.map((c) => (c.type === "text" ? c.text : "")).join(" ");
};

const fixtures: Record<string, (messages: ChatMessage[]) => unknown> = {
  seed_ideas: () => ({
    ideas: [
      { title: "Fresh orange juice", why: "You said your aunt has an orange tree and you like making juice." },
      { title: "Painted bookmarks", why: "You like drawing and classmates always need bookmarks." },
      { title: "Bike cleaning", why: "You have a bucket, a sponge and many neighbors ride bikes." },
    ],
  }),
  business_card: () => ({
    why: "People get thirsty after school and want something fresh.",
    how: "Juice squeezed the same day with oranges from my aunt's tree.",
    what: "Cups of fresh orange juice.",
  }),
  interview_tags: (m) => {
    const t = lastUserText(m).toLowerCase();
    const no = /\b(no|nunca|never)\b/.test(t) && !/\b(s[ií]|yes)\b/.test(t);
    const price = t.match(/(\d[\d.,]*)/)?.[1]?.replace(/[.,]/g, "");
    return { wouldBuy: no ? false : true, priceMentioned: price ? Number(price) : null, quote: t.slice(0, 120) };
  },
  receipt_items: () => ({
    store: "Corner shop",
    items: [
      { name: "oranges", price: 3000, packSize: 10, confidence: 0.92 },
      { name: "cups", price: 2000, packSize: 20, confidence: 0.88 },
    ],
  }),
  coins: () => ({ coins: [{ denomination: 1000, count: 6 }, { denomination: 500, count: 4 }, { denomination: 200, count: 5 }] }),
  brand_options: () => ({
    options: [
      { name: "Sunny Squeeze", slogan: "Fresh from the tree to your cup", colors: ["#F59E0B", "#16A34A"] },
      { name: "Juice Corner", slogan: "Your afternoon pick-me-up", colors: ["#EA580C", "#FDE68A"] },
      { name: "Orange Wave", slogan: "Cold, sweet and made today", colors: ["#FB923C", "#0EA5E9"] },
    ],
  }),
  customer_reply: (m) => {
    const turn = m.filter((x) => x.role === "assistant").length;
    const replies = [
      "Hmm, 1,500 pesos sounds expensive for a juice.",
      "Oh, so the oranges are from today? That sounds good.",
      "Okay, I'll take one!",
    ];
    return { reply: replies[Math.min(turn, replies.length - 1)], endConversation: turn >= 2 };
  },
  sale_tags: (m) => {
    const t = lastUserText(m).toLowerCase();
    return {
      greeted: /hola|hello|hi|buenas/.test(t),
      saidPrice: /\d|peso/.test(t),
      answeredObjection: /fresh|fresc|today|hoy|tree|árbol|arbol/.test(t),
      closed: /want|quiere|would you|te provoca|llevas/.test(t),
    };
  },
  mascot_line: () => ({ text: "How do you know someone would buy it? Let's ask first, then decide!" }),
  pitch_feedback: () => ({
    strength: "You explained clearly who your juice is for.",
    suggestion: "Say your price and what makes your juice special in one sentence.",
  }),
};

export const mock = {
  async chatJson(schemaName: string, messages: ChatMessage[]): Promise<string> {
    const make = fixtures[schemaName];
    if (!make) throw new Error(`No mock fixture for ${schemaName}`);
    return JSON.stringify(make(messages));
  },
  async transcribe(wav: Buffer): Promise<{ transcript: string; audioDurationMs: number | null }> {
    // 16 kHz mono 16-bit PCM is 32,000 bytes per second after the 44-byte header.
    const ms = wav.length > 44 ? Math.round(((wav.length - 44) / 32_000) * 1000) : null;
    return { transcript: "Hola, sí compraría el jugo, pagaría 1500 pesos.", audioDurationMs: ms };
  },
  async segment(noun: string): Promise<SamBox[]> {
    const count = /coin|moneda/i.test(noun) ? 15 : 20;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x1: (i % 5) * 100,
      y1: Math.floor(i / 5) * 100,
      x2: (i % 5) * 100 + 80,
      y2: Math.floor(i / 5) * 100 + 80,
      confidence: 0.9,
    }));
  },
  async generateImage(): Promise<{ b64: string; mimeType: string }> {
    return { b64: BLANK_PNG, mimeType: "image/png" };
  },
};
