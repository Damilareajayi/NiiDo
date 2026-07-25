"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { useReadProfile } from "@/hooks/useReadProfile";
import { apiFetch } from "@/lib/api";
import { AssessmentQuestion, AssessmentResponse, Grade } from "@/types";
import { ASSESSMENT_GRADES } from "@/lib/constants";
import { progressColorAt } from "@/lib/colorGradient";
import { FadeIn } from "@/components/ui/FadeIn";
import { AssessmentResultCard } from "@/components/assessment/AssessmentResultCard";
import {
  Loader2, ArrowRight,
  Eye, Ear, Hand, BookOpen, Sparkles, Volume2, Repeat, Target,
  MessageCircle, Frown, type LucideIcon,
} from "lucide-react";

const INDICATOR_ICONS: Record<string, LucideIcon> = {
  visual: Eye, auditory: Ear, kinesthetic: Hand, readwrite: BookOpen,
  multimodal: Sparkles, sensory: Volume2, routine: Repeat, focus: Target,
  social: MessageCircle, attention: Target, frustration: Frown,
};

// Percent-of-total checkpoints where an encouraging interstitial appears —
// fractions rather than fixed indices so this still works if question count changes.
const ENCOURAGE_MILESTONES = [0.3, 0.6, 0.85];

const PENDING_KEY = "niido_pending_assessment";

type Stage = "loading" | "about" | "questions" | "encourage" | "complete" | "analysing" | "results" | "error";

export interface PendingAssessment {
  responses: AssessmentResponse[];
  age: number;
  grade: string;
  language: string;
}

