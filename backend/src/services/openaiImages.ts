// ── Illustrative image generation for My Learning content ──────
// Used only for student-facing lesson CONTENT (see routes/learn.ts) — never
// for teacher lesson PLANS, which stay text/markdown via EduPrompt/Gemini.
// Internal implementation detail: never surfaced to the user in any UI
// copy, response field, or log a user could see.
import { bucket } from "../firebase";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const imageGenerationConfigured = !!OPENAI_API_KEY;

// A flat, colorful, diagram-style illustration reads far better for
// learning content than a photorealistic one, and avoids the garbled-text
// problem image models have — so the prompt explicitly asks for no text/
// labels in the image at all; any labeling stays in the markdown next to it.
function buildImagePrompt(subject: string, topic: string, gradeLabel: string): string {
  return [
    `A clean, colorful, flat-illustration educational diagram for a ${gradeLabel} learner`,
    `explaining "${topic}" in ${subject}.`,
    "Friendly, simple, textbook-illustration style with clear shapes and bright but soft colors.",
    "Absolutely no text, letters, numbers, or labels anywhere in the image — illustration only.",
  ].join(" ");
}

async function requestImage(prompt: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    // gpt-image-1, not dall-e-3: confirmed empirically — this key's account
    // rejects response_format as an unknown parameter, which is specifically
    // a gpt-image-1 behavior (it has no response_format option at all and
    // always returns b64_json, unlike dall-e-2/3 which support choosing
    // url vs b64_json). quality uses gpt-image-1's own enum (low/medium/
    // high/auto), not dall-e's (standard/hd) — "medium" is a reasonable
    // cost/quality default for a topic illustration.
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Image generation request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation response had no image data");
  return Buffer.from(b64, "base64");
}

async function uploadToStorage(buffer: Buffer, studentId: string, contentId: string): Promise<string> {
  const filePath = `learning-content-images/${studentId}/${contentId}.png`;
  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: { contentType: "image/png", cacheControl: "public, max-age=31536000, immutable" },
  });
  // No file.makePublic() — the bucket uses uniform bucket-level access,
  // which disables per-object ACLs in favor of a bucket-level IAM binding
  // (allUsers: objectViewer) already granted when the bucket was created.
  // These are generic topic illustrations (never contain student identity
  // or personal data), so public read is appropriate — and it avoids GCS
  // signed URLs' hard 7-day expiry cap, which would break re-visiting old
  // lessons in a student's history.
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

// Generates one illustrative image for a lesson topic and returns its
// public URL, or null if generation isn't configured or fails — image
// generation is a nice-to-have enhancement and must never block the
// lesson text itself from reaching the student.
export async function generateLessonIllustration(params: {
  subject: string;
  topic: string;
  gradeLabel: string;
  studentId: string;
  contentId: string;
}): Promise<string | null> {
  if (!imageGenerationConfigured) return null;
  try {
    const prompt = buildImagePrompt(params.subject, params.topic, params.gradeLabel);
    const buffer = await requestImage(prompt);
    return await uploadToStorage(buffer, params.studentId, params.contentId);
  } catch (err) {
    console.error("Lesson illustration generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
