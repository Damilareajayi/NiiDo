import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class GrowthAgent {
  // Generates a tailored sales pitch to school administrators using school metrics
  static async generateSchoolPitch(params: {
    adminName: string;
    schoolName: string;
    totalStudents: number;
    assessedCount: number;
    lessonsGenerated: number;
    primaryNeedsCount: number;
  }) {
    const prompt = `
You are NiiDo's Lead Growth & Marketing Agent. Your objective is to convert freemium school administrators
into paying B2B school subscribers. Write a compelling, professional, yet warm business email pitch.

Context:
- Administrator Name: ${params.adminName}
- School Name: ${params.schoolName}
- Registered Students: ${params.totalStudents} (with ${params.assessedCount} already diagnosed through NiiDo Read)
- Lessons Generated: ${params.lessonsGenerated} by teachers this month
- Students needing extra support: ${params.primaryNeedsCount}

The email pitch must:
1. Congratulate them on diagnosing ${params.assessedCount} student cognitive profiles.
2. Highlight how NiiDo helps them support the ${params.primaryNeedsCount} learners who need extra help.
3. Quantify teacher efficiency (e.g., how generating ${params.lessonsGenerated} lessons saved hours).
4. Propose an upgrade to NiiDo School Premium to unlock the school-wide Pulse Analytics and add bulk teacher accounts.
5. Offer a friendly, friction-free CTA (e.g., "Reply with a convenient time for a 10-minute demo").

Format output as a clean, ready-to-send email with:
{
  "subject": "Subject Line",
  "body": "Full Email Body (use placeholders like [Your Name] for the NiiDo sales rep)"
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
      console.error("GrowthAgent generateSchoolPitch error:", err);
      throw new Error("Failed to generate school pitch");
    }
  }

  // Generates SMS/WhatsApp conversion nudges for parents to upgrade to Premium
  static async generateParentNudge(params: {
    parentName: string;
    studentName: string;
    primaryTrack: string;
    completedLessons: number;
  }) {
    const prompt = `
You are NiiDo's Parental Conversion Agent. Your objective is to nudge parents to upgrade to
NiiDo Premium so their children can generate self-paced lessons in any discipline.

Context:
- Parent Name: ${params.parentName}
- Child's Name: ${params.studentName}
- Cognitive learning style: ${params.primaryTrack}
- Free lessons completed: ${params.completedLessons}

Write a highly engaging, warm, celebratory, and short WhatsApp nudge (max 4 sentences):
- Highlight their child's success completing ${params.completedLessons} lessons using their ${params.primaryTrack} learning style.
- Pitch NiiDo Premium (unlimited subjects like Chemistry, coding, general science, tailored to how they learn).
- Include standard emojis.
- End with a clear call-to-action button/link message to upgrade.

Format output as a clean JSON object:
{
  "message": "Full WhatsApp text copy"
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
      console.error("GrowthAgent generateParentNudge error:", err);
      throw new Error("Failed to generate parent nudge");
    }
  }
}