export function AssessmentFlow({ mode }: { mode: "authenticated" | "public" }) {
  const { t, lang } = useLang();
  const router = useRouter();
  // Always call the hook (Rules of Hooks) — its result is simply unused in public mode.
  const { profile, loading: profileLoading, refetch } = useReadProfile();

  const [stage, setStage] = useState<Stage>("loading");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState<Grade | "adult" | "">("");
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [encourageIdx, setEncourageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(profile);

  useEffect(() => {
    if (mode !== "authenticated") { setStage("about"); return; }
    if (profileLoading) return;
    if (profile) {
      setResult(profile);
      setStage("results");
    } else {
      setStage("about");
    }
  }, [mode, profileLoading, profile]);

  useEffect(() => {
    if (stage !== "about" && stage !== "questions") return;
    if (questions.length > 0) return;
    const isPreview = typeof window !== "undefined" && window.location.hostname.includes("preview.cloudshell.dev");
    const apiUrl = isPreview ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
    fetch(`${apiUrl}/api/read/questions?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => {
        setError("Could not load the assessment. Please try again.");
        setStage("error");
      });
  }, [stage, questions.length]);

  const milestoneIndices = questions.length
    ? ENCOURAGE_MILESTONES.map((f) => Math.round(questions.length * f)).filter((i) => i > 0 && i < questions.length)
    : [];

  const startAssessment = () => {
    setCurrent(0);
    setResponses([]);
    setEncourageIdx(0);
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

    const answeredCount = current + 1;
    if (answeredCount >= questions.length) {
      setStage("complete");
      return;
    }
    if (milestoneIndices.includes(answeredCount) && encourageIdx < 3) {
      setStage("encourage");
      return;
    }
    setCurrent(current + 1);
    setQuestionStartedAt(Date.now());
  };

  const continueFromEncourage = () => {
    setEncourageIdx((i) => i + 1);
    setCurrent(current + 1);
    setQuestionStartedAt(Date.now());
    setStage("questions");
  };

  const submitAssessment = async () => {
    setStage("analysing");
    setError(null);
    try {
      const res = await apiFetch(`/api/read/analyse`, {
        method: "POST",
        body: JSON.stringify({ responses, age: Number(age), grade, language: lang }),
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

  const handleSeeResults = () => {
    if (mode === "authenticated") {
      submitAssessment();
      return;
    }
    const pending: PendingAssessment = { responses, age: Number(age), grade, language: lang };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    router.push("/login?next=/assessment/results");
  };

  const handleCreateAccount = () => {
    const pending: PendingAssessment = { responses, age: Number(age), grade, language: lang };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    router.push("/signup?next=/assessment/results");
  };

  if (stage === "loading" || (mode === "authenticated" && profileLoading)) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
      </div>
    );
  }

  if (stage === "about") {
    return (
      <FadeIn className="max-w-lg mx-auto">
        <div className="card p-6 md:p-8">
          <img src="/mascot/mascot-waving.png" alt="" className="w-20 h-auto mb-4" />
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
                max={99}
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
                onChange={(e) => setGrade(e.target.value as Grade | "adult")}
              >
                <option value="" disabled>—</option>
                {ASSESSMENT_GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
                <option value="adult">{t.read.gradeAdultOption}</option>
              </select>
            </div>
            <button type="submit" className="btn-coral w-full flex items-center justify-center gap-2">
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
          <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
        </div>
      );
    }
    return (
      <div className="max-w-2xl mx-auto" key={current}>
        <div className="flex items-center gap-3 mb-8">
          <img src="/mascot/mascot-reading.png" alt="" className="w-9 h-auto shrink-0" />
          <div
            className="flex-1 flex items-center gap-1"
            role="progressbar"
            aria-valuenow={current + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-label={`Question ${current + 1} of ${questions.length}`}
          >
            {questions.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-6 rounded-full transition-opacity duration-300"
                style={{
                  backgroundColor: progressColorAt(questions.length > 1 ? i / (questions.length - 1) : 0),
                  opacity: i <= current ? 1 : 0.25,
                }}
              />
            ))}
          </div>
        </div>

        <div className="card p-6 md:p-8 transition-all duration-200">
          <h2 className="text-lg font-display font-semibold text-stone-900 mb-6">{q.text}</h2>
          <div className="space-y-3">
            {q.options.map((opt) => {
              const Icon = INDICATOR_ICONS[opt.indicator] || Sparkles;
              return (
                <button
                  key={opt.label}
                  onClick={() => selectOption(opt)}
                  className="w-full flex items-center gap-3 text-left px-5 py-4 rounded-xl border border-stone-200
                             hover:border-coral-400 hover:bg-coral-50 transition-all duration-150
                             active:scale-[0.98] transform-gpu
                             text-stone-700 font-medium"
                >
                  <div className="w-9 h-9 rounded-lg bg-coral-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-coral-500" />
                  </div>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (stage === "encourage") {
    const titles = [t.read.encourageTitle1, t.read.encourageTitle2, t.read.encourageTitle3];
    const bodies = [t.read.encourageBody1, t.read.encourageBody2, t.read.encourageBody3];
    const pct = Math.round(((current + 1) / questions.length) * 100);
    return (
      <FadeIn className="max-w-lg mx-auto">
        <div className="card p-8 md:p-10 text-center">
          <img src="/mascot/mascot-waving.png" alt="" className="w-24 h-auto mx-auto mb-5" />
          <h2 className="text-xl font-display font-semibold text-stone-900 mb-2">
            {titles[encourageIdx] || titles[0]}
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed mb-2">{bodies[encourageIdx] || bodies[0]}</p>
          <p className="text-coral-500 text-xs font-semibold uppercase tracking-wide mb-6">{pct}% there</p>
          <button className="btn-coral w-full" onClick={continueFromEncourage}>
            {t.common.next}
          </button>
        </div>
      </FadeIn>
    );
  }

  if (stage === "complete") {
    return (
      <FadeIn className="max-w-lg mx-auto">
        <div className="card p-8 md:p-10 text-center">
          <img src="/mascot/mascot-running.png" alt="" className="w-28 h-auto mx-auto mb-5" />
          <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">{t.read.completeTitle}</h2>
          <p className="text-stone-500 text-sm leading-relaxed mb-8">{t.read.completeBody}</p>

          {mode === "authenticated" ? (
            <button className="btn-coral w-full flex items-center justify-center gap-2" onClick={handleSeeResults}>
              {t.read.seeResultsButton} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-3">
              <button className="btn-coral w-full" onClick={handleCreateAccount}>
                {t.read.createAccountButton}
              </button>
              <button className="btn-outline w-full" onClick={handleSeeResults}>
                {t.read.signInForResultsButton}
              </button>
              <p className="text-xs text-stone-400 mt-3">{t.read.gateNote}</p>
            </div>
          )}
        </div>
      </FadeIn>
    );
  }

  if (stage === "analysing") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral-500 mb-4" />
        <p className="text-stone-600 font-medium">{t.read.analysing}</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-6 text-red-600">{error}</div>
        <button className="btn-coral mt-4" onClick={() => setStage("about")}>
          {t.common.back}
        </button>
      </div>
    );
  }

  // results
  return (
    <AssessmentResultCard
      result={result}
      homeHref={mode === "authenticated" ? "/student" : "/"}
      onRetake={mode === "authenticated" ? () => { setResult(null); setStage("about"); } : undefined}
    />
  );
}

export { PENDING_KEY };
