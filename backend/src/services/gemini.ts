import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssessmentResponse, LearningTrack, Grade, Subject, Language } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ============================================================
// NiiDo Read — Analyse assessment responses → LearnerDNA
// ============================================================
export async function analyseAssessment(params: {
  responses: AssessmentResponse[];
  age: number;
  grade: Grade;
  language: Language;
}) {
  const prompt = `
You are an educational psychologist AI assistant for NiiDo, Africa's adaptive learning platform.
Analyse these assessment responses from a student and generate their LearnerDNA profile.

Student details:
- Age: ${params.age}
- Grade: ${params.grade}
- Language preference: ${params.language}

Assessment responses:
${JSON.stringify(params.responses, null, 2)}

Generate a JSON object with exactly these fields:
{
  "primaryTrack": "visual" | "auditory" | "kinesthetic" | "readwrite" | "multimodal",
  "secondaryTrack": "visual" | "auditory" | "kinesthetic" | "readwrite" | "multimodal" | null,
  "supportLevel": "none" | "mild" | "moderate" | "significant",
  "neurodivergentIndicators": ["array of observed behaviour patterns — never clinical diagnoses"],
  "strengths": ["2-3 genuine strengths observed in the responses"],
  "teacherGuidance": ["3 specific, actionable classroom tips for this student"],
  "contentAdaptations": ["3 ways to adapt content delivery for this student"],
  "parentNote": "A warm, jargon-free 2-sentence message parents can understand. No clinical terms."
}

CRITICAL RULES:
- Never use clinical diagnostic language (ADHD, ASD, dyslexia etc.)
- Frame everything as learning preferences and strengths, never deficits
- Keep teacher guidance practical for Nigerian public school context (limited resources)
- Parent note must be readable by someone with primary school education
- Return ONLY the JSON object, no other text
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini analyseAssessment error:", err);
    throw new Error("Assessment analysis failed");
  }
}

// ============================================================
// NiiDo Teach — Generate lesson plan
// ============================================================
export async function generateLessonPlan(params: {
  subject: Subject;
  topic: string;
  grade: Grade;
  duration: 30 | 45 | 60 | 80;
  trackDistribution: Partial<Record<LearningTrack, number>>;
  totalStudents: number;
  language: Language;
}) {
  const trackSummary = Object.entries(params.trackDistribution)
    .map(([track, count]) => `  - ${count} ${track} learners`)
    .join("\n");

  const prompt = `
You are NiiDo Teach, an AI lesson planning assistant for Nigerian K-12 teachers.
Generate a complete, differentiated lesson plan.

Details:
- Subject: ${params.subject.replace("_", " ")}
- Topic: ${params.topic}
- Grade: ${params.grade.replace("_", " ")}
- Duration: ${params.duration} minutes
- Total students: ${params.totalStudents}
- Class learning profile:
${trackSummary || "  - Profile not yet available (generate for mixed class)"}

Requirements:
- Aligned to Nigerian NERDC curriculum
- Use locally available materials (chalk, board, exercise books, possibly one device)
- Do NOT assume projectors, consistent electricity, or internet
- Keep language simple for teachers who may not have EdTech experience

Return a JSON object with exactly these fields:
{
  "objectives": ["3 SMART learning objectives"],
  "materials": ["locally available materials needed"],
  "introduction": "Engaging 5-minute hook/starter activity",
  "mainActivity": {
    "standard": "Main activity for average learners",
    "support": "Simplified version for struggling learners",
    "extension": "Challenge for advanced learners"
  },
  "assessment": "End-of-lesson check for understanding",
  "homework": "Optional simple homework task or null",
  "neurodivergentTips": ["2 tips for supporting learners who need extra help"],
  "adaptationsByTrack": {
    "visual": "How to adapt this lesson for visual learners",
    "auditory": "How to adapt for auditory learners",
    "kinesthetic": "How to adapt for kinesthetic learners",
    "readwrite": "How to adapt for read/write learners",
    "multimodal": "How to adapt for multimodal learners"
  }
}

Return ONLY the JSON object, no other text.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini generateLessonPlan error:", err);
    throw new Error("Lesson plan generation failed");
  }
}

// ============================================================
// Register photo → student list (OCR via Gemini Vision)
// ============================================================
export async function extractStudentsFromImage(imageBase64: string, mimeType: string) {
  const prompt = `
You are helping a Nigerian school digitise their student register.
Look at this image carefully. It may be a handwritten register, printed list, or class roll.

Extract all student names and any other visible information.

Return a JSON object:
{
  "detected": [
    {
      "name": "Student full name",
      "grade": "detected grade or null",
      "gender": "male" | "female" | null,
      "age": number | null,
      "confirmed": false
    }
  ],
  "confidence": 0.0 to 1.0,
  "rawText": "all text you can see in the image",
  "warnings": ["any issues like unclear handwriting, partial names, etc."]
}

Return ONLY the JSON object.
`;

  try {
    const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await visionModel.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini extractStudents error:", err);
    throw new Error("Image extraction failed");
  }
}

// ============================================================
// BridgeAgent — Generate parent WhatsApp message
// ============================================================
export async function generateParentMessage(params: {
  studentName: string;
  primaryTrack: LearningTrack;
  supportLevel: string;
  parentNote: string;
  language: Language;
}) {
  const langMap: Record<Language, string> = {
    en: "English",
    ha: "Hausa",
    yo: "Yoruba",
    ig: "Igbo",
  };

  const prompt = `
Write a warm, friendly WhatsApp message to a parent from NiiDo, an educational platform.

Details:
- Student name: ${params.studentName}
- Learning style discovered: ${params.primaryTrack}
- Support level: ${params.supportLevel}
- Key message: ${params.parentNote}
- Write in: ${langMap[params.language]}

The message should:
- Be warm and celebratory (not alarming)
- Use very simple language (primary school reading level)
- Be 3-4 sentences maximum
- Include a simple emoji or two
- End with instructions: reply PROGRESS to get weekly updates

Return ONLY the message text, nothing else.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini generateParentMessage error:", err);
    throw new Error("Message generation failed");
  }
}
