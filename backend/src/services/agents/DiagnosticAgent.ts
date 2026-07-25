import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssessmentResponse, Grade, Language } from "../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class DiagnosticAgent {
  static async analyseAssessment(params: {
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
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("DiagnosticAgent analyseAssessment error:", err);
      throw new Error("Assessment analysis failed");
    }
  }
}
