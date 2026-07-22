import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const LANGUAGES = [
  { code: "fr",    name: "French" },
  { code: "es",    name: "Spanish" },
  { code: "pt",    name: "Portuguese" },
  { code: "ar",    name: "Arabic" },
  { code: "sw",    name: "Swahili" },
  { code: "ha",    name: "Hausa" },
  { code: "yo",    name: "Yoruba" },
  { code: "ig",    name: "Igbo" },
  { code: "am",    name: "Amharic" },
  { code: "zh-CN", name: "Chinese" },
  { code: "hi",    name: "Hindi" },
  { code: "ur",    name: "Urdu" },
  { code: "bn",    name: "Bengali" },
  { code: "de",    name: "German" },
  { code: "ru",    name: "Russian" },
  { code: "ja",    name: "Japanese" },
  { code: "ko",    name: "Korean" },
  { code: "tr",    name: "Turkish" },
  { code: "id",    name: "Indonesian" },
];

async function callVertexAI(prompt: string, project: string): Promise<string> {
  const token = execSync("gcloud auth print-access-token").toString().trim();
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models/gemini-1.5-flash-001:generateContent`;

  const payload = {
    contents: {
      role: "user",
      parts: [
        {
          text: prompt
        }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vertex AI HTTP error! status: ${res.status}, body: ${errorText}`);
  }

  const json: any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Unexpected Vertex AI response structure: ${JSON.stringify(json)}`);
  }
  return text;
}

async function callGeminiDeveloperAPI(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API HTTP error! status: ${res.status}, body: ${errorText}`);
  }

  const json: any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Unexpected Gemini Developer API response structure: ${JSON.stringify(json)}`);
  }
  return text;
}

async function translate() {
  const apiKey = process.env.GEMINI_API_KEY;
  const project = "july-push";
  const localesDir = join(process.cwd(), "src/i18n/locales");
  const enPath = join(localesDir, "en.json");

  if (!existsSync(enPath)) {
    console.error(`Error: Base English file not found at ${enPath}`);
    process.exit(1);
  }

  const enData = JSON.parse(readFileSync(enPath, "utf-8"));

  for (const lang of LANGUAGES) {
    const targetPath = join(localesDir, `${lang.code}.json`);
    
    // Check if the file already exists and top level keys are in sync
    if (existsSync(targetPath)) {
      try {
        const targetData = JSON.parse(readFileSync(targetPath, "utf-8"));
        const enKeys = Object.keys(enData);
        const targetKeys = Object.keys(targetData);
        const isSynced = enKeys.every(k => targetKeys.includes(k));
        if (isSynced) {
          console.log(`[NiiDo] ${lang.name} (${lang.code}) is already up to date.`);
          continue;
        }
      } catch (e) {}
    }

    console.log(`[NiiDo] Generating translations for ${lang.name} (${lang.code})...`);

    const prompt = `
You are an expert, highly context-aware educational and UI translator.
Translate the following English JSON dictionary into ${lang.name} (${lang.code}) for NiiDo learning platform.

Rigorously preserve:
1. All JSON keys and the exact nested structure of the object.
2. Any template variables or placeholder interpolations like {{name}}, {{pct}}, or any other {{var}} exactly as they are.
3. Brand and product names: NiiDo, NiiDo Read, NiiDo Teach, NiiDo Pulse.
4. Capitalization and punctuation styles.

Only translate the string values. Do not provide any conversational preamble, notes, or explanations.
Your response MUST be a 100% syntactically valid JSON object.

Source English JSON:
${JSON.stringify(enData, null, 2)}
`;

    try {
      let textResponse = "";
      if (apiKey) {
        textResponse = await callGeminiDeveloperAPI(prompt, apiKey);
      } else {
        textResponse = await callVertexAI(prompt, project);
      }

      const translatedData = JSON.parse(textResponse.trim());
      writeFileSync(targetPath, JSON.stringify(translatedData, null, 2), "utf-8");
      console.log(`[NiiDo] Successfully wrote ${lang.code}.json`);
    } catch (err: any) {
      console.error(`[NiiDo] Failed to translate ${lang.name}:`, err.message || err);
    }
  }

  console.log("[NiiDo] All translation files have been successfully synchronized.");
}

translate().catch((e) => {
  console.error("Global script failure:", e);
  process.exit(1);
});
