import express, { type ErrorRequestHandler } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { NeedsConfirmationError } from "./agent/tools.js";
import { PhaseLockedError } from "./core/index.js";
import { isMockMode, MetaApiError } from "./meta/client.js";
import { Store } from "./db/store.js";
import { aiRouter } from "./routes/ai.js";
import { calcRouter } from "./routes/calc.js";
import { NotFoundError, studentsRouter } from "./routes/students.js";
import { teacherRouter } from "./routes/teacher.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp(store = new Store()) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  // The web fallback of the app runs on another origin. No cookies are used, so a wildcard is safe.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-student-id");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    if (req.method === "OPTIONS") return void res.sendStatus(204);
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, mockModels: isMockMode() });
  });
  app.use("/api", studentsRouter(store));
  app.use("/api/calc", calcRouter);
  app.use("/api/ai", aiRouter(store));
  app.use("/api/teacher", teacherRouter(store));
  app.use("/teacher", express.static(path.join(here, "..", "public", "teacher")));

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) return void res.status(400).json({ error: "invalid_request", issues: err.issues });
    if (err instanceof RangeError) return void res.status(400).json({ error: "invalid_numbers", message: err.message });
    if (err instanceof NotFoundError) return void res.status(404).json({ error: `${err.message}_not_found` });
    if (err instanceof NeedsConfirmationError) return void res.status(422).json({ error: "needs_confirmation", tool: err.tool });
    if (err instanceof MetaApiError) {
      console.error(err.message);
      return void res.status(502).json({ error: "model_unavailable" });
    }
    if (err instanceof PhaseLockedError) return void res.status(409).json({ error: "phase_locked", phase: err.phaseId });
    console.error(err);
    res.status(500).json({ error: "internal" });
  };
  app.use(onError);
  return app;
}
