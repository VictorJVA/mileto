// Two jars (F10, RF-23): business money and personal money never mix.

export interface Jars {
  business: number;
  personal: number;
}

export function splitProfit(jars: Jars, profit: number, businessShare: number): Jars & { toBusiness: number; toPersonal: number } {
  if (!Number.isFinite(profit) || profit < 0) throw new RangeError("profit must be a non-negative number");
  if (!(businessShare >= 0 && businessShare <= 1)) throw new RangeError("businessShare must be between 0 and 1");
  const toBusiness = Math.round(profit * businessShare);
  const toPersonal = profit - toBusiness;
  return {
    business: jars.business + toBusiness,
    personal: jars.personal + toPersonal,
    toBusiness,
    toPersonal,
  };
}

/** Spending from the business jar is only for the business; overdrawing is rejected (no debt by default). */
export function spendFromBusiness(jars: Jars, amount: number): Jars {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("amount must be a non-negative number");
  if (amount > jars.business) throw new RangeError("not enough money in the business jar");
  return { ...jars, business: jars.business - amount };
}
