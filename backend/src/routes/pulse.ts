// ── NiiDo Pulse Route ────────────────────────────────────────
import { Router, Request, Response } from "express";
export const pulseRouter = Router();

// GET /api/pulse/school/:schoolId
pulseRouter.get("/school/:schoolId", async (req: Request, res: Response) => {
  // TODO: fetch from Firestore and aggregate
  res.json({
    schoolId:              req.params.schoolId,
    totalStudents:         0,
    totalTeachers:         0,
    readCompletionRate:    0,
    trackDistribution:     { visual: 0, auditory: 0, kinesthetic: 0, readwrite: 0, multimodal: 0 },
    lessonsGeneratedThisWeek: 0,
    activeTeachersToday:   0,
    supportNeedsCount:     0,
    lastUpdated:           new Date().toISOString(),
  });
});
