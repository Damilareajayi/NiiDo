import { Router, Request, Response } from "express";
import twilio from "twilio";
import { generateLessonPlan, generateParentMessage } from "../services/gemini";
import { requireAuth, requireRole } from "../middleware/auth";

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

// POST /api/whatsapp/webhook
// Receives incoming WhatsApp messages via Twilio and auto-replies with TwiML
whatsappRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body    = req.body;
    const message = (body.Body || body.body || "").trim().toLowerCase();

    // Teacher commands:
    // "jss2 mathematics fractions 45" → generate lesson plan
    // "lesson: [subject] [topic] [duration]"
    if (isLessonRequest(message)) {
      const parsed = parseLessonRequest(message);
      if (parsed) {
        const lesson = await generateLessonPlan({
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

    // Parent commands
    if (message === "progress" || message === "update") {
      return replyTwiml(res, "📊 To get your child's progress report, please ask their teacher to send you an update through NiiDo.");
    }

    // Default help message
    replyTwiml(res, `👋 Welcome to NiiDo!\n\n*For teachers:* Send a message like:\n_"JSS2 Mathematics Fractions 45min"_\nto generate a lesson plan.\n\n*For parents:* Reply *PROGRESS* to get your child's latest update.\n\n🌐 niido.learnscape.africa`);
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

    const message = await generateParentMessage({
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
  const cleaned = msg
    .replace(grade, "")
    .replace(subject.replace("_", ""), "")
    .replace(/\d+/g, "")
    .trim();

  return { grade, subject, topic: cleaned || "Introduction", duration };
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
