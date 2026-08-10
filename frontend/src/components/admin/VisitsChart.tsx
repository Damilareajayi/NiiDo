"use client";

import { useState } from "react";

interface VisitsChartProps {
  series: { date: string; visits: number }[];
}

const BAR_FILL = "#8b5cf6"; // brand-500 — single series, one sequential hue

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).slice(0, 1);
}

function formatFullDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Single-series daily bar chart — no legend needed (one series, named by the
// card title), rounded data-ends, recessive axis, hover tooltip per bar.
export function VisitsChart({ series }: VisitsChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (series.length === 0) {
    return <p className="text-stone-400 text-sm py-8 text-center">No visit data yet.</p>;
  }

  const max = Math.max(...series.map((s) => s.visits), 1);
  const height = 140;
  const barGap = 6;

  return (
    <div className="relative">
      {hovered !== null && (
        <div
          className="absolute -top-1 -translate-y-full bg-stone-900 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap z-10 shadow-lg"
          style={{ left: `${(hovered + 0.5) * (100 / series.length)}%`, transform: "translate(-50%, -100%)" }}
        >
          <span className="font-semibold tabular-nums">{series[hovered].visits.toLocaleString()}</span>
          {" visits · "}
          {formatFullDate(series[hovered].date)}
        </div>
      )}
      <div className="flex items-end" style={{ height, gap: barGap }}>
        {series.map((s, i) => (
          <div
            key={s.date}
            className="flex-1 flex items-end h-full cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-full rounded-t-[4px] transition-opacity"
              style={{
                height: `${Math.max((s.visits / max) * 100, 2)}%`,
                backgroundColor: BAR_FILL,
                opacity: hovered === null || hovered === i ? 1 : 0.4,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-2" style={{ gap: barGap }}>
        {series.map((s) => (
          <div key={s.date} className="flex-1 text-center text-[11px] text-stone-400">
            {formatDayLabel(s.date)}
          </div>
        ))}
      </div>
    </div>
  );
}
