"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { FadeIn } from "@/components/ui/FadeIn";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Brain, BarChart3 } from "lucide-react";

interface ClassStats {
  totalStudents: number;
  assessedCount: number;
  readCompletionRate: number;
  trackDistribution: Record<string, number>;
}

const TRACKS = [
  { key: "visual",      label: "Visual",      color: "bg-purple-400" },
  { key: "kinesthetic",  label: "Hands-On",    color: "bg-green-400" },
  { key: "auditory",    label: "Auditory",     color: "bg-blue-400" },
  { key: "readwrite",   label: "Read/Write",   color: "bg-amber-400" },
  { key: "multimodal",  label: "Multimodal",   color: "bg-pink-400" },
];

export default function TeacherClassPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/teacher/class-stats")
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          {t.nav.classes}
        </h1>
        <p className="text-stone-500 mt-1">How your class learns, at a glance</p>
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : !stats || stats.totalStudents === 0 ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Ask your admin to assign students to you, or import your class register."
            actionLabel="Import Students"
            actionHref="/teacher/upload"
            colorClass="bg-brand-100 text-brand-600"
          />
        </FadeIn>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard index={0} label="Total Students" value={stats.totalStudents} icon={Users} color="bg-brand-100 text-brand-600" />
            <StatCard index={1} label="Assessed" value={`${stats.readCompletionRate}%`} icon={Brain} color="bg-teal-100 text-teal-600" />
          </div>

          <FadeIn delay={0.2}>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-semibold text-stone-900">Learning Track Distribution</h2>
                  <p className="text-stone-400 text-sm mt-0.5">How your students learn best</p>
                </div>
                <BarChart3 className="w-5 h-5 text-stone-400" />
              </div>
              <div className="space-y-3">
                {TRACKS.map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <p className="text-sm font-medium text-stone-700 w-24 shrink-0">{item.label}</p>
                    <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${stats.trackDistribution[item.key] || 0}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-stone-600 w-10 text-right shrink-0">
                      {stats.trackDistribution[item.key] || 0}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}
