// Practice games rewritten around the kid's own business. The app sends the phase's general games;
// the model rewrites only the wording. Code then checks every game keeps the exact same structure and
// answer key (same correct option, same true/false, same bins, same order); any game that doesn't is
// dropped and the app keeps the general version. Games with calculations are never sent: their numbers
// must come from code.

import { z } from "zod";
import { MASCOT_SYSTEM } from "./persona.js";
import { containsContactInfo } from "./safety.js";
import { askJson } from "./tools.js";
import type { BusinessContext } from "./personalize.js";

export type GameKind = "quiz" | "pictures" | "blank" | "order" | "lightning" | "pairs" | "sort";

export interface GameIn {
  id: string;
  kind: GameKind;
  spec: Record<string, unknown>;
}

const Str = z.string().min(1).max(220);

/** Each kind's shape, and a check that the rewrite kept the answer key of the original. */
const CHECKS: Record<GameKind, { shape: z.ZodType; same: (orig: any, next: any) => boolean }> = {
  quiz: {
    shape: z.object({ prompt: Str, options: z.array(z.string().min(2).max(220)).min(2).max(4), explain: Str, say: Str.optional() }),
    same: (o, n) => n.options.length === o.options.length,
  },
  pictures: {
    shape: z.object({ prompt: Str, options: z.array(z.object({ emoji: z.string().min(1).max(8), label: z.string().min(1).max(40) })).min(2).max(4), explain: Str, say: Str.optional() }),
    same: (o, n) => n.options.length === o.options.length,
  },
  blank: {
    shape: z.object({ prompt: Str, before: Str, after: z.string().max(220), options: z.array(z.string().min(1).max(40)).min(2).max(4), explain: Str }),
    same: (o, n) => n.options.length === o.options.length,
  },
  order: {
    shape: z.object({ prompt: Str, items: z.array(z.string().min(1).max(80)).min(2).max(6), explain: Str }),
    same: (o, n) => n.items.length === o.items.length,
  },
  lightning: {
    shape: z.object({ prompt: Str, statements: z.array(z.object({ text: Str, truth: z.boolean(), why: Str })).min(2).max(6) }),
    same: (o, n) => n.statements.length === o.statements.length && n.statements.every((s: { truth: boolean }, i: number) => s.truth === o.statements[i].truth),
  },
  pairs: {
    shape: z.object({ prompt: Str, pairs: z.array(z.tuple([z.string().min(1).max(40), z.string().min(1).max(80)])).min(2).max(5) }),
    same: (o, n) => n.pairs.length === o.pairs.length,
  },
  sort: {
    shape: z.object({
      prompt: Str,
      say: Str.optional(),
      items: z.array(z.object({ label: z.string().min(1).max(80), bin: z.string(), why: Str.optional() })).min(2).max(7),
    }),
    // Same bins (kept from the original), every bin still used, same number of cards.
    same: (o, n) => {
      const bins = new Set(o.bins.map((b: { id: string }) => b.id));
      return n.items.length === o.items.length && n.items.every((i: { bin: string }) => bins.has(i.bin)) && [...bins].every((b) => n.items.some((i: { bin: string }) => i.bin === b));
    },
  },
};

const Reply = z.object({ games: z.array(z.object({ id: z.string(), spec: z.record(z.string(), z.unknown()) })) });

const plain = (v: unknown): unknown =>
  typeof v === "string" ? v.replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim() : Array.isArray(v) ? v.map(plain) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) : v;

/** Rewrites the games for the kid's idea. Returns only the games that passed the checks, by id. */
export async function personalizeGames(b: BusinessContext, concept: string, games: GameIn[]): Promise<Record<string, Record<string, unknown>>> {
  const usable = games.filter((g) => CHECKS[g.kind]);
  if (!b.idea?.trim() || usable.length === 0) return {};

  const r = await askJson("personal_games", Reply, [
    { role: "system", content: MASCOT_SYSTEM },
    {
      role: "user",
      content: `The kid's business idea: ${b.idea}.${b.why ? ` Why: ${b.why}.` : ""}${b.what ? ` What: ${b.what}.` : ""} Age range: ${b.ageRange ?? "8-12"}.
The lesson teaches: ${concept}
Rewrite each practice game below so it is about THIS kid's business instead of juice, cakes or bracelets.
Keep EXACTLY the same structure and answer key:
- same number of options, items, statements and pairs, in the same order;
- each option keeps its role (the correct one stays correct, wrong ones stay wrong);
- each true/false statement keeps its truth value;
- sort items keep the same bin ids (bins themselves are not rewritten);
- order items stay in the correct order.
Short, simple words for kids; options of similar length so the length never gives the answer away. Plain English text, no markdown. Keep emojis for pictures. No real names, places, schools or contact details.
Return {"games":[{"id": ..., "spec": {...}}]} with the rewritten spec of every game (omit the bins field for sort games).
Games:
${JSON.stringify(usable.map((g) => ({ id: g.id, kind: g.kind, spec: g.spec })))}`,
    },
  ]);

  const out: Record<string, Record<string, unknown>> = {};
  for (const g of usable) {
    const next = r.games.find((x) => x.id === g.id);
    if (!next) continue;
    const parsed = CHECKS[g.kind].shape.safeParse(plain(next.spec));
    if (!parsed.success || !CHECKS[g.kind].same(g.spec, parsed.data)) continue;
    const spec = { ...g.spec, ...(parsed.data as object) } as Record<string, unknown>;
    if (containsContactInfo(JSON.stringify(spec))) continue;
    out[g.id] = spec;
  }
  return out;
}
