// Idea check (RF-06) and market validation summary (F2, RF-08).

export interface IdeaCheckAnswers {
  /** Can I make or get it with what I have? */
  canMakeIt: boolean;
  /** Do I know someone who would want it? */
  someoneWantsIt: boolean;
  /** Is it safe to make and sell (or will an adult help)? */
  isSafe: boolean;
  /** Can I start with little money? */
  cheapToStart: boolean;
}

export interface IdeaCheckResult {
  passed: boolean;
  score: number;
  needsAdult: boolean;
  concerns: Array<keyof IdeaCheckAnswers>;
}

export function checkIdea(answers: IdeaCheckAnswers): IdeaCheckResult {
  const concerns = (Object.keys(answers) as Array<keyof IdeaCheckAnswers>).filter((k) => !answers[k]);
  return {
    // Safety is non-negotiable; otherwise three of four is enough to move on and learn.
    passed: answers.isSafe && concerns.length <= 1,
    score: 4 - concerns.length,
    needsAdult: !answers.isSafe,
    concerns,
  };
}

export interface InterviewTag {
  /** Tags extracted by the model from a transcript. */
  wouldBuy: boolean | null;
  /** Price the person mentioned, in pesos. */
  priceMentioned: number | null;
}

export const MIN_INTERVIEWS = 3;
export const INTEREST_THRESHOLD = 0.5;

export interface InterviewSummary {
  interviews: number;
  interested: number;
  notInterested: number;
  unclear: number;
  interestRate: number;
  priceRange: { min: number; max: number; median: number } | null;
  enoughInterviews: boolean;
  decision: "keep_going" | "adjust_idea" | "need_more_interviews";
}

export function summarizeInterviews(tags: InterviewTag[]): InterviewSummary {
  const interested = tags.filter((t) => t.wouldBuy === true).length;
  const notInterested = tags.filter((t) => t.wouldBuy === false).length;
  const unclear = tags.length - interested - notInterested;
  const prices = tags
    .map((t) => t.priceMentioned)
    .filter((p): p is number => typeof p === "number" && Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);
  const interestRate = tags.length ? interested / tags.length : 0;
  const enoughInterviews = tags.length >= MIN_INTERVIEWS;

  return {
    interviews: tags.length,
    interested,
    notInterested,
    unclear,
    interestRate: Math.round(interestRate * 100) / 100,
    priceRange: prices.length ? { min: prices[0], max: prices[prices.length - 1], median: median(prices) } : null,
    enoughInterviews,
    decision: !enoughInterviews ? "need_more_interviews" : interestRate >= INTEREST_THRESHOLD ? "keep_going" : "adjust_idea",
  };
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
