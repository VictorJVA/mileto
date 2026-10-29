import { describe, expect, it } from "vitest";
import {
  applyEvent,
  calculateCosts,
  checkIdea,
  closeCashbox,
  comparePrices,
  completePhase,
  countCustomerSources,
  evaluateSale,
  gardenStage,
  initialProgress,
  MAX_SCORE,
  mondayOf,
  simulateScenarios,
  spendFromBusiness,
  splitProfit,
  startingStatuses,
  suggestPriceRange,
  summarizeInterviews,
  sumCoins,
  updateStreak,
} from "../src/core/index.js";

// Mateo's orange juice: the demo business.
const juiceItems = [
  { name: "oranges", quantity: 30, unitCost: 300 },
  { name: "sugar", quantity: 1, unitCost: 2000 },
  { name: "cups", quantity: 20, unitCost: 100 },
];

describe("calculateCosts", () => {
  it("computes the juice unit cost and profit", () => {
    const r = calculateCosts({ items: juiceItems, units: 20, price: 1500 });
    expect(r.totalCost).toBe(13000);
    expect(r.unitCost).toBe(650);
    expect(r.profitPerUnit).toBe(850);
    expect(r.totalProfit).toBe(17000);
    expect(r.margin).toBeCloseTo(0.5667, 4);
    expect(r.breakEvenUnits).toBe(9);
  });
  it("reports no break-even when price is below cost", () => {
    const r = calculateCosts({ items: juiceItems, units: 20, price: 500 });
    expect(r.profitPerUnit).toBe(-150);
    expect(r.breakEvenUnits).toBeNull();
  });
  it("handles a zero price without dividing by zero", () => {
    expect(calculateCosts({ items: juiceItems, units: 20, price: 0 }).margin).toBe(0);
  });
  it("handles free materials", () => {
    const r = calculateCosts({ items: [], units: 5, price: 1000 });
    expect(r.totalCost).toBe(0);
    expect(r.breakEvenUnits).toBe(0);
  });
  it("rejects zero units", () => {
    expect(() => calculateCosts({ items: juiceItems, units: 0, price: 1000 })).toThrow(RangeError);
  });
  it("rejects fractional units", () => {
    expect(() => calculateCosts({ items: juiceItems, units: 2.5, price: 1000 })).toThrow(RangeError);
  });
  it("rejects negative costs", () => {
    expect(() => calculateCosts({ items: [{ name: "x", quantity: 1, unitCost: -1 }], units: 1, price: 1 })).toThrow();
  });
  it("rounds uneven unit costs", () => {
    expect(calculateCosts({ items: [{ name: "x", quantity: 1, unitCost: 1000 }], units: 3, price: 500 }).unitCost).toBe(333);
  });
});

describe("comparePrices", () => {
  it("finds the cheapest store per unit, not per pack", () => {
    const r = comparePrices([
      { store: "Corner shop", item: "oranges", price: 3000, packSize: 10 },
      { store: "Market", item: "oranges", price: 5000, packSize: 20 },
    ]);
    expect(r.cheapestStore).toBe("Market");
    expect(r.quotes.map((q) => q.pricePerUnit)).toEqual([300, 250]);
    expect(r.savingsPerUnit).toBe(50);
  });
  it("returns no winner on a tie", () => {
    const r = comparePrices([
      { store: "A", item: "cups", price: 1000, packSize: 10 },
      { store: "B", item: "cups", price: 2000, packSize: 20 },
    ]);
    expect(r.cheapestStore).toBeNull();
  });
  it("handles an empty list", () => {
    expect(comparePrices([]).cheapestStore).toBeNull();
  });
  it("rejects a zero pack size", () => {
    expect(() => comparePrices([{ store: "A", item: "x", price: 1, packSize: 0 }])).toThrow(RangeError);
  });
});

describe("suggestPriceRange", () => {
  it("never suggests below cost", () => {
    const r = suggestPriceRange({ unitCost: 650, competitorPrices: [500, 1500, 2000] });
    expect(r.low).toBe(650);
    expect(r.high).toBe(2000);
    expect(r.competitorAverage).toBe(1333);
  });
  it("falls back to 1.5x cost without competitors", () => {
    expect(suggestPriceRange({ unitCost: 1000, competitorPrices: [] })).toMatchObject({ low: 1000, high: 1500, competitorAverage: null });
  });
});

