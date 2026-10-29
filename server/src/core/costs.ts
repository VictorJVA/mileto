// Cost, price and profit math (RF-09, RF-10). Amounts are whole pesos (COP has no cents in daily use).

export interface CostItem {
  name: string;
  quantity: number;
  unitCost: number;
  store?: string;
}

export interface CostBreakdown {
  totalCost: number;
  units: number;
  unitCost: number;
  price: number;
  profitPerUnit: number;
  totalProfit: number;
  /** Profit as a share of price, 0..1. Negative when selling below cost. */
  margin: number;
  /** Units that must be sold at `price` to recover `totalCost`; null if price <= unit cost. */
  breakEvenUnits: number | null;
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be a non-negative number`);
}

export function itemsTotal(items: CostItem[]): number {
  return items.reduce((sum, item) => {
    assertNonNegative(item.quantity, `quantity of ${item.name}`);
    assertNonNegative(item.unitCost, `unit cost of ${item.name}`);
    return sum + item.quantity * item.unitCost;
  }, 0);
}

export function calculateCosts(input: { items: CostItem[]; units: number; price: number }): CostBreakdown {
  const { items, units, price } = input;
  if (!Number.isInteger(units) || units <= 0) throw new RangeError("units must be a positive integer");
  assertNonNegative(price, "price");

  const totalCost = itemsTotal(items);
  const unitCost = totalCost / units;
  const profitPerUnit = price - unitCost;
  return {
    totalCost: round(totalCost),
    units,
    unitCost: round(unitCost),
    price,
    profitPerUnit: round(profitPerUnit),
    totalProfit: round(profitPerUnit * units),
    margin: price === 0 ? 0 : round(profitPerUnit / price, 4),
    breakEvenUnits: profitPerUnit > 0 ? Math.ceil(totalCost / price) : null,
  };
}

export interface StoreQuote {
  store: string;
  item: string;
  price: number;
  /** How many units the price buys, e.g. a bag of 12 oranges. */
  packSize: number;
}

export interface PriceComparison {
  quotes: Array<StoreQuote & { pricePerUnit: number }>;
  cheapestStore: string | null;
  savingsPerUnit: number;
}

export function comparePrices(quotes: StoreQuote[]): PriceComparison {
  const withUnit = quotes.map((q) => {
    assertNonNegative(q.price, `price at ${q.store}`);
    if (q.packSize <= 0) throw new RangeError(`pack size at ${q.store} must be positive`);
    return { ...q, pricePerUnit: round(q.price / q.packSize, 2) };
  });
  if (withUnit.length === 0) return { quotes: [], cheapestStore: null, savingsPerUnit: 0 };

  const sorted = [...withUnit].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  const tie = sorted.length > 1 && sorted[1].pricePerUnit === cheapest.pricePerUnit;
  return {
    quotes: withUnit,
    cheapestStore: tie ? null : cheapest.store,
    savingsPerUnit: round(priciest.pricePerUnit - cheapest.pricePerUnit, 2),
  };
}

/** Suggests a price range from costs and what competitors charge. It is a hint, never a decision. */
export function suggestPriceRange(input: { unitCost: number; competitorPrices: number[] }): {
  floor: number;
  low: number;
  high: number;
  competitorAverage: number | null;
} {
  const floor = Math.ceil(input.unitCost);
  const prices = input.competitorPrices.filter((p) => Number.isFinite(p) && p > 0);
  const competitorAverage = prices.length ? round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  const low = Math.max(floor, prices.length ? Math.min(...prices) : floor);
  const high = Math.max(low, prices.length ? Math.max(...prices) : Math.ceil(floor * 1.5));
  return { floor, low, high, competitorAverage };
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
