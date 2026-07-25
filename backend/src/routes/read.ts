import { Router, Request, Response } from "express";
import { z } from "zod";
import { DiagnosticAgent } from "../services/agents/DiagnosticAgent";
import { db, Timestamp } from "../firebase";
import { requireAuth } from "../middleware/auth";

export const readRouter = Router();

const AnalyseSchema = z.object({
  responses:  z.array(z.object({
    questionId:    z.string(),
    questionText:  z.string(),
    selectedOption: z.string(),
    indicatorType: z.string(),
    timeSpent:     z.number(),
  })),
  age:        z.number().min(4).max(99),
  grade:      z.string(),
  language:   z.enum(["en", "ha", "yo", "ig", "fr"]),
});

// POST /api/read/analyse
// Analyse assessment responses, save the LearnerDNA profile, and return it
readRouter.post("/analyse", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = AnalyseSchema.parse(req.body);
    const profile = await DiagnosticAgent.analyseAssessment({
      responses: data.responses as any,
      age:       data.age,
      grade:     data.grade as any,
      language:  data.language,
    });

    const studentId = req.authUser!.uid;
    const completedAt = Timestamp.now();
    await db.collection("students").doc(studentId).set({
      name:     req.authUser!.name,
      schoolId: req.authUser!.schoolId,
      grade:    data.grade,
      age:      data.age,
      language: data.language,
      readProfile: {
        ...profile,
        completedAt,
        rawResponses: data.responses,
      },
    }, { merge: true });

    res.json({ success: true, profile: { ...profile, completedAt, rawResponses: data.responses }, studentId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Assessment analysis failed" });
  }
});

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const translationCache: Record<string, typeof ASSESSMENT_QUESTIONS> = {};

