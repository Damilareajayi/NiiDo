"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { Grade, LessonContent, Subject } from "@/types";
import { FadeIn } from "@/components/ui/FadeIn";
import { GraduationCap, Loader2, Sparkles } from "lucide-react";

const DURATIONS = [30, 45, 60, 80] as const;

const CURRICULA = [
  { value: "All African Curricula (Hybrid)", label: "All / Hybrid (default) 🌍" },
  { value: "Nigerian NERDC", label: "Nigeria -- NERDC 🇳🇬" },
  { value: "Kenyan CBC", label: "Kenya -- CBC 🇰🇪" },
  { value: "Ghanaian NaCCA", label: "Ghana -- NaCCA 🇬🇭" },
  { value: "South African CAPS", label: "South Africa -- CAPS 🇿🇦" },
  { value: "Ugandan NCDC", label: "Uganda -- NCDC 🇺🇬" },
  { value: "Tanzanian NECTA", label: "Tanzania -- NECTA 🇹🇿" },
  { value: "Rwandan REB", label: "Rwanda -- REB 🇷🇼" },
  { value: "Ethiopian MOE", label: "Ethiopia -- MOE 🇪🇹" },
  { value: "Cambridge International (IGCSE/A-Level)", label: "Cambridge -- IGCSE / A-Level 🌍" },
  { value: "International Baccalaureate (IB)", label: "International Baccalaureate (IB) 🌐" },
  { value: "American Common Core Curriculum", label: "American -- Common Core 🇺🇸" },
  { value: "British National Curriculum", label: "British National Curriculum 🇬🇧" },
  { value: "Montessori Framework", label: "Montessori Framework 🏫" },
  { value: "WAEC/WASSCE Curriculum", label: "WAEC / WASSCE 📋" },
];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "French", label: "Français (French)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "Kiswahili", label: "Kiswahili" },
  { value: "Hausa", label: "Hausa" },
  { value: "Yoruba", label: "Yoruba" },
  { value: "Igbo", label: "Igbo" },
  { value: "Amharic", label: "Amharic" },
  { value: "Chinese", label: "中文 (Chinese)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Indonesian", label: "Bahasa Indonesia" },
  { value: "Nigerian Pidgin English", label: "Nigerian Pidgin" },
  { value: "Zulu", label: "Zulu" },
  { value: "Afrikaans", label: "Afrikaans" },
  { value: "Twi", label: "Twi (Akan)" },
];

const STYLES = [
  { value: "standard", label: "Standard Lesson Plan" },
  { value: "activity", label: "Activity-Heavy (Group Work)" },
  { value: "visual", label: "Visual & Diagram-Rich" },
  { value: "quiz", label: "Quiz & Assessment Focus" },
  { value: "exam", label: "Exam Prep (Terminal Classes)" },
  { value: "mapping", label: "Concept Mapping Activity" },
];

const DETAILS = [
  { value: "standard", label: "Standard (Recommended)" },
  { value: "short", label: "Short & Quick (1-pager)" },
  { value: "detailed", label: "Detailed & Comprehensive" },
];

const CLASS_SIZES = [
  { value: "~40 students", label: "Average (~40 students)" },
  { value: "small class of ~20 students", label: "Small (~20 students)" },
  { value: "large class of 60+ students", label: "Large (60+ students)" },
];

const LANG_MAP: Record<string, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
  fr: "French",
};

