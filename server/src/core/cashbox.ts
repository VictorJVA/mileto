// Daily cash box (F4, RF-11, RF-12): sales come from opening minus closing counts.

export interface CashboxInput {
  unitsAtOpen: number;
  unitsAtClose: number;
  price: number;
  /** What the kid said in their voice note, if they gave a number. */
  soldByVoice?: number | null;
  /** Coins counted by camera or voice, as {denomination: count}. */
  coins?: Record<string, number>;
}

export interface CashboxResult {
  soldByCount: number;
  soldByVoice: number | null;
  matches: boolean | null;
  revenue: number;
  coinsTotal: number | null;
  /** Revenue minus coins on hand; positive means money is missing. Null without a coin count. */
  cashDifference: number | null;
}

export function closeCashbox(input: CashboxInput): CashboxResult {
  const { unitsAtOpen, unitsAtClose, price } = input;
  for (const [label, v] of [["unitsAtOpen", unitsAtOpen], ["unitsAtClose", unitsAtClose]] as const) {
    if (!Number.isInteger(v) || v < 0) throw new RangeError(`${label} must be a non-negative integer`);
  }
  if (unitsAtClose > unitsAtOpen) throw new RangeError("closing units cannot exceed opening units");
  if (!Number.isFinite(price) || price < 0) throw new RangeError("price must be a non-negative number");

  const soldByCount = unitsAtOpen - unitsAtClose;
  const soldByVoice = input.soldByVoice ?? null;
  const revenue = soldByCount * price;
  const coinsTotal = input.coins ? sumCoins(input.coins) : null;
  return {
    soldByCount,
    soldByVoice,
    matches: soldByVoice === null ? null : soldByVoice === soldByCount,
    revenue,
    coinsTotal,
    cashDifference: coinsTotal === null ? null : revenue - coinsTotal,
  };
}

export function sumCoins(coins: Record<string, number>): number {
  return Object.entries(coins).reduce((sum, [denomination, count]) => {
    const value = Number(denomination);
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`invalid denomination ${denomination}`);
    if (!Number.isInteger(count) || count < 0) throw new RangeError(`invalid count for ${denomination}`);
    return sum + value * count;
  }, 0);
}

/** Colombian coins in circulation, used to sanity-check classifier output. */
export const COP_COIN_DENOMINATIONS = [50, 100, 200, 500, 1000] as const;