describe("closeCashbox", () => {
  it("sales are opening minus closing", () => {
    const r = closeCashbox({ unitsAtOpen: 20, unitsAtClose: 7, price: 1500, soldByVoice: 13 });
    expect(r.soldByCount).toBe(13);
    expect(r.revenue).toBe(19500);
    expect(r.matches).toBe(true);
  });
  it("flags a mismatch with the voice note", () => {
    expect(closeCashbox({ unitsAtOpen: 20, unitsAtClose: 7, price: 1500, soldByVoice: 12 }).matches).toBe(false);
  });
  it("leaves matches null without a voice note", () => {
    expect(closeCashbox({ unitsAtOpen: 5, unitsAtClose: 5, price: 1000 }).matches).toBeNull();
  });
  it("compares revenue with coins on hand", () => {
    const r = closeCashbox({ unitsAtOpen: 10, unitsAtClose: 8, price: 1500, coins: { "1000": 2, "500": 1 } });
    expect(r.coinsTotal).toBe(2500);
    expect(r.cashDifference).toBe(500);
  });
  it("rejects closing above opening", () => {
    expect(() => closeCashbox({ unitsAtOpen: 3, unitsAtClose: 4, price: 1 })).toThrow(RangeError);
  });
  it("rejects bad coin denominations", () => {
    expect(() => sumCoins({ abc: 1 })).toThrow(RangeError);
  });
});

describe("simulateScenarios", () => {
  const week = { unitsSold: 13, price: 1500, unitCost: 650, profit: 11050 };
  it("returns three scenarios", () => {
    expect(simulateScenarios(week).map((s) => s.id)).toEqual(["repeat", "change_price", "save_part"]);
  });
  it("repeat keeps the same profit", () => {
    expect(simulateScenarios(week)[0].projectedProfit).toBe(11050);
  });
  it("a higher price assumes fewer sales by default", () => {
    const s = simulateScenarios(week, { newPrice: 2000 })[1];
    expect(s.projectedUnits).toBe(10);
    expect(s.projectedProfit).toBe(13500);
  });
  it("save_part keeps the requested share aside", () => {
    expect(simulateScenarios(week, { saveShare: 0.3 })[2].savedNow).toBe(3315);
  });
  it("every scenario lists its assumptions", () => {
    for (const s of simulateScenarios(week)) expect(s.assumptions.length).toBeGreaterThan(0);
  });
});

describe("jars", () => {
  it("splits profit between business and personal", () => {
    expect(splitProfit({ business: 0, personal: 0 }, 11050, 0.6)).toMatchObject({ business: 6630, personal: 4420 });
  });
  it("does not allow spending more than the business jar holds", () => {
    expect(() => spendFromBusiness({ business: 100, personal: 5000 }, 200)).toThrow(RangeError);
  });
  it("rejects shares outside 0..1", () => {
    expect(() => splitProfit({ business: 0, personal: 0 }, 100, 1.2)).toThrow(RangeError);
  });
});

describe("progress", () => {
  it("gives seeds per mission", () => {
    const s = applyEvent(initialProgress(), { type: "mission_completed", date: "2026-10-28", phase: 1 });
    expect(s.seeds).toBe(10);
    expect(s.streak).toBe(1);
  });
  it("consecutive days grow the streak", () => {
    const a = updateStreak({ streak: 3, lastActiveDate: "2026-10-27", graceDaysLeft: 2, graceWeek: "2026-10-26" }, "2026-10-28");
    expect(a.streak).toBe(4);
  });
  it("a missed day is covered by a grace day", () => {
    const a = updateStreak({ streak: 3, lastActiveDate: "2026-10-26", graceDaysLeft: 2, graceWeek: "2026-10-26" }, "2026-10-28");
    expect(a).toMatchObject({ streak: 4, graceDaysLeft: 1 });
  });
  it("restarts gently when grace runs out", () => {
    const a = updateStreak({ streak: 5, lastActiveDate: "2026-10-26", graceDaysLeft: 0, graceWeek: "2026-10-26" }, "2026-10-28");
    expect(a.streak).toBe(1);
  });
  it("grace days refill each week", () => {
    const a = updateStreak({ streak: 5, lastActiveDate: "2026-11-01", graceDaysLeft: 0, graceWeek: "2026-10-26" }, "2026-11-03");
    expect(a).toMatchObject({ streak: 6, graceDaysLeft: 1, graceWeek: "2026-11-02" });
  });
  it("two missions on the same day count once", () => {
    const a = updateStreak({ streak: 2, lastActiveDate: "2026-10-28", graceDaysLeft: 2, graceWeek: "2026-10-26" }, "2026-10-28");
    expect(a.streak).toBe(2);
  });
  it("two missions on the same day both give seeds", () => {
    let s = applyEvent(initialProgress(), { type: "mission_completed", date: "2026-10-29", phase: 1 });
    s = applyEvent(s, { type: "mission_completed", date: "2026-10-29", phase: 2 });
    expect(s).toMatchObject({ seeds: 20, missionsCompleted: 2, streak: 1 });
  });
  it("badges are not duplicated", () => {
    let s = applyEvent(initialProgress(), { type: "badge_earned", badge: "clear_accounts" });
    s = applyEvent(s, { type: "badge_earned", badge: "clear_accounts" });
    expect(s.badges).toEqual(["clear_accounts"]);
  });
  it("garden grows with missions", () => {
    expect([0, 3, 6, 10].map(gardenStage)).toEqual(["seed", "sprout", "plant", "tree"]);
  });
  it("finds the Monday of a week", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26");
  });
});

