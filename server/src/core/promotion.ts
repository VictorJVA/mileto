// Promotion tracking (F8, RF-20): count "how did you hear about us?" answers per action.

export const PROMOTION_ACTIONS = ["word_of_mouth", "free_sample", "poster"] as const;
export type PromotionAction = (typeof PROMOTION_ACTIONS)[number];
export type CustomerSource = PromotionAction | "other";

export interface SourceCount {
  counts: Record<CustomerSource, number>;
  total: number;
  /** The action that brought the most customers; null on a tie or with no data. */
  best: PromotionAction | null;
}

export function countCustomerSources(sources: CustomerSource[]): SourceCount {
  const counts: Record<CustomerSource, number> = { word_of_mouth: 0, free_sample: 0, poster: 0, other: 0 };
  for (const s of sources) counts[s in counts ? s : "other"] += 1;

  const ranked = PROMOTION_ACTIONS.map((a) => [a, counts[a]] as const).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  const best = top[1] > 0 && top[1] !== second[1] ? top[0] : null;
  return { counts, total: sources.length, best };
}
