import { GoogleGenerativeAI } from "@google/generative-ai";
import { LearningTrack, Grade, Language } from "../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class TutorAgent {
  // Generates self-paced customized lessons for a student
  static async generateLearningContent(params: {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("TutorAgent generateLearningContent error:", err);
      throw new Error("Learning content generation failed");
    }
  }

  // Generates short practice questions optimized for WhatsApp
  static async generatePracticeQuestion(params: {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("TutorAgent generatePracticeQuestion error:", err);
      throw new Error("Practice question generation failed");
    }
  }

  // Grades student's answers leniently on WhatsApp
  static async gradePracticeAnswer(params: {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("TutorAgent gradePracticeAnswer error:", err);
      throw new Error("Answer grading failed");
    }
  }

  // Generates warm, supportive reports to parents in their preferred local language
  static async generateParentMessage(params: {
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
      console.error("TutorAgent generateParentMessage error:", err);
      throw new Error("Message generation failed");
    }
  }
}