describe("evaluateSale", () => {
  it("full marks with everything done", () => {
    const r = evaluateSale({ greeted: true, saidPrice: true, answeredObjection: true, closed: true });
    expect(r.score).toBe(MAX_SCORE);
    expect(r.improvement).toBeNull();
  });
  it("points out the most valuable improvement", () => {
    const r = evaluateSale({ greeted: true, saidPrice: true, answeredObjection: false, closed: true });
    expect(r.score).toBe(3);
    expect(r.improvement).toMatch(/expensive/);
  });
  it("always has something positive to say", () => {
    expect(evaluateSale({ greeted: false, saidPrice: false, answeredObjection: false, closed: false }).highlight).toBeTruthy();
  });
});

describe("validation", () => {
  it("passes an idea with one concern", () => {
    expect(checkIdea({ canMakeIt: true, someoneWantsIt: true, isSafe: true, cheapToStart: false }).passed).toBe(true);
  });
  it("never passes an unsafe idea", () => {
    const r = checkIdea({ canMakeIt: true, someoneWantsIt: true, isSafe: false, cheapToStart: true });
    expect(r).toMatchObject({ passed: false, needsAdult: true });
  });
  it("summarizes interviews in code", () => {
    const r = summarizeInterviews([
      { wouldBuy: true, priceMentioned: 1000 },
      { wouldBuy: true, priceMentioned: 2000 },
      { wouldBuy: false, priceMentioned: null },
      { wouldBuy: true, priceMentioned: 1500 },
      { wouldBuy: null, priceMentioned: 1200 },
    ]);
    expect(r).toMatchObject({ interested: 3, notInterested: 1, unclear: 1, interestRate: 0.6, decision: "keep_going" });
    expect(r.priceRange).toEqual({ min: 1000, max: 2000, median: 1350 });
  });
  it("suggests adjusting when interest is low", () => {
    const r = summarizeInterviews([{ wouldBuy: false, priceMentioned: null }, { wouldBuy: false, priceMentioned: null }, { wouldBuy: true, priceMentioned: 500 }]);
    expect(r.decision).toBe("adjust_idea");
  });
  it("asks for more interviews below three", () => {
    expect(summarizeInterviews([{ wouldBuy: true, priceMentioned: 1000 }]).decision).toBe("need_more_interviews");
  });
});

describe("promotion", () => {
  it("counts sources and picks the best action", () => {
    const r = countCustomerSources(["poster", "free_sample", "free_sample", "word_of_mouth", "other"]);
    expect(r.counts.free_sample).toBe(2);
    expect(r.best).toBe("free_sample");
  });
  it("returns no best action on a tie", () => {
    expect(countCustomerSources(["poster", "free_sample"]).best).toBeNull();
  });
});

describe("path", () => {
  it("no idea starts at phase 1", () => {
    expect(startingStatuses("no_idea")[1]).toBe("available");
  });
  it("has idea skips 1-3 and opens validation", () => {
    const s = startingStatuses("has_idea");
    expect([s[1], s[2], s[3], s[4]]).toEqual(["skipped", "skipped", "skipped", "available"]);
  });
  it("already selling opens the cash box but never skips validation", () => {
    const s = startingStatuses("already_selling");
    expect(s[11]).toBe("available");
    expect(s[4]).toBe("available");
  });
  it("completing a phase unlocks the next", () => {
    const s = completePhase(startingStatuses("no_idea"), 1);
    expect(s[1]).toBe("done");
    expect(s[2]).toBe("available");
  });
  it("phase 12 loops back to validation", () => {
    const all = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, "done"])) as Record<number, "done">;
    const s = completePhase({ ...all, 12: "available" }, 12);
    expect(s[4]).toBe("available");
  });
  it("locked phases cannot be completed", () => {
    expect(() => completePhase(startingStatuses("no_idea"), 5)).toThrow();
  });
});