async function translateQuestions(lang: string): Promise<typeof ASSESSMENT_QUESTIONS> {
  const langNames: Record<string, string> = {
    fr: "French", es: "Spanish", pt: "Portuguese", ar: "Arabic", sw: "Swahili",
    ha: "Hausa", yo: "Yoruba", ig: "Igbo", am: "Amharic", "zh-CN": "Chinese",
    hi: "Hindi", ur: "Urdu", bn: "Bengali", de: "German", ru: "Russian",
    ja: "Japanese", ko: "Korean", tr: "Turkish", id: "Indonesian"
  };

  const targetLang = langNames[lang];
  if (!targetLang) return ASSESSMENT_QUESTIONS;

  const prompt = `
You are an expert, context-aware educational translator.
Translate this JSON array of assessment questions into ${targetLang} (${lang}) for NiiDo, an adaptive learning platform.

Rigorously preserve:
1. All JSON keys ("id", "section", "text", "options", "label", "indicator") and the exact array structure.
2. The exact "id", "section", and "indicator" string values — do NOT translate these, keep them identical!
3. Brand names: NiiDo.

Only translate the "text" values and the "label" values within the options.
Your response MUST be a 100% syntactically valid JSON array. Do not return any introduction, markdown formatting, or notes.

Source English questions JSON:
${JSON.stringify(ASSESSMENT_QUESTIONS, null, 2)}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (err) {
    console.error(`Failed to translate assessment questions to ${targetLang}:`, err);
    return ASSESSMENT_QUESTIONS; // fallback to English
  }
}

// GET /api/read/questions
// Returns the 20 assessment questions, dynamically translated to the requested language
readRouter.get("/questions", async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || "en";
  if (lang === "en" || !["fr", "es", "pt", "ar", "sw", "ha", "yo", "ig", "am", "zh-CN", "hi", "ur", "bn", "de", "ru", "ja", "ko", "tr", "id"].includes(lang)) {
    return res.json({ questions: ASSESSMENT_QUESTIONS });
  }

  if (translationCache[lang]) {
    return res.json({ questions: translationCache[lang] });
  }

  const translated = await translateQuestions(lang);
  translationCache[lang] = translated;
  res.json({ questions: translated });
});

// ── Assessment Questions ──────────────────────────────────────
const ASSESSMENT_QUESTIONS = [
  // Section 1: Attention & Focus
  {
    id: "a1", section: "attention",
    text: "When your teacher is explaining something new, you understand it best when...",
    options: [
      { label: "You see a drawing or diagram on the board",  indicator: "visual" },
      { label: "The teacher explains it out loud clearly",   indicator: "auditory" },
      { label: "You get to try it yourself right away",      indicator: "kinesthetic" },
    ],
  },
  {
    id: "a2", section: "attention",
    text: "During a long lesson, you find it easier to pay attention when...",
    options: [
      { label: "There are colourful charts or pictures",     indicator: "visual" },
      { label: "The teacher uses interesting stories",       indicator: "auditory" },
      { label: "You can move around or do activities",       indicator: "kinesthetic" },
    ],
  },
  {
    id: "a3", section: "attention",
    text: "When you have to remember something important for an exam...",
    options: [
      { label: "You draw a picture or mind map",             indicator: "visual" },
      { label: "You say it out loud or make up a song",      indicator: "auditory" },
      { label: "You write it out many times",                indicator: "readwrite" },
    ],
  },
  {
    id: "a4", section: "attention",
    text: "When you are trying to concentrate on schoolwork, it is hardest when...",
    options: [
      { label: "The room is noisy or too bright",            indicator: "visual" },
      { label: "People around you are talking",              indicator: "auditory" },
      { label: "You have to sit still for too long",         indicator: "kinesthetic" },
    ],
  },
  {
    id: "a5", section: "attention",
    text: "After your teacher finishes explaining, you usually...",
    options: [
      { label: "Look at what was written on the board",      indicator: "visual" },
      { label: "Try to remember what was said",              indicator: "auditory" },
      { label: "Want to start doing the work immediately",   indicator: "kinesthetic" },
    ],
  },

  // Section 2: Learning Preferences
  {
    id: "p1", section: "preference",
    text: "You enjoy school most when...",
    options: [
      { label: "You are reading or writing something",       indicator: "readwrite" },
      { label: "You are doing a practical activity or game", indicator: "kinesthetic" },
      { label: "You are watching or looking at things",      indicator: "visual" },
    ],
  },
  {
    id: "p2", section: "preference",
    text: "When learning something new, you prefer...",
    options: [
      { label: "A teacher who shows you with examples",      indicator: "visual" },
      { label: "A teacher who explains it step by step",     indicator: "auditory" },
      { label: "Figuring it out by doing it yourself",       indicator: "kinesthetic" },
    ],
  },
  {
    id: "p3", section: "preference",
    text: "When doing your homework, you like to...",
    options: [
      { label: "Work quietly and read through everything",   indicator: "readwrite" },
      { label: "Have someone explain it to you",             indicator: "auditory" },
      { label: "Draw or make something to help you",         indicator: "visual" },
    ],
  },
  {
    id: "p4", section: "preference",
    text: "In group work at school, you usually...",
    options: [
      { label: "Prefer to read and write down ideas",        indicator: "readwrite" },
      { label: "Like to talk and share with the group",      indicator: "auditory" },
      { label: "Want to build or create something together", indicator: "kinesthetic" },
    ],
  },
  {
    id: "p5", section: "preference",
    text: "When you have free time at school, you usually choose to...",
    options: [
      { label: "Read a book or write a story",               indicator: "readwrite" },
      { label: "Play or be active with friends",             indicator: "kinesthetic" },
      { label: "Look at pictures, draw, or create art",      indicator: "visual" },
    ],
  },

  // Section 3: Challenge & Frustration
  {
    id: "c1", section: "challenge",
    text: "When schoolwork feels very hard, you usually...",
    options: [
      { label: "Ask the teacher to explain again",           indicator: "auditory" },
      { label: "Look for a picture or example to help",      indicator: "visual" },
      { label: "Take a short break and try again",           indicator: "kinesthetic" },
    ],
  },
  {
    id: "c2", section: "challenge",
    text: "When you get a question wrong in class, you feel...",
    options: [
      { label: "Fine — mistakes help you learn",             indicator: "kinesthetic" },
      { label: "A bit upset but you try again quietly",      indicator: "readwrite" },
      { label: "Embarrassed if others see or hear",          indicator: "auditory" },
    ],
  },
  {
    id: "c3", section: "challenge",
    text: "Which type of test do you find easiest?",
    options: [
      { label: "Writing long answers and essays",            indicator: "readwrite" },
      { label: "Drawing diagrams or labelling pictures",     indicator: "visual" },
      { label: "Practical tests where you do something",     indicator: "kinesthetic" },
    ],
  },
  {
    id: "c4", section: "challenge",
    text: "When you have a big project to complete, you...",
    options: [
      { label: "Make a plan and write a list first",         indicator: "readwrite" },
      { label: "Just start and figure it out as you go",     indicator: "kinesthetic" },
      { label: "Think about how it should look first",       indicator: "visual" },
    ],
  },
  {
    id: "c5", section: "challenge",
    text: "When you are bored in class, you tend to...",
    options: [
      { label: "Start drawing or doodling",                  indicator: "visual" },
      { label: "Talk to a classmate",                        indicator: "auditory" },
      { label: "Fidget or want to get up and move",          indicator: "kinesthetic" },
    ],
  },

  // Section 4: Social Learning
  {
    id: "s1", section: "social",
    text: "Do you prefer to learn...",
    options: [
      { label: "On your own quietly",                        indicator: "readwrite" },
      { label: "In a small group of 2-3 people",            indicator: "auditory" },
      { label: "With the whole class doing an activity",     indicator: "kinesthetic" },
    ],
  },
  {
    id: "s2", section: "social",
    text: "You learn the most when your teacher...",
    options: [
      { label: "Gives you written notes to study",           indicator: "readwrite" },
      { label: "Uses charts, drawings and colour",           indicator: "visual" },
      { label: "Lets you practice with a partner",           indicator: "kinesthetic" },
    ],
  },
  {
    id: "s3", section: "social",
    text: "When someone gives you instructions, it is easiest when they...",
    options: [
      { label: "Write them down for you",                    indicator: "readwrite" },
      { label: "Say them clearly out loud",                  indicator: "auditory" },
      { label: "Show you what to do",                        indicator: "visual" },
    ],
  },
  {
    id: "s4", section: "social",
    text: "After a school holiday, you most easily remember things when...",
    options: [
      { label: "You wrote notes about them",                 indicator: "readwrite" },
      { label: "Someone told you about them",                indicator: "auditory" },
      { label: "You were there doing them",                  indicator: "kinesthetic" },
    ],
  },
  {
    id: "s5", section: "social",
    text: "Your favourite type of school activity is...",
    options: [
      { label: "Science experiments or building things",     indicator: "kinesthetic" },
      { label: "Reading and writing stories or essays",      indicator: "readwrite" },
      { label: "Looking at maps, diagrams or watching demos", indicator: "visual" },
    ],
  },

  // Section 5: Sensory & Focus — richer signal on sensory sensitivity,
  // routine preference, sustained attention, and communication style.
  // Never diagnostic, never named conditions — same strengths-based
  // framing as every other section.
  {
    id: "se1", section: "sensory",
    text: "When there are bright lights or loud sounds around you, you...",
    options: [
      { label: "Find it hard to focus and prefer somewhere calmer", indicator: "sensory" },
      { label: "Don't really notice it either way",                indicator: "multimodal" },
      { label: "Actually like some background noise while working", indicator: "auditory" },
    ],
  },
  {
    id: "se2", section: "sensory",
    text: "When your daily plans suddenly change, you feel...",
    options: [
      { label: "I like knowing what to expect, so sudden change feels tricky at first", indicator: "routine" },
      { label: "I enjoy surprises and new things happening",     indicator: "kinesthetic" },
      { label: "I adjust quickly either way",                    indicator: "multimodal" },
    ],
  },
  {
    id: "se3", section: "sensory",
    text: "When you're really interested in something, you...",
    options: [
      { label: "Could focus on it for hours and lose track of time", indicator: "focus" },
      { label: "Enjoy it for a while, then like to switch to something else", indicator: "multimodal" },
      { label: "Prefer exploring lots of different things rather than one deeply", indicator: "visual" },
    ],
  },
  {
    id: "se4", section: "sensory",
    text: "In a room full of people, you feel most comfortable when...",
    options: [
      { label: "You have a quiet corner or one close friend to talk to", indicator: "social" },
      { label: "You're in the middle of the group, talking to everyone", indicator: "auditory" },
      { label: "You can move around and do something active",    indicator: "kinesthetic" },
    ],
  },
  {
    id: "se5", section: "sensory",
    text: "You understand instructions best when they are...",
    options: [
      { label: "Given one clear step at a time",                 indicator: "routine" },
      { label: "Explained with the bigger picture first",        indicator: "visual" },
      { label: "Shown to you by someone doing it",                indicator: "kinesthetic" },
    ],
  },
];
