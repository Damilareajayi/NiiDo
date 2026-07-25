import { GoogleGenerativeAI } from "@google/generative-ai";
import { LearningTrack, Grade, Subject, Language } from "../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class CopilotAgent {
  // Generates complete, differentiated classroom lesson plans
  static async generateLessonPlan(params: {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("CopilotAgent generateLessonPlan error:", err);
      throw new Error("Lesson plan generation failed");
    }
  }

  // Performs advanced roster digitisation and OCR
  static async extractStudentsFromImage(imageBase64: string, mimeType: string) {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType } }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("CopilotAgent extractStudentsFromImage error:", err);
      throw new Error("Image extraction failed");
    }
  }
}
