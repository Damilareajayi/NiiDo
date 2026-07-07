"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useReadProfile } from "@/hooks/useReadProfile";
import { apiFetch } from "@/lib/api";
import { AssessmentQuestion, AssessmentResponse, Grade } from "@/types";
import { GRADES } from "@/lib/constants";
import { FadeIn } from "@/components/ui/FadeIn";
import { Brain, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

const TRACK_COLORS: Record<string, string> = {
  visual:      "from-purple-400 to-purple-600",
  auditory:    "from-blue-400 to-blue-600",
  kinesthetic: "from-green-400 to-green-600",
  readwrite:   "from-amber-400 to-amber-600",
  multimodal:  "from-pink-400 to-pink-600",
};

type Stage = "loading" | "about" | "questions" | "analysing" | "results" | "error";

export default function ReadAssessmentPage() {
  const { t, lang } = useLang();
  const { profile, loading: profileLoading, refetch } = useReadProfile();

  const [stage, setStage] = useState<Stage>("loading");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState<Grade | "">("");
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(profile);

  useEffect(() => {
    if (profileLoading) return;
    if (profile) {
      setResult(profile);
      setStage("results");
    } else {
      setStage("about");
    }
  }, [profileLoading, profile]);

  useEffect(() => {
    if (stage !== "about" && stage !== "questions") return;
    if (questions.length > 0) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/read/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => setError("Could not load the assessment. Please try again."));
  }, [stage, questions.length]);

  const startAssessment = () => {
    setCurrent(0);
    setResponses([]);
    setQuestionStartedAt(Date.now());
    setStage("questions");
  };

  const selectOption = (option: AssessmentQuestion["options"][number]) => {
    const q = questions[current];
    const timeSpent = Math.round((Date.now() - questionStartedAt) / 1000);
    const next = [
      ...responses,
      {
        questionId: q.id,
        questionText: q.text,
        selectedOption: option.label,
        indicatorType: option.indicator,
        timeSpent,
      },
    ];
    setResponses(next);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setQuestionStartedAt(Date.now());
    } else {
      submitAssessment(next);
    }
  };

  const submitAssessment = async (finalResponses: AssessmentResponse[]) => {
    setStage("analysing");
    setError(null);
    try {
      const res = await apiFetch(`/api/read/analyse`, {
        method: "POST",
        body: JSON.stringify({
          responses: finalResponses,
          age: Number(age),
          grade,
          language: lang,
        }),
      });
      if (!res.ok) throw new Error("Assessment analysis failed");
      const data = await res.json();
      setResult(data.profile);
      await refetch();
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  if (stage === "loading" || profileLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (stage === "about") {
    return (
      <FadeIn className="max-w-lg mx-auto">
        <div className="card p-6 md:p-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-display font-semibold text-stone-900">
            {t.read.aboutYouTitle}
          </h1>
          <p className="text-stone-500 text-sm mt-1 mb-6">{t.read.aboutYouSubtitle}</p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (age && grade) startAssessment();
            }}
          >
            <div>
              <label className="label">{t.read.ageLabel}</label>
              <input
                type="number"
                className="input"
                min={4}
                max={20}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t.read.gradeLabel}</label>
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
            <button type="submit" className="btn-teal w-full flex items-center justify-center gap-2">
              {t.read.continueButton} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </FadeIn>
    );
  }

  if (stage === "questions") {
    const q = questions[current];
    if (!q) {
      return (
        <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      );
    }
    const pct = Math.round((current / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-stone-500 mb-2">
          {t.read.progress
            .replace("{current}", String(current + 1))
            .replace("{total}", String(questions.length))}
        </p>
        <div className="w-full bg-stone-100 rounded-full h-2 mb-8 overflow-hidden">
          <div
            className="progress-bar h-full bg-teal-500 rounded-full"
            style={{ "--progress": `${pct}%` } as React.CSSProperties}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="card p-6 md:p-8"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h2 className="text-lg font-display font-semibold text-stone-900 mb-6">{q.text}</h2>
            <div className="space-y-3">
              {q.options.map((opt) => (
                <motion.button
                  key={opt.label}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectOption(opt)}
                  className="w-full text-left px-5 py-4 rounded-xl border border-stone-200
                             hover:border-teal-400 hover:bg-teal-50 transition-all duration-150
                             text-stone-700 font-medium"
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (stage === "analysing") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-stone-600 font-medium">{t.read.analysing}</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-6 text-red-600">{error}</div>
        <button className="btn-teal mt-4" onClick={() => setStage("about")}>
          {t.common.back}
        </button>
      </div>
    );
  }

  // results
  const track = result?.primaryTrack as string | undefined;
  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn>
        <div className={`card p-6 md:p-8 mb-6 bg-gradient-to-br ${TRACK_COLORS[track || ""] || "from-teal-400 to-teal-600"} text-white border-0`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">{t.read.resultsTitle}</p>
              <h2 className="text-2xl font-display font-semibold mt-0.5">
                {track ? t.read.tracks[track as keyof typeof t.read.tracks] : "—"}
              </h2>
            </div>
          </div>
        </div>
      </FadeIn>

      {result?.supportLevel && (
        <FadeIn delay={0.08}>
          <div className={`card p-5 mb-4 ${result.supportLevel !== "none" ? "bg-coral-50 border-coral-200" : ""}`}>
            <p className={`text-sm ${result.supportLevel !== "none" ? "text-coral-700" : "text-stone-500"}`}>
              {t.read.support[result.supportLevel as keyof typeof t.read.support]}
            </p>
          </div>
        </FadeIn>
      )}

      {result?.strengths?.length > 0 && (
        <FadeIn delay={0.16}>
          <div className="card p-5 mb-4">
            <h3 className="font-semibold text-stone-900 mb-2">{t.read.strengthsLabel}</h3>
            <ul className="space-y-1.5">
              {result.strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      )}

      {result?.parentNote && (
        <FadeIn delay={0.24}>
          <div className="card p-5 mb-6 bg-teal-50 border-teal-200">
            <h3 className="font-semibold text-stone-900 mb-1">{t.read.parentNoteLabel}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{result.parentNote}</p>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.3} className="flex gap-3">
        <Link href="/student" className="btn-teal flex-1 text-center">
          {t.read.goToDashboard}
        </Link>
        <button
          className="btn-outline flex-1"
          onClick={() => { setResult(null); setStage("about"); }}
        >
          {t.read.retakeButton}
        </button>
      </FadeIn>
    </div>
  );
}
