// Demo scenes for recording the video: each one creates a fresh player (Sofi, who sells custom
// stickers) with the earlier phases already done, so a clip can start right at its scene.
// The models still run for real during the scene; only the history before it is prepared.

import { Router } from "express";
import { z } from "zod";
import { applyEvent, completePhase, initialProgress, type BadgeType } from "../core/index.js";
import type { Business, Store } from "../db/store.js";
import { seed } from "../db/seed.js";

const DATA: Record<string, Record<string, unknown>> = {
  discover: { idea: "Custom stickers", said: "I like drawing and I have a tablet" },
  choose: { canMakeIt: true, someoneWantsIt: true, isSafe: true, cheapToStart: true, score: 4 },
  golden_circle: {
    why: "Classmates love decorating their notebooks and water bottles.",
    how: "I draw every design on my tablet, with their favorite characters.",
    what: "Custom stickers.",
  },
  validate: { interviews: 5, interested: 3, notInterested: 1, unclear: 1, interestRate: 0.6, priceRange: { min: 1000, max: 2500, median: 2000 }, decision: "keep_going" },
  shopping: { item: "sticker paper", cheapestStore: "Market", bestUnitPrice: 1200 },
  capital: { startingMoney: 10000, source: "savings", debt: 0 },
  test_batch: { units: 10, opinions: ["So cute! Can you make one of my cat?"] },
  price: { items: [{ name: "sticker paper", quantity: 5, unitCost: 1200 }], units: 20, price: 2000, totalCost: 6000, unitCost: 300, profitPerUnit: 1700, totalProfit: 34000, breakEvenUnits: 3 },
  brand: { name: "Sofi Stickers", slogan: "Your doodles, ready to stick", colors: ["#F59E0B", "#8B5CF6"], actions: ["word_of_mouth", "poster"], poster: true },
  sales: { scenario: "too_expensive", score: 5, maxScore: 5, realSales: 14, bestAction: "word_of_mouth" },
  cashbox: { unitsAtOpen: 20, unitsAtClose: 6, soldByCount: 14, soldByVoice: 14, matches: true, revenue: 28000, price: 2000 },
};

const ORDER = ["discover", "choose", "golden_circle", "validate", "shopping", "capital", "test_batch", "price", "brand", "sales", "cashbox"];
const ID: Record<string, number> = { discover: 1, choose: 2, golden_circle: 3, validate: 4, shopping: 5, capital: 6, test_batch: 7, price: 8, brand: 9, sales: 10, cashbox: 11 };

/** Where each scene starts: phases done before it, the screen to open, and the lesson step. */
const SCENES: Record<string, { entry: "no_idea" | "has_idea" | null; done: number; phase?: number; start?: string; state?: Record<string, unknown>; route?: string }> = {
  entry: { entry: null, done: 0, route: "/entry" },
  voice: { entry: "no_idea", done: 0, phase: 1, start: "talk" },
  choose: { entry: "no_idea", done: 1, phase: 2, start: "q-canMakeIt" },
  card: { entry: "no_idea", done: 2, phase: 3, start: "card", state: { why: DATA.golden_circle.why, how: DATA.golden_circle.how, what: DATA.golden_circle.what } },
  interviews: { entry: "no_idea", done: 3, phase: 4, start: "interviews" },
  tutor: { entry: "no_idea", done: 3, phase: 4, start: "half" },
  prices: { entry: "no_idea", done: 4, phase: 5, start: "store-1", state: { item: "sticker paper" } },
  poster: { entry: "no_idea", done: 8, phase: 9, start: "poster", state: { brand: { name: DATA.brand.name, slogan: DATA.brand.slogan, colors: DATA.brand.colors } } },
  sale: { entry: "no_idea", done: 9, phase: 10, start: "scenario" },
  cashbox: { entry: "no_idea", done: 10, phase: 11, start: "count-open", state: { noun: "round sticker" } },
  decide: { entry: "no_idea", done: 11, phase: 12, start: "choose" },
  garden: { entry: "no_idea", done: 11, route: "/garden" },
};

const BADGES: Partial<Record<string, BadgeType>> = { validate: "customer_detective", sales: "good_host", cashbox: "clear_accounts" };

export function demoRouter(store: Store): Router {
  const router = Router();

  router.get("/scenes", (_req, res) => {
    res.json({ scenes: Object.keys(SCENES) });
  });

  router.post("/scenes/:scene", (req, res) => {
    const name = z.enum(Object.keys(SCENES) as [string, ...string[]]).parse(req.params.scene);
    const scene = SCENES[name];
    if (store.studentsInClass("DEMO1").length === 0) seed(store);

    const student = store.createStudent({ nickname: "Sofi", avatar: "olive-2", ageRange: "8-12", classCode: "DEMO1" });
    store.setConsent(student.id, true);
    if (!scene.entry) return void res.json({ student: store.getStudent(student.id), business: null, route: { pathname: scene.route } });

    let business: Business = store.createBusiness(student.id, scene.entry, scene.done > 0 ? "Custom stickers" : null);
    let progress = initialProgress();
    const today = Date.now();
    ORDER.slice(0, scene.done).forEach((key, i) => {
      business = { ...business, statuses: completePhase(business.statuses, ID[key]), data: { ...business.data, [key]: DATA[key] } };
      // Spread missions over the last days so the streak looks like a real week of work.
      const date = new Date(today - Math.max(0, scene.done - 1 - i) * 86_400_000 * 0.5).toISOString().slice(0, 10);
      progress = applyEvent(progress, { type: "mission_completed", phase: ID[key], date });
      const badge = BADGES[key];
      if (badge) progress = applyEvent(progress, { type: "badge_earned", badge });
    });
    business = store.updateBusiness(business);
    store.saveProgress(student.id, progress);
    // The Brave Stumble badge is not pre-awarded: the garden scene earns it live by writing a stumble.

    const route = scene.route ? { pathname: scene.route } : { pathname: "/phase/[id]", params: { id: String(scene.phase), start: scene.start } };
    res.json({ student: store.getStudent(student.id), business: store.getBusiness(business.id), route, lessonState: scene.state ?? null });
  });

  return router;
}
