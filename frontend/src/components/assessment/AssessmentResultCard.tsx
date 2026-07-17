"use client";

import Link from "next/link";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { FadeIn } from "@/components/ui/FadeIn";
import { LearnerDNAChart } from "@/components/assessment/LearnerDNAChart";

const TRACK_COLORS: Record<string, string> = {
  visual:      "from-purple-400 to-purple-600",
  auditory:    "from-blue-400 to-blue-600",
  kinesthetic: "from-green-400 to-green-600",
  readwrite:   "from-amber-400 to-amber-600",
  multimodal:  "from-pink-400 to-pink-600",
};

interface AssessmentResultCardProps {
  result: any;
  onRetake?: () => void;
  homeHref: string;
}

export function AssessmentResultCard({ result, onRetake, homeHref }: AssessmentResultCardProps) {
  const { t } = useLang();
  const track = result?.primaryTrack as string | undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn>
        <div className={`card p-6 md:p-8 mb-6 bg-gradient-to-br ${TRACK_COLORS[track || ""] || "from-coral-400 to-coral-600"} text-white border-0`}>
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

      {result?.rawResponses?.length > 0 && (
        <FadeIn delay={0.04} className="mb-4">
          <LearnerDNAChart responses={result.rawResponses} primaryTrack={track} />
        </FadeIn>
      )}

      {result?.supportLevel && (
        <FadeIn delay={0.08}>
          <div className="card p-5 mb-4 flex items-center gap-3">
            {result.supportLevel !== "none" && (
              <HeartHandshake className="w-5 h-5 text-coral-500 shrink-0" />
            )}
            <p className="text-sm text-stone-600">
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
                  <CheckCircle2 className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      )}

      {result?.parentNote && (
        <FadeIn delay={0.24}>
          <div className="card p-5 mb-6 bg-coral-50 border-coral-200">
            <h3 className="font-semibold text-stone-900 mb-1">{t.read.parentNoteLabel}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{result.parentNote}</p>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.3} className="flex gap-3">
        <Link href={homeHref} className="btn-coral flex-1 text-center">
          {t.read.goToDashboard}
        </Link>
        {onRetake && (
          <button className="btn-outline flex-1" onClick={onRetake}>
            {t.read.retakeButton}
          </button>
        )}
      </FadeIn>
    </div>
  );
}
