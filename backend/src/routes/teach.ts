// ── NiiDo Teach Route ────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateLessonPlan } from "../services/gemini";

export const teachRouter = Router();

const LessonSchema = z.object({
  subject:           z.string(),
  topic:             z.string().min(2).max(100),
  grade:             z.string(),
  duration:          z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(80)]),
  trackDistribution: z.record(z.string(), z.number()).optional().default({}),
  totalStudents:     z.number().min(1).max(200).optional().default(30),
  language:          z.enum(["en", "ha", "yo", "ig"]).optional().default("en"),
  channel:           z.enum(["web", "whatsapp"]).optional().default("web"),
});

// POST /api/teach/generate
teachRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const data = LessonSchema.parse(req.body);
    const lesson = await generateLessonPlan({
      subject:           data.subject as any,
      topic:             data.topic,
      grade:             data.grade as any,
      duration:          data.duration,
      trackDistribution: data.trackDistribution as any,
      totalStudents:     data.totalStudents,
      language:          data.language,
    });
    res.json({ success: true, lesson });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    res.status(500).json({ error: "Lesson generation failed" });
  }
});
