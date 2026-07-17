"use client";

import { AssessmentResponse } from "@/types";

const TRACKS = ["visual", "auditory", "kinesthetic", "readwrite", "multimodal"] as const;
type Track = (typeof TRACKS)[number];

const TRACK_LABELS: Record<Track, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Hands-On",
  readwrite: "Read/Write",
  multimodal: "Multimodal",
};

// Colorblind-validated (deutan/tritan ΔE ≥ 8, normal-vision ΔE ≥ 15 — see
// dataviz skill's validate_palette.js) — Tailwind's 400 shades used elsewhere
// in the app for this same track set fail the lightness-band check, these pass.
const TRACK_COLORS: Record<Track, string> = {
  visual: "bg-purple-500",
  auditory: "bg-blue-500",
  kinesthetic: "bg-green-500",
  readwrite: "bg-amber-500",
  multimodal: "bg-pink-500",
};

// Real per-question tally, not a fabricated distribution — every response
// carries the indicator type of the option the learner actually picked.
// Non-track indicators (sensory/routine/focus/attention/social/frustration
// — support signals, not learning-style identities) are excluded from the
// denominator so the percentages describe learning-style answers only.
function computeTrackBreakdown(responses: AssessmentResponse[]) {
  const counts: Record<Track, number> = { visual: 0, auditory: 0, kinesthetic: 0, readwrite: 0, multimodal: 0 };
  let total = 0;
  for (const r of responses) {
    if ((TRACKS as readonly string[]).includes(r.indicatorType)) {
      counts[r.indicatorType as Track]++;
      total++;
    }
  }
  return TRACKS.map((track) => ({
    track,
    label: TRACK_LABELS[track],
    color: TRACK_COLORS[track],
    pct: total > 0 ? Math.round((counts[track] / total) * 100) : 0,
  }));
}

interface LearnerDNAChartProps {
  responses: AssessmentResponse[];
  primaryTrack?: string;
}

export function LearnerDNAChart({ responses, primaryTrack }: LearnerDNAChartProps) {
  if (!responses || responses.length === 0) return null;
  const data = computeTrackBreakdown(responses);

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-stone-900 mb-1">Your Learning Style Breakdown</h3>
      <p className="text-stone-400 text-xs mb-5">Based on your actual assessment answers</p>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.track} className="flex items-center gap-3">
            <p className={`text-sm w-24 shrink-0 ${d.track === primaryTrack ? "font-semibold text-stone-900" : "font-medium text-stone-600"}`}>
              {d.label}
            </p>
            <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${d.color} rounded-full transition-all duration-700`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-stone-600 w-10 text-right shrink-0 tabular-nums">{d.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
