// Endpoints that call Meta models through the agent tools. Camera and microphone results are
// only accepted once an adult has confirmed they are present (F7, RF-02).

import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import * as tools from "../agent/tools.js";
import { CONCEPTS, personalizeLesson, PERSONAL_PHASES, type PersonalLesson } from "../agent/personalize.js";
import { personalizeGames } from "../agent/personalizeGames.js";
import { SALES_SCENARIOS } from "../core/index.js";
import type { Store } from "../db/store.js";

// Media is held in memory only and dropped after the request (photos and audio are never stored).
const multipart = multer({ storage: multer.memoryStorage(), limits: { fileSize: 32 * 1024 * 1024 } });

/**
 * Accepts a file either as multipart form data (web) or as base64 in JSON (the iPhone app: React
 * Native's multipart uploads of local files are unreliable). Either way the route sees `req.file`.
 */
const upload = {
  single: (field: string): RequestHandler => {
    const parseMultipart = multipart.single(field);
    return (req, res, next) =>
      parseMultipart(req, res, (err?: unknown) => {
        if (err) return next(err);
        const b64 = req.body?.fileBase64;
        if (!req.file && typeof b64 === "string") {
          const buffer = Buffer.from(b64, "base64");
          req.file = { fieldname: field, originalname: field, mimetype: String(req.body.mimeType ?? "application/octet-stream"), buffer, size: buffer.length } as Express.Multer.File;
        }
        next();
      });
  },
};

const toDataUrl = (file: Express.Multer.File) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

function requireFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file) throw new z.ZodError([{ code: "custom", path: ["file"], message: "file is required", input: undefined }]);
  return file;
}

const history = z.array(z.object({ role: z.enum(["kid", "customer"]), text: z.string().max(1000) })).max(8);

