// ── NiiDo My Learning Route — self-paced, self-guided content for one student ──
import { Router, Request, Response } from "express";
import { z } from "zod";
import { TutorAgent } from "../services/agents/TutorAgent";
import { eduPromptConfigured, generateLessonViaEduPrompt, humanizeGrade, humanizeLanguage, styleForLearningTrack } from "../services/eduprompt";
import { generateLessonIllustration } from "../services/openaiImages";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole } from "../middleware/auth";

export const learnRouter = Router();

learnRouter.use(requireAuth, requireRole("student"));

// Free accounts get a taste of My Learning instead of a hard paywall —
// a small number of generations per day, reset at UTC midnight. Premium
// is unlimited. Deliberately not requirePremium at the router level
// anymore; the check now happens inside /generate so it can tell the
// difference between "never had access" and "used today's free lessons",
// which the frontend needs to show the right message.
const FREE_DAILY_LIMIT = 2;

async function countTodaysGenerations(studentId: string): Promise<number> {
  const startOfDayUTC = new Date();
  startOfDayUTC.setUTCHours(0, 0, 0, 0);
  const snap = await db.collection("learningContent")
    .where("studentId", "==", studentId)
    .where("createdAt", ">=", Timestamp.fromDate(startOfDayUTC))
    .count()
    .get();
  return snap.data().count;
}

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
    const isPremium = req.authUser!.subscriptionTier === "premium";

    if (!isPremium) {
      const usedToday = await countTodaysGenerations(studentId);
      if (usedToday >= FREE_DAILY_LIMIT) {
        return res.status(403).json({
          error: `You've used today's ${FREE_DAILY_LIMIT} free lessons — upgrade to NiiDo Premium for unlimited access, or come back tomorrow.`,
          code: "DAILY_LIMIT_REACHED",
          limit: FREE_DAILY_LIMIT,
          used: usedToday,
        });
      }
    }

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

    // Allocated up front (not via .add()) so the image, if generated, can be
    // stored at a path keyed by this content's own ID.
    const docRef = db.collection("learningContent").doc();

    // An illustration is only generated for learners it actually helps —
    // visual and multimodal tracks — and never blocks the lesson text if
    // it fails or isn't configured (see generateLessonIllustration).
    const imageUrl = ["visual", "multimodal"].includes(profile.primaryTrack)
      ? await generateLessonIllustration({
          subject: data.subject,
          topic: data.topic,
          gradeLabel: humanizeGrade(grade),
          studentId,
          contentId: docRef.id,
        })
      : null;

    const createdAt = Timestamp.now();
    await docRef.set({
      studentId,
      schoolId: req.authUser!.schoolId,
      subject: data.subject,
      topic: data.topic,
      sections,
      provider,
      contentType,
      imageUrl,
      createdAt,
    });

    res.json({
      success: true,
      content: { subject: data.subject, topic: data.topic, sections, provider, contentType, imageUrl },
      contentId: docRef.id,
      createdAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate learning content" });
  }
});

// GET /api/learn/usage — lets the frontend show "X of Y free lessons left
// today" up front, rather than the student only finding out by hitting
// the limit on submit.
learnRouter.get("/usage", async (req: Request, res: Response) => {
  try {
    const isPremium = req.authUser!.subscriptionTier === "premium";
    const usedToday = isPremium ? 0 : await countTodaysGenerations(req.authUser!.uid);
    res.json({ isPremium, usedToday, limit: FREE_DAILY_LIMIT, remaining: isPremium ? null : Math.max(0, FREE_DAILY_LIMIT - usedToday) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check usage" });
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
