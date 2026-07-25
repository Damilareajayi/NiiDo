import { Router, Request, Response } from "express";
import twilio from "twilio";
import { TutorAgent } from "../services/agents/TutorAgent";
import { CopilotAgent } from "../services/agents/CopilotAgent";
import { eduPromptConfigured, generateLessonViaEduPrompt, humanizeGrade, humanizeSubject } from "../services/eduprompt";
import { requireAuth, requireRole } from "../middleware/auth";
import { db, Timestamp } from "../firebase";

export const whatsappRouter = Router();

const twilioConfigured = !!process.env.TWILIO_ACCOUNT_SID?.startsWith("AC") && !!process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilioConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

async function sendWhatsApp(to: string, body: string) {
  if (!twilioClient) {
    console.log(`[WhatsApp:not configured] To: ${to}\n${body}`);
    return { sent: false, reason: "Twilio not configured" };
  }
  const message = await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    body,
  });
  return { sent: true, sid: message.sid };
}

function replyTwiml(res: Response, message: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type("text/xml").send(twiml.toString());
}

const twilioWebhookMiddleware = twilioConfigured
  ? twilio.webhook({ validate: true })
  : (req: Request, res: Response, next: any) => next();

// POST /api/whatsapp/webhook
// Receives incoming WhatsApp messages via Twilio and auto-replies with TwiML
whatsappRouter.post("/webhook", twilioWebhookMiddleware, async (req: Request, res: Response) => {
  try {
    const body    = req.body;
    const from    = body.From || body.from || "";
    const message = (body.Body || body.body || "").trim().toLowerCase();

    // Student practice command: "practice mathematics fractions"
    // Bounded flow only — one question, one graded answer, no open chat.
    if (isPracticeRequest(message)) {
      const parsed = parsePracticeRequest(message);
      if (parsed) {
        const { question, correctAnswer } = await TutorAgent.generatePracticeQuestion(parsed);
        await savePendingSession(from, { subject: parsed.subject, topic: parsed.topic, question, correctAnswer });
        return replyTwiml(res, `📝 *Practice: ${parsed.topic}*\n\n${question}\n\n_Reply with your answer!_`);
      }
    }

    // If this student has a pending question, treat this message as their answer
    const pending = await getPendingSession(from);
    if (pending) {
      await clearPendingSession(from);
      const { correct, feedback } = await TutorAgent.gradePracticeAnswer({
        question: pending.question,
        correctAnswer: pending.correctAnswer,
        studentAnswer: body.Body || body.body || "",
      });
      const emoji = correct ? "✅" : "💡";
      return replyTwiml(res, `${emoji} ${feedback}\n\n_Reply "practice [subject] [topic]" for another question!_`);
    }

    // Teacher commands:
    // "jss2 mathematics fractions 45" → generate lesson plan
    // "lesson: [subject] [topic] [duration]"
    if (isLessonRequest(message)) {
      const parsed = parseLessonRequest(message);
      if (parsed) {
        try {
          if (!eduPromptConfigured) throw new Error("EduPrompt not configured");
          const { lesson: markdown } = await generateLessonViaEduPrompt({
            subject:    humanizeSubject(parsed.subject),
            grade:      humanizeGrade(parsed.grade),
            topic:      parsed.topic,
            // No curriculum pinned — see routes/teach.ts for why.
            detail:     "short",
          });
          return replyTwiml(res, formatMarkdownLessonForWhatsApp(markdown, parsed));
        } catch (eduErr) {
          console.error("EduPrompt WhatsApp generation failed, falling back to Gemini:", eduErr instanceof Error ? eduErr.message : eduErr);
          const lesson = await CopilotAgent.generateLessonPlan({
            subject:           parsed.subject as any,
            topic:             parsed.topic,
            grade:             parsed.grade as any,
            duration:          parsed.duration,
            trackDistribution: {},
            totalStudents:     30,
            language:          "en",
          });
          return replyTwiml(res, formatLessonForWhatsApp(lesson, parsed));
        }
      }
    }

    // Parent commands
    if (message === "progress" || message === "update") {
      return replyTwiml(res, "📊 To get your child's progress report, please ask their teacher to send you an update through NiiDo.");
    }

    // Default help message
    replyTwiml(res, `👋 Welcome to NiiDo!\n\n*For students:* Send a message like:\n_"Practice Mathematics Fractions"_\nto get a practice question.\n\n*For teachers:* Send a message like:\n_"JSS2 Mathematics Fractions 45min"_\nto generate a lesson plan.\n\n*For parents:* Reply *PROGRESS* to get your child's latest update.\n\n🌐 niido.learnscape.africa`);
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// POST /api/whatsapp/notify-parent
// Send a notification to a parent about their child's assessment
whatsappRouter.post("/notify-parent", requireAuth, requireRole("teacher", "admin"), async (req: Request, res: Response) => {
  try {
    const { studentName, primaryTrack, supportLevel, parentNote, language, parentPhone } = req.body;

    const message = await TutorAgent.generateParentMessage({
      studentName,
      primaryTrack,
      supportLevel,
      parentNote,
      language: language || "en",
    });

    const result = await sendWhatsApp(parentPhone, message);

    res.json({ success: true, message, phone: parentPhone, ...result });
  } catch (err) {
    console.error("WhatsApp notify-parent error:", err);
    res.status(500).json({ error: "Notification failed" });
  }
});

// ── Helpers ──────────────────────────────────────────────────

const PRACTICE_SUBJECT_MAP: Record<string, string> = {
  "maths": "mathematics", "math": "mathematics", "mathematics": "mathematics",
  "english": "english", "science": "basic science", "social": "social studies",
  "civic": "civic education", "computer": "computer studies",
};

function isPracticeRequest(msg: string): boolean {
  return msg.startsWith("practice");
}

function parsePracticeRequest(msg: string): { subject: string; topic: string } | null {
  const rest = msg.replace(/^practice[:\s]*/i, "").trim();
  if (!rest) return null;

  const words = rest.split(/\s+/);
  const firstWord = words[0];
  const matchedSubject = PRACTICE_SUBJECT_MAP[firstWord];

  const subject = matchedSubject || "general knowledge";
  const topic = (matchedSubject ? words.slice(1).join(" ") : rest).trim();

  return { subject, topic: topic || subject };
}

// Bounded per-phone-number session — one pending question at a time,
// stored in Firestore since Twilio webhooks are stateless per-message.
async function getPendingSession(phone: string) {
  const snap = await db.collection("whatsappSessions").doc(phone).get();
  return snap.exists ? snap.data() : null;
}

async function savePendingSession(phone: string, data: { subject: string; topic: string; question: string; correctAnswer: string }) {
  await db.collection("whatsappSessions").doc(phone).set({ ...data, createdAt: Timestamp.now() });
}

async function clearPendingSession(phone: string) {
  await db.collection("whatsappSessions").doc(phone).delete();
}

function isLessonRequest(msg: string): boolean {
  const keywords = ["jss", "sss", "primary", "lesson", "teach me", "plan for"];
  return keywords.some((k) => msg.includes(k));
}

function parseLessonRequest(msg: string) {
  // Simple regex parser for "JSS2 Mathematics Fractions 45"
  const gradeMatch    = msg.match(/\b(jss[1-3]|sss[1-3]|primary\s?[1-6])\b/i);
  const durationMatch = msg.match(/\b(30|45|60|80)\b/);
  const subjectMap: Record<string, string> = {
    "maths": "mathematics", "math": "mathematics", "mathematics": "mathematics",
    "english": "english", "science": "basic_science", "social": "social_studies",
    "civic": "civic_education", "computer": "computer_studies",
  };

  let subject = "mathematics";
  for (const [key, val] of Object.entries(subjectMap)) {
    if (msg.includes(key)) { subject = val; break; }
  }

  const grade    = gradeMatch    ? gradeMatch[1].replace(" ", "_").toLowerCase() : "jss_1";
  const duration = durationMatch ? parseInt(durationMatch[1]) as 30|45|60|80 : 45;

  // Extract topic (remaining words after grade and subject)
  const gradePattern = gradeMatch ? gradeMatch[1] : "";
  const subjectPattern = subject.replace("_", " ");

  const cleaned = msg
    .replace(new RegExp(gradePattern, "i"), "")
    .replace(new RegExp(subjectPattern, "i"), "")
    .replace(/\d+/g, "")
    .trim();

  return { grade, subject, topic: cleaned || "Introduction", duration };
}

// WhatsApp bodies over ~1600 chars get rejected/truncated by carriers,
// so trim EduPrompt's markdown and strip formatting it doesn't understand.
const WHATSAPP_MAX_CHARS = 1500;

function formatMarkdownLessonForWhatsApp(markdown: string, meta: any): string {
  const plain = markdown
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "*$1*")
    .trim();
  const truncated = plain.length > WHATSAPP_MAX_CHARS
    ? plain.slice(0, WHATSAPP_MAX_CHARS) + "…"
    : plain;
  return `📚 *NiiDo Teach — Lesson Plan*\n\n${truncated}`;
}

function formatLessonForWhatsApp(lesson: any, meta: any): string {
  return `📚 *NiiDo Teach — Lesson Plan*
*${meta.subject.toUpperCase()} | ${meta.grade.toUpperCase()} | ${meta.duration} mins*
*Topic: ${meta.topic}*

*🎯 Objectives:*
${lesson.objectives?.map((o: string, i: number) => `${i + 1}. ${o}`).join("\n") || "—"}

*📦 Materials:* ${lesson.materials?.join(", ") || "—"}

*🚀 Starter (5 mins):*
${lesson.introduction || "—"}

*📖 Main Activity:*
${lesson.mainActivity?.standard || "—"}

*💡 Support:* ${lesson.mainActivity?.support || "—"}
*⚡ Extension:* ${lesson.mainActivity?.extension || "—"}

*✅ Assessment:* ${lesson.assessment || "—"}

_Generated by NiiDo Teach · niido.learnscape.africa_`;
}
