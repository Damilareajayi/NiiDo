// ── NiiDo My Learning Route — self-paced, self-guided content for one student ──
import { Router, Request, Response } from "express";
import { z } from "zod";
import { TutorAgent } from "../services/agents/TutorAgent";
import { eduPromptConfigured, generateLessonViaEduPrompt, humanizeGrade, humanizeLanguage, styleForLearningTrack } from "../services/eduprompt";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole, requirePremium } from "../middleware/auth";

export const learnRouter = Router();

learnRouter.use(requireAuth, requireRole("student"), requirePremium);

// Subject is free text now — NiiDo serves learners of any discipline, not just
// the fixed K-12 subject list (e.g. "Organic Chemistry", "Constitutional Law").
const GenerateSchema = z.object({
  subject: z.string().min(2).max(100),
  topic:   z.string().min(2).max(100),
});

interface LearningSection {
  heading: string;
  body: string;
}

// Splits EduPrompt's markdown into self-paced steps a learner can click through
// at their own speed, rather than one long wall of text.
function splitMarkdownIntoSections(markdown: string): LearningSection[] {
  const lines = markdown.split("\n");
  const sections: LearningSection[] = [];
  let heading = "Overview";
  let body: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.*)/);
    if (headingMatch) {
      if (body.some((l) => l.trim())) sections.push({ heading, body: body.join("\n").trim() });
      heading = headingMatch[1].trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  if (body.some((l) => l.trim())) sections.push({ heading, body: body.join("\n").trim() });

  return sections.length > 0 ? sections : [{ heading: "Lesson", body: markdown.trim() }];
}

// POST /api/learn/generate
learnRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const data = GenerateSchema.parse(req.body);
    const studentId = req.authUser!.uid;

    const studentDoc = await db.collection("students").doc(studentId).get();
    const profile = studentDoc.data()?.readProfile;
    if (!profile) {
      return res.status(400).json({ error: "Complete your NiiDo Read assessment first" });
    }

    const grade = studentDoc.data()?.grade || "adult";
    const language = studentDoc.data()?.language || "en";

    let sections: LearningSection[];
    let provider: string;
    let contentType: "markdown" | "structured";

    try {
      if (!eduPromptConfigured) throw new Error("EduPrompt not configured");
      const { lesson: markdown, provider: eduProvider } = await generateLessonViaEduPrompt({
        subject:    data.subject,
        grade:      humanizeGrade(grade),
        topic:      data.topic,
        // Tailored to how this specific learner actually learns, not a
        // one-size-fits-all style — see styleForLearningTrack.
        style:      styleForLearningTrack(profile.primaryTrack),
        detail:     "standard",
        language:   humanizeLanguage(language),
      });
      sections = splitMarkdownIntoSections(markdown);
      provider = eduProvider;
      contentType = "markdown";
    } catch (eduErr) {
      console.error("EduPrompt generation failed, falling back to Gemini:", eduErr instanceof Error ? eduErr.message : eduErr);
      const content = await TutorAgent.generateLearningContent({
        studentName:    req.authUser!.name || "there",
        subject:        data.subject,
        topic:          data.topic,
        grade:          grade as any,
        primaryTrack:   profile.primaryTrack,
        secondaryTrack: profile.secondaryTrack,
        supportLevel:   profile.supportLevel,
        language,
      });
      sections = [
        { heading: "Let's learn", body: content.explanation },
        { heading: "Try this", body: content.activity },
        { heading: "Check yourself", body: content.practiceQuestion },
        { heading: "You've got this", body: content.encouragement },
      ];
      provider = "gemini";
      contentType = "structured";
    }

    const createdAt = Timestamp.now();
    const docRef = await db.collection("learningContent").add({
      studentId,
      schoolId: req.authUser!.schoolId,
      subject: data.subject,
      topic: data.topic,
      sections,
      provider,
      contentType,
      createdAt,
    });

    res.json({ success: true, content: { subject: data.subject, topic: data.topic, sections, provider, contentType }, contentId: docRef.id, createdAt });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate learning content" });
  }
});

// GET /api/learn/history
learnRouter.get("/history", async (req: Request, res: Response) => {
  try {
    const snap = await db.collection("learningContent")
      .where("studentId", "==", req.authUser!.uid)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch learning history" });
  }
});
