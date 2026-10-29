// The entrepreneur path (F1, RF-03, RF-04): 12 phases, 3 worlds, 3 entry points, 1 loop.

export type WorldId = "seed" | "saddlebag" | "plaza";
export type EntryPoint = "no_idea" | "has_idea" | "already_selling";
export type PhaseStatus = "locked" | "available" | "done" | "skipped";

export interface Phase {
  id: number;
  key: string;
  title: string;
  world: WorldId;
  mission: string;
  verifiedBy: string;
  /** Validation can never be skipped on any path. */
  skippable: boolean;
}

export const WORLDS: Record<WorldId, { title: string; learns: string }> = {
  seed: { title: "The Seed", learns: "Spot opportunities, create, value your idea, think about others" },
  saddlebag: { title: "The Saddlebag", learns: "What you need, what it costs, where money comes from, two jars" },
  plaza: { title: "The Plaza", learns: "Test small, get known, sell, keep accounts, face risk, learn from mistakes" },
};

export const PHASES: Phase[] = [
  { id: 1, key: "discover", title: "Discover", world: "seed", mission: "Say what you know how to do and what you have at hand", verifiedBy: "voice", skippable: true },
  { id: 2, key: "choose", title: "Choose", world: "seed", mission: "Answer four questions about your idea", verifiedBy: "code", skippable: true },
  { id: 3, key: "golden_circle", title: "Golden circle", world: "seed", mission: "Say why, how and what", verifiedBy: "business_card", skippable: true },
  { id: 4, key: "validate", title: "Validate", world: "seed", mission: "Five mini-interviews", verifiedBy: "voice+code", skippable: false },
  { id: 5, key: "shopping", title: "Shopping", world: "saddlebag", mission: "Materials list and two stores compared", verifiedBy: "photo+confirm", skippable: true },
  { id: 6, key: "capital", title: "Capital", world: "saddlebag", mission: "Decide your starting money and set up two jars", verifiedBy: "log", skippable: true },
  { id: 7, key: "test_batch", title: "Test batch", world: "plaza", mission: "Make a small batch and ask for opinions", verifiedBy: "photo+voice", skippable: true },
  { id: 8, key: "price", title: "Price", world: "saddlebag", mission: "Set a price from your costs and the competition", verifiedBy: "code", skippable: true },
  { id: 9, key: "brand", title: "Brand & promotion", world: "plaza", mission: "Name, slogan, poster and three actions to get known", verifiedBy: "poster+count", skippable: true },
  { id: 10, key: "sales", title: "Sales", world: "plaza", mission: "Practice with a simulated customer, then sell for real", verifiedBy: "rubric", skippable: true },
  { id: 11, key: "cashbox", title: "Cash box", world: "plaza", mission: "Opening and closing photo, and coins", verifiedBy: "sam+voice", skippable: true },
  { id: 12, key: "decide", title: "Decide & pitch", world: "plaza", mission: "Choose how to reinvest and pitch your business", verifiedBy: "code+voice", skippable: true },
];

export const GROWTH_MODULES = [
  "Returning customers: good service and a stamp card",
  "Suppliers: ask two for a price and negotiate by voice",
  "Team and roles: buying, selling and accounts in groups of 3 or 4",
  "Quality, ethics and impact",
  "Grow: a second product with what you learned",
];

/** Phase the loop returns to after phase 12: adjust the idea with what was learned. */
export const LOOP_BACK_TO = 4;

export function startingStatuses(entry: EntryPoint): Record<number, PhaseStatus> {
  const statuses: Record<number, PhaseStatus> = {};
  for (const p of PHASES) statuses[p.id] = "locked";

  if (entry === "no_idea") statuses[1] = "available";
  else if (entry === "has_idea") {
    for (const id of [1, 2, 3]) statuses[id] = "skipped";
    statuses[4] = "available";
  } else {
    // Already selling: jump to the cash box after a quick cost check, but validation stays pending.
    for (const p of PHASES) if (p.id < 11 && p.skippable) statuses[p.id] = "skipped";
    statuses[4] = "available";
    statuses[8] = "available";
    statuses[11] = "available";
  }
  return statuses;
}

export function entryPhase(entry: EntryPoint): number {
  return entry === "no_idea" ? 1 : entry === "has_idea" ? 4 : 11;
}

export class PhaseLockedError extends Error {
  constructor(readonly phaseId: number) {
    super(`phase ${phaseId} is locked`);
  }
}

/** Marks a phase done and unlocks the next locked one; after phase 12 the loop reopens validation. */
export function completePhase(statuses: Record<number, PhaseStatus>, phaseId: number): Record<number, PhaseStatus> {
  const current = statuses[phaseId];
  if (current === undefined) throw new RangeError(`unknown phase ${phaseId}`);
  if (current === "locked") throw new PhaseLockedError(phaseId);

  const next = { ...statuses, [phaseId]: "done" as PhaseStatus };
  if (phaseId === 12) {
    next[LOOP_BACK_TO] = "available";
    return next;
  }
  const following = PHASES.find((p) => p.id > phaseId && next[p.id] === "locked");
  if (following) next[following.id] = "available";
  return next;
}
