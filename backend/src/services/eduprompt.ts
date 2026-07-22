// ── EduPrompt Lesson Plan API client ────────────────────────────
// Third-party LearnScape service NiiDo Teach calls for curriculum-aligned,
// African-context lesson plans. Fails over Claude → OpenAI → Gemini on
// EduPrompt's side, so it's the preferred generator; our own Gemini prompt
// in gemini.ts is kept as a fallback for when EduPrompt itself is down.

const EDUPROMPT_BASE_URL = process.env.EDUPROMPT_BASE_URL || "https://eduprompt.learnscape.africa";
const EDUPROMPT_API_KEY = process.env.EDUPROMPT_API_KEY;

export const eduPromptConfigured = !!EDUPROMPT_API_KEY;

export class EduPromptError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) {
    super(message);
    this.name = "EduPromptError";
  }
}

interface GenerateLessonParams {
  subject: string;
  grade: string;
  topic?: string;
  context?: string;
  language?: string;
  curriculum?: string;
  style?: "activity" | "visual" | "quiz" | "exam" | "mapping";
  classSize?: string;
  detail?: "short" | "standard" | "detailed";
}

interface EduPromptLessonResponse {
  lesson: string;
  provider: string;
}

async function callGenerateAuth(params: GenerateLessonParams): Promise<EduPromptLessonResponse> {
  const res = await fetch(`${EDUPROMPT_BASE_URL}/api/generate-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": EDUPROMPT_API_KEY!,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { error?: string }));
    // 401/429/400 are non-retryable — surface to a human rather than looping.
    const retryable = res.status === 503;
    throw new EduPromptError(body.error || `EduPrompt API error (${res.status})`, res.status, retryable);
  }

  return res.json();
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export async function generateLessonViaEduPrompt(params: GenerateLessonParams): Promise<EduPromptLessonResponse> {
  if (!EDUPROMPT_API_KEY) {
    throw new Error("EduPrompt is not configured (missing EDUPROMPT_API_KEY)");
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGenerateAuth(params);
    } catch (err) {
      lastErr = err;
      if (err instanceof EduPromptError && !err.retryable) throw err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

export async function getEduPromptStatus() {
  if (!EDUPROMPT_API_KEY) {
    throw new Error("EduPrompt is not configured (missing EDUPROMPT_API_KEY)");
  }
  const res = await fetch(`${EDUPROMPT_BASE_URL}/api/v1/status`, {
    headers: { "x-api-key": EDUPROMPT_API_KEY },
  });
  if (!res.ok) throw new Error(`EduPrompt status check failed (${res.status})`);
  return res.json();
}

// NiiDo stores grades/subjects as internal slugs (e.g. "jss_1", "basic_science");
// EduPrompt expects human-readable free text (e.g. "JSS 1", "Basic Science").
const GRADE_LABEL_OVERRIDES: Record<string, string> = {
  grad_masters: "Graduate School (Master's)",
  grad_phd: "Graduate School (PhD)",
  adult: "Adult Learner",
};

export function humanizeGrade(grade: string): string {
  if (grade in GRADE_LABEL_OVERRIDES) return GRADE_LABEL_OVERRIDES[grade];

  const [level, num] = grade.split("_");
  const levelLabel =
    level === "jss" || level === "sss" ? level.toUpperCase() :
    level === "undergrad" ? "Undergraduate Year" :
    level.charAt(0).toUpperCase() + level.slice(1);
  return num ? `${levelLabel} ${num}` : levelLabel;
}

export function humanizeSubject(subject: string): string {
  return subject.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// EduPrompt's `language` field expects a full name (default "English"), not a code.
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  ar: "Arabic",
  sw: "Kiswahili",
  am: "Amharic",
  "zh-CN": "Chinese",
  hi: "Hindi",
  ur: "Urdu",
  bn: "Bengali",
  de: "German",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  tr: "Turkish",
  id: "Indonesian",
};

export function humanizeLanguage(code: string): string | undefined {
  return LANGUAGE_NAMES[code];
}
