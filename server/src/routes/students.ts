// Students, businesses, path progress, learnings and jars (RF-01..RF-04, RF-15, RF-23).

import { Router } from "express";
import { z } from "zod";
import {
  applyEvent,
  completePhase,
  gardenStage,
  PHASES,
  splitProfit,
  WORLDS,
  GROWTH_MODULES,
  type BadgeType,
  type ProgressState,
} from "../core/index.js";
import type { Business, Store } from "../db/store.js";

const NICKNAME = z
  .string()
  .trim()
  .min(2)
  .max(20)
  // Nicknames only: no digits (phone numbers) or @ (emails) (RNF-04).
  .regex(/^[\p{L} _-]+$/u, "letters only");

export class NotFoundError extends Error {}

/** Badges earned by completing a phase, decided from the confirmed phase result. */
function badgesFor(phaseKey: string, result: Record<string, unknown>): BadgeType[] {
  const badges: BadgeType[] = [];
  if (phaseKey === "validate") badges.push("customer_detective");
  if (phaseKey === "cashbox" && result.matches === true) badges.push("clear_accounts");
  if (phaseKey === "sales" && typeof result.score === "number" && result.score === result.maxScore) badges.push("good_host");
  if (phaseKey === "sales" && Number(result.realSales) > 0) badges.push("first_sale");
  return badges;
}

export function studentsRouter(store: Store): Router {
  const router = Router();

  const studentOr404 = (id: string) => {
    const s = store.getStudent(id);
    if (!s) throw new NotFoundError("student");
    return s;
  };
  const businessOr404 = (id: string) => {
    const b = store.getBusiness(id);
    if (!b) throw new NotFoundError("business");
    return b;
  };
  const withGarden = (progress: ProgressState) => ({ ...progress, garden: gardenStage(progress.missionsCompleted) });

  router.get("/path", (_req, res) => {
    res.json({ worlds: WORLDS, phases: PHASES, growthModules: GROWTH_MODULES });
  });

  router.post("/students", (req, res) => {
    const body = z
      .object({
        nickname: NICKNAME,
        avatar: z.string().min(1).max(40),
        ageRange: z.enum(["8-12", "13-18"]),
        classCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,8}$/).nullable().optional(),
      })
      .parse(req.body);
    const s = store.createStudent(body);
    res.status(201).json({ ...s, progress: withGarden(s.progress) });
  });

  router.get("/students/:id", (req, res) => {
    const s = studentOr404(req.params.id);
    res.json({ ...s, progress: withGarden(s.progress), businesses: store.businessesOf(s.id) });
  });

  // RF-02: an adult confirms they are present before camera and microphone unlock.
  router.post("/students/:id/consent", (req, res) => {
    const { adultPresent } = z.object({ adultPresent: z.boolean() }).parse(req.body);
    studentOr404(req.params.id);
    store.setConsent(req.params.id, adultPresent);
    res.json({ adultConsent: adultPresent });
  });

  router.post("/businesses", (req, res) => {
    const body = z
      .object({ studentId: z.string(), entry: z.enum(["no_idea", "has_idea", "already_selling"]), idea: z.string().max(200).nullable().optional() })
      .parse(req.body);
    studentOr404(body.studentId);
    res.status(201).json(store.createBusiness(body.studentId, body.entry, body.idea ?? null));
  });

  router.get("/businesses/:id", (req, res) => {
    const b = businessOr404(req.params.id);
    res.json({ ...b, learnings: store.learningsOf(b.id) });
  });

  router.patch("/businesses/:id", (req, res) => {
    const { idea } = z.object({ idea: z.string().max(200) }).parse(req.body);
    res.json(store.updateBusiness({ ...businessOr404(req.params.id), idea }));
  });

  // Completing a phase stores its confirmed result, unlocks the next phase and grows the garden.
  router.post("/businesses/:id/phases/:phase/complete", (req, res) => {
    const body = z
      .object({ result: z.record(z.string(), z.unknown()).default({}), date: z.iso.date().optional() })
      .parse(req.body);
    const phaseId = Number(req.params.phase);
    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase) throw new NotFoundError("phase");

    const business = businessOr404(req.params.id);
    const student = studentOr404(business.studentId);
    const updated: Business = store.updateBusiness({
      ...business,
      statuses: completePhase(business.statuses, phaseId),
      data: { ...business.data, [phase.key]: body.result },
    });

    let progress = applyEvent(student.progress, {
      type: "mission_completed",
      phase: phaseId,
      date: body.date ?? new Date().toISOString().slice(0, 10),
    });
    const newBadges = badgesFor(phase.key, body.result).filter((b) => !progress.badges.includes(b));
    for (const badge of newBadges) progress = applyEvent(progress, { type: "badge_earned", badge });
    store.saveProgress(student.id, progress);

    res.json({ business: updated, progress: withGarden(progress), newBadges });
  });

  // Learning book: stumbles become hints and earn the Brave Stumble badge.
  router.post("/businesses/:id/learnings", (req, res) => {
    const body = z.object({ kind: z.enum(["stumble", "win"]), text: z.string().min(1).max(500), hint: z.string().max(300).nullable().optional() }).parse(req.body);
    const business = businessOr404(req.params.id);
    const learning = store.addLearning(business.id, body.kind, body.text, body.hint ?? null);
    const student = studentOr404(business.studentId);
    let newBadges: BadgeType[] = [];
    if (body.kind === "stumble" && !student.progress.badges.includes("brave_stumble")) {
      store.saveProgress(student.id, applyEvent(student.progress, { type: "badge_earned", badge: "brave_stumble" }));
      newBadges = ["brave_stumble"];
    }
    res.status(201).json({ learning, newBadges });
  });

  router.post("/businesses/:id/jars/split", (req, res) => {
    const body = z.object({ profit: z.number().int().nonnegative(), businessShare: z.number().min(0).max(1) }).parse(req.body);
    const business = businessOr404(req.params.id);
    const result = splitProfit(business.jars, body.profit, body.businessShare);
    store.updateBusiness({ ...business, jars: { business: result.business, personal: result.personal } });
    res.json(result);
  });

  return router;
}
