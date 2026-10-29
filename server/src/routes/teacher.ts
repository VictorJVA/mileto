// Teacher dashboard data (RF-16): where each student is on the path and where they got stuck.

import { Router } from "express";
import { gardenStage, PHASES } from "../core/index.js";
import type { Store } from "../db/store.js";

export function teacherRouter(store: Store): Router {
  const router = Router();

  router.get("/classes/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    const students = store.studentsInClass(code).map((s) => {
      const business = store.businessesOf(s.id)[0] ?? null;
      const current = business ? PHASES.find((p) => business.statuses[p.id] === "available") ?? null : null;
      const stumbles = business ? store.learningsOf(business.id).filter((l) => l.kind === "stumble").length : 0;
      const daysIdle = s.progress.lastActiveDate
        ? Math.floor((Date.now() - Date.parse(s.progress.lastActiveDate)) / 86_400_000)
        : null;
      return {
        nickname: s.nickname,
        avatar: s.avatar,
        ageRange: s.ageRange,
        idea: business?.idea ?? null,
        currentPhase: current ? { id: current.id, title: current.title, world: current.world } : null,
        phasesDone: business ? Object.values(business.statuses).filter((v) => v === "done").length : 0,
        seeds: s.progress.seeds,
        streak: s.progress.streak,
        garden: gardenStage(s.progress.missionsCompleted),
        badges: s.progress.badges,
        stumbles,
        // Quiet for 4+ days: a nudge for the teacher, never for the kid.
        needsHelp: daysIdle !== null && daysIdle >= 4,
      };
    });

    const stuckByPhase: Record<string, number> = {};
    for (const s of students) if (s.currentPhase) stuckByPhase[s.currentPhase.title] = (stuckByPhase[s.currentPhase.title] ?? 0) + 1;
    res.json({ classCode: code, students, stuckByPhase });
  });

  return router;
}
