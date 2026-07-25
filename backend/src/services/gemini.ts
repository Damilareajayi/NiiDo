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
You are an educational psychologist AI assistant for NiiDo, a global adaptive learning platform.
Analyse these assessment responses from a student and generate their LearnerDNA profile.

Student details:
- Age: ${params.age}
- Grade: ${params.grade}
- Language preference: ${params.language}

Assessment responses:
${JSON.stringify(params.responses, null, 2)}

Some responses carry "sensory", "routine", or "focus" indicator tags — these reflect sensory
sensitivity, preference for predictability, and sustained-attention patterns. Treat them exactly
like the learning-track signals: fold them into neurodivergentIndicators as observed, neutral
behaviour patterns (e.g. "focuses intensely on preferred topics", "prefers a predictable routine",
"sensitive to loud or bright environments") — describing a pattern, never a condition.

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

CRITICAL RULES — these are non-negotiable, not stylistic suggestions:
- Never use clinical or diagnostic language of any kind. This includes not just formal diagnosis
  names (ADHD, autism, ASD, dyslexia, etc.) but also clinical-sounding phrasing like "symptoms",
  "signs of", "consistent with", "on the spectrum", "red flags", or "screening result". This tool
  is not a diagnostic instrument and must never imply that it is one.
- Frame every observation as a learning preference or strength, never a deficit or disorder
- If support needs appear significant, teacherGuidance and parentNote should gently suggest
  involving the school's own support resources or a professional for a fuller picture — phrased
  as "getting extra support" or "talking to someone who specialises in learning," never as
  "seeking a diagnosis" or naming a condition to rule in or out
- Keep teacher guidance practical for a low-resource classroom context
- Parent note must be readable by someone with only a primary school education
- Return ONLY the JSON object, no other text
`;

  try {
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
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
You are NiiDo Teach, an AI lesson planning assistant for teachers and instructors of
learners at any level, from primary school through graduate school.
Generate a complete, differentiated lesson plan.

Details:
- Subject: ${params.subject.replace("_", " ")}
- Topic: ${params.topic}
- Grade/level: ${params.grade.replace("_", " ")}
- Duration: ${params.duration} minutes
- Total students: ${params.totalStudents}
- Class learning profile:
${trackSummary || "  - Profile not yet available (generate for mixed class)"}

Requirements:
- Aligned to widely-used curriculum standards appropriate for the specified grade/level
  (this is a global platform serving learners of any age, not tied to one country)
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
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
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
    const result = await visionModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType } }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
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
    fr: "French",
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

// ============================================================
// NiiDo My Learning — Personalised content from a student's own LearnerDNA
// ============================================================
export async function generateLearningContent(params: {
  studentName: string;
  subject: string;
  topic: string;
  grade: Grade;
  primaryTrack: LearningTrack;
  secondaryTrack?: LearningTrack;
  supportLevel: string;
  language: Language;
}) {
  const prompt = `
You are NiiDo's personal learning assistant, creating content for ONE specific student based on
their own LearnerDNA profile — never a class of students, never a diagnosis, always a strength.
IMPORTANT: "NiiDo" is the name of the platform, not the student — never address the student as
"NiiDo". The student's actual name is: ${params.studentName}.

Student's learning profile:
- Primary learning style: ${params.primaryTrack}
- Secondary learning style: ${params.secondaryTrack || "none noted"}
- Support level: ${params.supportLevel}
- Grade: ${params.grade}
- Language: ${params.language}

Topic to teach: ${params.subject}, specifically: ${params.topic}

Requirements:
- Any subject or discipline is fair game — not limited to a fixed school-subject list
- Aligned to widely-used curriculum standards, appropriate for the student's actual grade/level
  (this platform serves learners of any age, from primary school through graduate school)
- Written directly to the student — you may use "you" or their real first name above, but never
  the word "NiiDo" as if it were their name. Warm and encouraging tone, matched to their level
  (a graduate student should not be addressed like a young child).
- Shape the explanation and activity specifically around their primary learning style
  (e.g. visual → describe things to picture/draw; auditory → describe things to say aloud or
  rhymes; kinesthetic → describe a hands-on action; read/write → structured notes; multimodal →
  mix of approaches)
- Never use clinical/diagnostic language of any kind
- Use only locally available materials (paper, pencil, everyday objects) — no assumption of
  internet access or special equipment

Return a JSON object with exactly these fields:
{
  "explanation": "2-3 sentences teaching the core idea, styled for their learning track",
  "activity": "One simple activity or exercise matching their learning style to practice this",
  "practiceQuestion": "One short question to check understanding",
  "encouragement": "A warm, personal, 1-sentence note of encouragement"
}

Return ONLY the JSON object, no other text.
`;

  try {
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini generateLearningContent error:", err);
    throw new Error("Learning content generation failed");
  }
}

// ============================================================
// WhatsApp Practice — bounded question/answer flow for students.
// Not open-ended chat: one question, one graded answer, done.
// ============================================================
export async function generatePracticeQuestion(params: {
  subject: string;
  topic: string;
}) {
  const prompt = `
Create ONE short practice question for a student on:
Subject: ${params.subject}
Topic: ${params.topic}

The question must be answerable in a single short message (a word, number, or one sentence) —
suitable for WhatsApp. No multi-part or essay questions.

Return a JSON object with exactly these fields:
{
  "question": "The practice question, plain text, suitable for WhatsApp",
  "correctAnswer": "The correct answer, as plainly as possible"
}

Return ONLY the JSON object, no other text.
`;
  try {
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini generatePracticeQuestion error:", err);
    throw new Error("Practice question generation failed");
  }
}

export async function gradePracticeAnswer(params: {
  question: string;
  correctAnswer: string;
  studentAnswer: string;
}) {
  const prompt = `
A student was asked: "${params.question}"
The correct answer is: "${params.correctAnswer}"
The student answered: "${params.studentAnswer}"

Judge leniently — accept reasonable phrasing, spelling variations, and partial credit for the
right idea even if not word-for-word.

Return a JSON object with exactly these fields:
{
  "correct": true or false,
  "feedback": "1-2 warm, encouraging sentences. If wrong, briefly explain the right answer. Suitable for WhatsApp, plain text, one simple emoji is fine."
}

Return ONLY the JSON object, no other text.
`;
  try {
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini gradePracticeAnswer error:", err);
    throw new Error("Answer grading failed");
  }
}