export default function TeachPage() {
  const { t, lang } = useLang();

  const [subject, setSubject] = useState<Subject | "">("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState<Grade | "">("");
  const [duration, setDuration] = useState<typeof DURATIONS[number]>(45);
  
  const [curriculum, setCurriculum] = useState("All African Curricula (Hybrid)");
  const [outputLanguage, setOutputLanguage] = useState(LANG_MAP[lang] || "English");
  const [style, setStyle] = useState("standard");
  const [detail, setDetail] = useState("standard");
  const [classSize, setClassSize] = useState("~40 students");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonContent | null>(null);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !grade || !topic) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/teach/generate`, {
        method: "POST",
        body: JSON.stringify({
          subject,
          topic,
          grade,
          duration,
          language: outputLanguage,
          curriculum,
          style,
          detail,
          classSize,
        }),
      });
      if (!res.ok) throw new Error("Lesson generation failed");
      const data = await res.json();
      setLesson(data.lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FadeIn className="mb-8">
        <span className="badge-teach mb-2">{t.modules.teach}</span>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mt-1">
          {t.teach.title}
        </h1>
        <p className="text-stone-500 mt-1">{t.teach.subtitle}</p>
      </FadeIn>

      {!lesson && !loading && (
        <FadeIn delay={0.08} className="card p-6 md:p-8">
          <form className="space-y-5" onSubmit={generate}>
            <div>
              <label className="label">{t.teach.subject}</label>
              <select
                className="input"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
              >
                <option value="" disabled>—</option>
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">{t.teach.topic}</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Fractions, The Water Cycle, Simple Sentences"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t.teach.grade}</label>
                <select
                  className="input"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                >
                  <option value="" disabled>—</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t.teach.duration}</label>
                <select
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) as typeof DURATIONS[number])}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} {t.teach.minutes}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Curriculum</label>
                <select
                  className="input"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                >
                  {CURRICULA.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Output Language</label>
                <select
                  className="input"
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Lesson Style</label>
                <select
                  className="input"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Detail Level</label>
                <select
                  className="input"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                >
                  {DETAILS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Class Size</label>
              <select
                className="input"
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
              >
                {CLASS_SIZES.map((cs) => (
                  <option key={cs.value} value={cs.value}>{cs.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" className="btn-teal w-full flex items-center justify-center gap-2 py-3">
              <Sparkles className="w-4 h-4" /> {t.teach.generate}
            </button>
          </form>
        </FadeIn>
      )}

      {loading && (
        <div className="card p-6 md:p-8 flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
          <p className="text-stone-600 font-medium">{t.teach.generating}</p>
        </div>
      )}

      {lesson && !loading && (
        <div className="space-y-4">
          <FadeIn>
            <div className="card p-6 md:p-8 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-teal-700 text-sm font-medium">{topic}</p>
                  <h2 className="text-lg font-display font-semibold text-stone-900">
                    {SUBJECTS.find((s) => s.value === subject)?.label} · {GRADES.find((g) => g.value === grade)?.label} · {duration} {t.teach.minutes}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge-read text-xs font-semibold">{curriculum}</span>
                    <span className="badge-teach text-xs font-semibold">{outputLanguage}</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {lesson.markdown ? (
            <FadeIn delay={0.06}>
              <div className="card p-6 md:p-8 prose prose-stone prose-sm max-w-none">
                <ReactMarkdown>{lesson.markdown}</ReactMarkdown>
              </div>
            </FadeIn>
          ) : (
            <>
              <FadeIn delay={0.06}>
                <div className="card p-6">
                  <h3 className="font-semibold text-stone-900 mb-2">{t.teach.objectivesLabel}</h3>
                  <ul className="space-y-1.5 list-disc list-inside text-sm text-stone-600">
                    {lesson.objectives?.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div className="card p-6">
                  <h3 className="font-semibold text-stone-900 mb-2">{t.teach.materialsLabel}</h3>
                  <p className="text-sm text-stone-600">{lesson.materials?.join(", ")}</p>
                </div>
              </FadeIn>

              <FadeIn delay={0.18}>
                <div className="card p-6">
                  <h3 className="font-semibold text-stone-900 mb-2">{t.teach.starterLabel}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{lesson.introduction}</p>
                </div>
              </FadeIn>

              <FadeIn delay={0.24}>
                <div className="card p-6">
                  <h3 className="font-semibold text-stone-900 mb-3">{t.teach.mainActivityLabel}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed mb-4">{lesson.mainActivity?.standard}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-teal-700 mb-1">{t.teach.supportLabel}</p>
                      <p className="text-sm text-stone-600">{lesson.mainActivity?.support}</p>
                    </div>
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-brand-700 mb-1">{t.teach.extensionLabel}</p>
                      <p className="text-sm text-stone-600">{lesson.mainActivity?.extension}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="card p-6">
                  <h3 className="font-semibold text-stone-900 mb-2">{t.teach.assessmentLabel}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{lesson.assessment}</p>
                </div>
              </FadeIn>

              {lesson.homework && (
                <FadeIn delay={0.36}>
                  <div className="card p-6">
                    <h3 className="font-semibold text-stone-900 mb-2">{t.teach.homeworkLabel}</h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{lesson.homework}</p>
                  </div>
                </FadeIn>
              )}

              {lesson.neurodivergentTips && lesson.neurodivergentTips.length > 0 && (
                <FadeIn delay={0.42}>
                  <div className="card p-6 bg-coral-50 border-coral-200">
                    <h3 className="font-semibold text-stone-900 mb-2">{t.teach.tipsLabel}</h3>
                    <ul className="space-y-1.5 list-disc list-inside text-sm text-stone-600">
                      {lesson.neurodivergentTips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                  </div>
                </FadeIn>
              )}
            </>
          )}

          <button
            className="btn-outline w-full"
            onClick={() => { setLesson(null); setTopic(""); }}
          >
            {t.teach.newLessonButton}
          </button>
        </div>
      )}
    </div>
  );
}
