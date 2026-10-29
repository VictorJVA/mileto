// Reinvestment scenarios (F5, RF-13). Every projection is a hypothesis with visible assumptions.

export interface WeekSummary {
  unitsSold: number;
  price: number;
  unitCost: number;
  /** Profit available to decide on. */
  profit: number;
}

export interface Scenario {
  id: "repeat" | "change_price" | "save_part";
  assumptions: string[];
  projectedUnits: number;
  projectedPrice: number;
  projectedProfit: number;
  savedNow: number;
}

export interface ScenarioOptions {
  /** New price for the change_price scenario. */
  newPrice?: number;
  /** Assumed change in units sold when the price changes, e.g. -0.2 for 20% fewer. */
  demandChange?: number;
  /** Share of profit kept aside in save_part, 0..1. */
  saveShare?: number;
}

export function simulateScenarios(week: WeekSummary, options: ScenarioOptions = {}): Scenario[] {
  const { unitsSold, price, unitCost, profit } = week;
  const newPrice = options.newPrice ?? Math.round(price * 1.2);
  const demandChange = options.demandChange ?? (newPrice > price ? -0.2 : newPrice < price ? 0.2 : 0);
  const saveShare = clamp(options.saveShare ?? 0.5, 0, 1);

  const repeatProfit = (price - unitCost) * unitsSold;
  const changedUnits = Math.max(0, Math.round(unitsSold * (1 + demandChange)));
  const savedNow = Math.round(profit * saveShare);
  // Saving part of the profit leaves less money to buy stock next week.
  const affordableUnits = unitCost > 0 ? Math.floor((unitCost * unitsSold - savedNow + profit) / unitCost) : unitsSold;
  const saveUnits = Math.min(unitsSold, Math.max(0, affordableUnits));

  return [
    {
      id: "repeat",
      assumptions: ["Same price", "Same number of customers", "Same costs"],
      projectedUnits: unitsSold,
      projectedPrice: price,
      projectedProfit: Math.round(repeatProfit),
      savedNow: 0,
    },
    {
      id: "change_price",
      assumptions: [
        `Price goes from ${price} to ${newPrice}`,
        `Sales change by ${Math.round(demandChange * 100)}% (a guess to test)`,
        "Same costs",
      ],
      projectedUnits: changedUnits,
      projectedPrice: newPrice,
      projectedProfit: Math.round((newPrice - unitCost) * changedUnits),
      savedNow: 0,
    },
    {
      id: "save_part",
      assumptions: [`Keep ${Math.round(saveShare * 100)}% of the profit aside`, "Buy only the stock the rest can pay for"],
      projectedUnits: saveUnits,
      projectedPrice: price,
      projectedProfit: Math.round((price - unitCost) * saveUnits),
      savedNow,
    },
  ];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
