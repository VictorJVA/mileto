// Sales practice rubric (F9, RF-21). The model only tags the conversation; the score is computed here.

export interface SalesTags {
  greeted: boolean;
  saidPrice: boolean;
  answeredObjection: boolean;
  closed: boolean;
}

export const RUBRIC: Array<{ key: keyof SalesTags; points: number; praise: string; tip: string }> = [
  { key: "greeted", points: 1, praise: "You greeted the customer warmly.", tip: "Start with a hello and a smile." },
  { key: "saidPrice", points: 1, praise: "You said the price clearly.", tip: "Tell the customer the price out loud." },
  {
    key: "answeredObjection",
    points: 2,
    praise: "You listened and answered the customer's worry.",
    tip: "When they say it is expensive, explain what makes it worth it.",
  },
  { key: "closed", points: 1, praise: "You asked for the sale.", tip: "End by asking: would you like one?" },
];

export const MAX_SCORE = RUBRIC.reduce((s, r) => s + r.points, 0);

export interface SalesFeedback {
  score: number;
  maxScore: number;
  /** One thing done well and one thing to improve; never a grade shown as failure. */
  highlight: string;
  improvement: string | null;
}

export function evaluateSale(tags: SalesTags): SalesFeedback {
  const score = RUBRIC.reduce((s, r) => s + (tags[r.key] ? r.points : 0), 0);
  const done = RUBRIC.filter((r) => tags[r.key]).sort((a, b) => b.points - a.points);
  const missing = RUBRIC.filter((r) => !tags[r.key]).sort((a, b) => b.points - a.points);
  return {
    score,
    maxScore: MAX_SCORE,
    highlight: done[0]?.praise ?? "You were brave enough to try. That is the first step!",
    improvement: missing[0]?.tip ?? null,
  };
}

export const MAX_CUSTOMER_TURNS = 3;

export const SALES_SCENARIOS = [
  { id: "too_expensive", opening: "Hmm, that looks expensive." },
  { id: "no_money_today", opening: "I don't have money today." },
  { id: "not_sure", opening: "I'm not sure I like that flavor." },
] as const;
