"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReadProfile } from "@/hooks/useReadProfile";
import { apiFetch } from "@/lib/api";
import { progressColorAt } from "@/lib/colorGradient";
import { FadeIn } from "@/components/ui/FadeIn";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen, Sparkles, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Lock } from "lucide-react";

interface LearningSection {
  heading: string;
  body: string;
}

interface LearningContent {
  subject: string;
  topic: string;
  sections: LearningSection[];
}

type Stage = "form" | "loading" | "reading" | "done" | "premium-required" | "error";

export default function MyLearningPage() {
  const { profile, loading: profileLoading } = useReadProfile();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<LearningContent | null>(null);
  const [step, setStep] = useState(0);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic) return;
    setStage("loading");
    setError(null);
    try {
      const res = await apiFetch("/api/learn/generate", {
        method: "POST",
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (res.status === 403 && data.code === "PREMIUM_REQUIRED") {
        setStage("premium-required");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to generate content");
      setContent(data.content);
      setStep(0);
      setStage("reading");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  };

  const reset = () => {
    setContent(null);
    setTopic("");
    setStep(0);
    setStage("form");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          My Learning
        </h1>
        <p className="text-stone-500 mt-1">Learn anything, any subject, at your own pace.</p>
      </FadeIn>

      {profileLoading ? null : !profile ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={BookOpen}
            mascotSrc="/mascot/mascot-reading.png"
            title="Complete NiiDo Read first"
            description="Once you've finished your learning style assessment, content here will be shaped just for you."
            actionLabel="Start Assessment"
            actionHref="/student/read"
            colorClass="bg-coral-100 text-coral-600"
          />
        </FadeIn>
      ) : stage === "premium-required" ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={Lock}
            mascotSrc="/mascot/mascot-waving.png"
            title="My Learning is a Premium feature"
            description="Upgrade to NiiDo Premium to generate self-paced lessons on any subject, tailored to how you learn."
            actionLabel="See Premium Plans"
            actionHref="/#pricing"
            colorClass="bg-brand-100 text-brand-600"
          />
        </FadeIn>
      ) : stage === "form" ? (
        <FadeIn delay={0.08} className="card p-6 md:p-8">
          <form className="space-y-5" onSubmit={generate}>
            <div>
              <label className="label">Subject or discipline</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Organic Chemistry, Constitutional Law, Fractions, Machine Learning"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="label">What do you want to learn about?</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Covalent bonds, The First Amendment, Simple Sentences"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button type="submit" className="btn-brand w-full flex items-center justify-center gap-2 py-3">
              <Sparkles className="w-4 h-4" /> Generate My Lesson
            </button>
          </form>
        </FadeIn>
      ) : stage === "loading" ? (
        <div className="card p-6 md:p-8 flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
          <p className="text-stone-600 font-medium">Creating your personalised lesson...</p>
        </div>
      ) : stage === "error" ? (
        <FadeIn delay={0.08}>
          <div className="card p-6 text-red-600 mb-4">{error}</div>
          <button className="btn-brand" onClick={() => setStage("form")}>Try Again</button>
        </FadeIn>
      ) : content && (stage === "reading" || stage === "done") ? (
        <div>
          <FadeIn>
            <div className="card p-6 mb-5 border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
              <p className="text-brand-700 text-sm font-medium">{content.subject}</p>
              <h2 className="text-lg font-display font-semibold text-stone-900">{content.topic}</h2>
            </div>
          </FadeIn>

          {/* Self-paced progress — same colorful step style as the assessment */}
          <div className="flex items-center gap-1 mb-5">
            {content.sections.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2.5 rounded-full transition-opacity duration-300"
                style={{
                  backgroundColor: progressColorAt(content.sections.length > 1 ? i / (content.sections.length - 1) : 0),
                  opacity: i <= step ? 1 : 0.25,
                }}
              />
            ))}
          </div>

          {stage === "reading" ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="card p-6 md:p-8"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">
                  Step {step + 1} of {content.sections.length}
                </p>
                <h3 className="font-display font-semibold text-stone-900 text-lg mb-3">
                  {content.sections[step].heading}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {content.sections[step].body}
                </p>

                <div className="flex gap-3 mt-8">
                  {step > 0 && (
                    <button
                      type="button"
                      className="btn-outline flex-1 flex items-center justify-center gap-2"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-brand flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                      if (step + 1 < content.sections.length) setStep((s) => s + 1);
                      else setStage("done");
                    }}
                  >
                    {step + 1 < content.sections.length ? "Next" : "Finish"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <FadeIn className="card p-6 md:p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-stone-900 text-lg mb-1">Nice work!</h3>
              <p className="text-sm text-stone-500 mb-6">You've been through the whole lesson at your own pace.</p>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(0)}>
                  Review Again
                </button>
                <button className="btn-brand flex-1" onClick={reset}>
                  Learn Something Else
                </button>
              </div>
            </FadeIn>
          )}
        </div>
      ) : null}
    </div>
  );
}
