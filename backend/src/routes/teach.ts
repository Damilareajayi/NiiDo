// ── NiiDo Teach Route ────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateLessonPlan } from "../services/gemini";
import {
  eduPromptConfigured,
  generateLessonViaEduPrompt,
  humanizeGrade,
  humanizeSubject,
  humanizeLanguage,
} from "../services/eduprompt";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole } from "../middleware/auth";

export const teachRouter = Router();

const LessonSchema = z.object({
  subject:           z.string(),
  topic:             z.string().min(2).max(100),
  grade:             z.string(),
  duration:          z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(80)]),
  trackDistribution: z.record(z.string(), z.number()).optional().default({}),
  totalStudents:     z.number().min(1).max(200).optional().default(30),
  language:          z.string().optional(),
  curriculum:        z.string().optional(),
  style:             z.string().optional(),
  detail:            z.string().optional(),
  classSize:         z.string().optional(),
});

// POST /api/teach/generate
teachRouter.post("/generate", requireAuth, requireRole("teacher", "admin"), async (req: Request, res: Response) => {
  try {
    const data = LessonSchema.parse(req.body);

    let lesson: any;
    let provider: string;
    let contentType: "markdown" | "structured";

    // Convert language code (en/ha/yo/ig/fr) to full name if needed, or default to English
    let targetLanguage = data.language || "English";
    const humanizedLang = humanizeLanguage(targetLanguage);
    if (humanizedLang) {
      targetLanguage = humanizedLang;
    }

    try {
      if (!eduPromptConfigured) throw new Error("EduPrompt not configured");
      const { lesson: markdown, provider: eduProvider } = await generateLessonViaEduPrompt({
        subject:    humanizeSubject(data.subject),
        grade:      humanizeGrade(data.grade),
        topic:      data.topic,
        curriculum: data.curriculum,
        language:   targetLanguage,
        style:      data.style as any,
        detail:     data.detail as any,
        classSize:  data.classSize || `~${data.totalStudents} students`,
      });
      lesson = { markdown, provider: eduProvider };
      provider = eduProvider;
      contentType = "markdown";
    } catch (eduErr) {
      console.error("EduPrompt generation failed, falling back to Gemini:", eduErr instanceof Error ? eduErr.message : eduErr);
      const geminiLang = ["en", "ha", "yo", "ig", "fr"].includes(data.language || "")
        ? (data.language as any)
        : "en";
      lesson = await generateLessonPlan({
        subject:           data.subject as any,
        topic:             data.topic,
        grade:             data.grade as any,
        duration:          data.duration,
        trackDistribution: data.trackDistribution as any,
        totalStudents:     data.totalStudents,
        language:          geminiLang,
      });
      provider = "gemini";
      contentType = "structured";
    }

    const createdAt = Timestamp.now();
    const docRef = await db.collection("lessons").add({
      teacherId:        req.authUser!.uid,
      schoolId:         req.authUser!.schoolId,
      subject:           data.subject,
      topic:             data.topic,
      grade:             data.grade,
      duration:          data.duration,
      generatedContent:  lesson,
      provider,
      contentType,
      channel:           "web",
      createdAt,
    });

    res.json({ success: true, lesson, provider, contentType, lessonId: docRef.id, createdAt });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Lesson generation failed" });
  }
});