export function aiRouter(store: Store): Router {
  const router = Router();

  const requireAdultConsent: RequestHandler = (req, res, next) => {
    const student = store.getStudent(String(req.header("x-student-id") ?? ""));
    if (!student) return void res.status(401).json({ error: "unknown_student" });
    if (!student.adultConsent) return void res.status(403).json({ error: "adult_consent_required" });
    next();
  };

  router.post("/transcribe", requireAdultConsent, upload.single("audio"), async (req, res) => {
    res.json(await tools.transcribeVoice(requireFile(req.file).buffer));
  });

  router.post("/ideas", async (req, res) => {
    const { kidSaid } = z.object({ kidSaid: z.string().min(1).max(2000) }).parse(req.body);
    res.json(await tools.discoverIdeas(kidSaid));
  });

  router.post("/golden-circle", async (req, res) => {
    const { kidSaid, idea } = z.object({ kidSaid: z.string().min(1).max(2000), idea: z.string().min(1).max(200) }).parse(req.body);
    res.json(await tools.goldenCircle(kidSaid, idea));
  });

  router.post("/interviews", async (req, res) => {
    const { idea, transcripts } = z
      .object({ idea: z.string().min(1).max(200), transcripts: z.array(z.string().max(4000)).min(1).max(10) })
      .parse(req.body);
    res.json(await tools.summarizeInterviewTranscripts(idea, transcripts));
  });

  router.post("/read-prices", requireAdultConsent, upload.single("image"), async (req, res) => {
    const lookingFor = z.string().min(1).parse(req.body.lookingFor).split(",").map((s) => s.trim());
    res.json(await tools.readPricePhoto(toDataUrl(requireFile(req.file)), lookingFor));
  });

  router.post("/count", requireAdultConsent, upload.single("image"), async (req, res) => {
    const noun = z.string().min(1).max(40).parse(req.body.noun);
    const { count, needsConfirmation, boxes } = await tools.countObjects(toDataUrl(requireFile(req.file)), noun);
    // Box positions let the app draw SAM's masks over the photo while it counts; the photo is not kept.
    res.json({ count, needsConfirmation, width: boxes[0]?.w ?? null, height: boxes[0]?.h ?? null, boxes: boxes.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 })) });
  });

  router.post("/coins", requireAdultConsent, upload.single("image"), async (req, res) => {
    res.json(await tools.classifyCoins(toDataUrl(requireFile(req.file))));
  });

  router.post("/brand", async (req, res) => {
    const body = z.object({ idea: z.string().max(200), why: z.string().max(400), what: z.string().max(400) }).parse(req.body);
    res.json(await tools.createBrand(body));
  });

  router.post("/poster", async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).max(40),
        slogan: z.string().max(80),
        product: z.string().min(1).max(80),
        price: z.number().int().positive().optional(),
        colors: z.array(z.string()).max(3).optional(),
      })
      .parse(req.body);
    res.json(await tools.generatePoster(body));
  });

  router.get("/sales-scenarios", (_req, res) => {
    res.json({ scenarios: SALES_SCENARIOS });
  });

  router.post("/customer", async (req, res) => {
    const body = z
      .object({ scenario: z.string().max(200), product: z.string().max(80), price: z.number().int().nonnegative(), history })
      .parse(req.body);
    res.json(await tools.simulateCustomer(body));
  });

  router.post("/evaluate-sale", async (req, res) => {
    const body = z.object({ objection: z.string().max(200), history }).parse(req.body);
    res.json(await tools.evaluateSaleConversation(body.history, body.objection));
  });

  router.post("/mascot", async (req, res) => {
    const body = z
      .object({ situation: z.string().max(500), facts: z.record(z.string(), z.union([z.string(), z.number()])).optional() })
      .parse(req.body);
    res.json(await tools.mascotSay(body.situation, body.facts));
  });

  // "Now with YOUR idea": a worked example and a question about the kid's own business.
  // Cached per phase and idea, so each lesson costs one model call at most.
  router.post("/personalize", async (req, res) => {
    const { businessId, phase } = z.object({ businessId: z.string(), phase: z.string().max(40) }).parse(req.body);
    const business = store.getBusiness(businessId);
    if (!business) return void res.status(404).json({ error: "business_not_found" });
    if (!business.idea || !PERSONAL_PHASES.has(phase)) return void res.json({ lesson: null });

    const cache = (business.data.personal ?? {}) as Record<string, { idea: string; lesson: PersonalLesson }>;
    if (cache[phase]?.idea === business.idea) return void res.json({ lesson: cache[phase].lesson, cached: true });

    const card = (business.data.golden_circle ?? {}) as { why?: string; how?: string; what?: string };
    const student = store.getStudent(business.studentId);
    const lesson = await personalizeLesson(phase, { idea: business.idea, ...card, ageRange: student?.ageRange });
    if (lesson) {
      const fresh = store.getBusiness(businessId) ?? business;
      const personal = { ...((fresh.data.personal ?? {}) as object), [phase]: { idea: business.idea, lesson } };
      store.updateBusiness({ ...fresh, data: { ...fresh.data, personal } });
    }
    res.json({ lesson });
  });

  // The phase's practice games, reworded around the kid's idea with the same answer key.
  router.post("/personalize-games", async (req, res) => {
    const body = z
      .object({
        businessId: z.string(),
        phase: z.string().max(40),
        games: z.array(z.object({ id: z.string().max(40), kind: z.enum(["quiz", "pictures", "blank", "order", "lightning", "pairs", "sort"]), spec: z.record(z.string(), z.unknown()) })).max(8),
      })
      .parse(req.body);
    const business = store.getBusiness(body.businessId);
    if (!business) return void res.status(404).json({ error: "business_not_found" });
    if (!business.idea || !CONCEPTS[body.phase]) return void res.json({ games: {} });

    const cache = (business.data.personalGames ?? {}) as Record<string, { idea: string; games: Record<string, unknown> }>;
    if (cache[body.phase]?.idea === business.idea) return void res.json({ games: cache[body.phase].games, cached: true });

    const card = (business.data.golden_circle ?? {}) as { why?: string; how?: string; what?: string };
    const student = store.getStudent(business.studentId);
    const games = await personalizeGames({ idea: business.idea, ...card, ageRange: student?.ageRange }, CONCEPTS[body.phase], body.games);
    if (Object.keys(games).length) {
      const fresh = store.getBusiness(body.businessId) ?? business;
      const personalGames = { ...((fresh.data.personalGames ?? {}) as object), [body.phase]: { idea: business.idea, games } };
      store.updateBusiness({ ...fresh, data: { ...fresh.data, personalGames } });
    }
    res.json({ games });
  });

  router.post("/tutor", async (req, res) => {
    const body = z
      .object({
        topic: z.string().min(1).max(200),
        step: z
          .object({
            prompt: z.string().max(500).optional(),
            options: z.array(z.string().max(200)).max(8).optional(),
            answer: z.string().max(200).optional(),
            explain: z.string().max(500).optional(),
          })
          .optional(),
        history: z.array(z.object({ role: z.enum(["kid", "mileto"]), text: z.string().max(1000) })).max(12),
        message: z.string().min(1).max(1000),
      })
      .parse(req.body);
    res.json(await tools.tutorReply(body));
  });

  router.post("/pitch", async (req, res) => {
    const { transcript } = z.object({ transcript: z.string().min(1).max(4000) }).parse(req.body);
    res.json(await tools.pitchFeedback(transcript));
  });

  return router;
}
