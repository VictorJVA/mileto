// Endpoints that call Meta models through the agent tools. Camera and microphone results are
// only accepted once an adult has confirmed they are present (F7, RF-02).

import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import * as tools from "../agent/tools.js";
import { SALES_SCENARIOS } from "../core/index.js";
import type { Store } from "../db/store.js";

// Media is held in memory only and dropped after the request (photos and audio are never stored).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 32 * 1024 * 1024 } });

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
    const { count, needsConfirmation } = await tools.countObjects(toDataUrl(requireFile(req.file)), noun);
    // Boxes stay on the server; the app only needs the number to ask "I see 20, is that right?".
    res.json({ count, needsConfirmation });
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

  router.post("/pitch", async (req, res) => {
    const { transcript } = z.object({ transcript: z.string().min(1).max(4000) }).parse(req.body);
    res.json(await tools.pitchFeedback(transcript));
  });

  return router;
}
