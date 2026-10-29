// Pure calculation endpoints. Every number the app shows comes from here or from src/core (RNF-03).

import { Router } from "express";
import { z } from "zod";
import {
  calculateCosts,
  checkIdea,
  closeCashbox,
  comparePrices,
  countCustomerSources,
  simulateScenarios,
  suggestPriceRange,
  PROMOTION_ACTIONS,
} from "../core/index.js";

const money = z.number().finite().nonnegative();
const count = z.number().int().nonnegative();

export const calcRouter = Router();

calcRouter.post("/costs", (req, res) => {
  const body = z
    .object({
      items: z.array(z.object({ name: z.string(), quantity: money, unitCost: money, store: z.string().optional() })),
      units: z.number().int().positive(),
      price: money,
    })
    .parse(req.body);
  res.json(calculateCosts(body));
});

calcRouter.post("/compare-prices", (req, res) => {
  const body = z
    .object({ quotes: z.array(z.object({ store: z.string(), item: z.string(), price: money, packSize: z.number().positive() })) })
    .parse(req.body);
  res.json(comparePrices(body.quotes));
});

calcRouter.post("/price-range", (req, res) => {
  res.json(suggestPriceRange(z.object({ unitCost: money, competitorPrices: z.array(money) }).parse(req.body)));
});

calcRouter.post("/cashbox", (req, res) => {
  const body = z
    .object({
      unitsAtOpen: count,
      unitsAtClose: count,
      price: money,
      soldByVoice: count.nullable().optional(),
      coins: z.record(z.string(), count).optional(),
    })
    .parse(req.body);
  res.json(closeCashbox(body));
});

calcRouter.post("/scenarios", (req, res) => {
  const body = z
    .object({
      week: z.object({ unitsSold: count, price: money, unitCost: money, profit: z.number().finite() }),
      options: z
        .object({ newPrice: money.optional(), demandChange: z.number().min(-1).max(5).optional(), saveShare: z.number().min(0).max(1).optional() })
        .optional(),
    })
    .parse(req.body);
  res.json({ scenarios: simulateScenarios(body.week, body.options), disclaimer: "These are guesses to test, not promises." });
});

calcRouter.post("/customer-sources", (req, res) => {
  const body = z.object({ sources: z.array(z.enum([...PROMOTION_ACTIONS, "other"])) }).parse(req.body);
  res.json(countCustomerSources(body.sources));
});

calcRouter.post("/idea-check", (req, res) => {
  const body = z
    .object({ canMakeIt: z.boolean(), someoneWantsIt: z.boolean(), isSafe: z.boolean(), cheapToStart: z.boolean() })
    .parse(req.body);
  res.json(checkIdea(body));
});
