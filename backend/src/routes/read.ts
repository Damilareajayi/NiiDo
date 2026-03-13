import { Router, Request, Response } from "express";
import { z } from "zod";
import { analyseAssessment } from "../services/gemini";

export const readRouter = Router();

const AnalyseSchema = z.object({
  responses:  z.array(z.object({
    questionId:    z.string(),
    questionText:  z.string(),
    selectedOption: z.string(),
    indicatorType: z.string(),
    timeSpent:     z.number(),
  })),
  age:        z.number().min(4).max(20),
  grade:      z.string(),
  language:   z.enum(["en", "ha", "yo", "ig"]),
  studentId:  z.string(),
});

// POST /api/read/analyse
// Analyse assessment responses and return LearnerDNA profile
readRouter.post("/analyse", async (req: Request, res: Response) => {
  try {
    const data = AnalyseSchema.parse(req.body);
    const profile = await analyseAssessment({
      responses: data.responses as any,
      age:       data.age,
      grade:     data.grade as any,
      language:  data.language,
    });
    res.json({ success: true, profile, studentId: data.studentId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Assessment analysis failed" });
  }
});

// GET /api/read/questions
// Returns the 20 assessment questions
readRouter.get("/questions", (_req: Request, res: Response) => {
  res.json({ questions: ASSESSMENT_QUESTIONS });
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
];
