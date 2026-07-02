"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { BarChart3, Users, GraduationCap, Brain, AlertCircle, TrendingUp } from "lucide-react";
import { SchoolStats } from "@/types";

export default function AdminPulsePage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.schoolId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pulse/school/${user.schoolId}`);
        if (!response.ok) {
          throw new Error("Failed to load pulse data");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load pulse data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.schoolId]);

  const trackData = stats
    ? [
        { label: "Visual",      key: "visual",      pct: stats.trackDistribution.visual,      color: "bg-purple-400" },
        { label: "Kinesthetic", key: "kinesthetic", pct: stats.trackDistribution.kinesthetic, color: "bg-green-400" },
        { label: "Auditory",    key: "auditory",    pct: stats.trackDistribution.auditory,    color: "bg-blue-400" },
        { label: "Read/Write",  key: "readwrite",   pct: stats.trackDistribution.readwrite,   color: "bg-amber-400" },
        { label: "Multimodal",  key: "multimodal",  pct: stats.trackDistribution.multimodal,  color: "bg-pink-400" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="badge-pulse">{t.modules.pulse}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">{t.pulse.title}</h1>
        <p className="text-stone-500 mt-1">{t.pulse.subtitle}</p>
      </div>

      {loading ? (
        <div className="card p-6">{t.common.loading}</div>
      ) : error ? (
        <div className="card p-6 text-red-600">{error}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.totalStudents}</p>
              <p className="text-stone-500 text-xs">{t.pulse.students}</p>
            </div>
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.totalTeachers}</p>
              <p className="text-stone-500 text-xs">{t.pulse.teachers}</p>
            </div>
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.readCompletionRate}%</p>
              <p className="text-stone-500 text-xs">{t.pulse.assessed}</p>
            </div>
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.supportNeedsCount}</p>
              <p className="text-stone-500 text-xs">{t.pulse.needSupport}</p>
            </div>
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.lessonsGeneratedThisWeek}</p>
              <p className="text-stone-500 text-xs">{t.pulse.lessons}</p>
            </div>
            <div className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{stats.activeTeachersToday}</p>
              <p className="text-stone-500 text-xs">{t.pulse.activeToday}</p>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-stone-900">{t.pulse.trackDistributionLabel || "Learning Track Distribution"}</h2>
                <p className="text-stone-400 text-sm mt-0.5">{t.pulse.trackDistributionSubtitle || "How your students learn best"}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-stone-400" />
            </div>
            <div className="space-y-3">
              {trackData.map((item) => (
                <div key={item.key} className="flex items-center gap-4">
                  <p className="text-sm font-medium text-stone-700 w-24 shrink-0">{item.label}</p>
                  <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <p className="text-sm font-semibold text-stone-600 w-10 text-right shrink-0">{item.pct}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-stone-500 text-sm">{t.pulse.lastUpdatedLabel || "Last updated"}: {new Date(stats.lastUpdated).toLocaleString()}</p>
          </div>
        </>
      ) : (
        <div className="card p-6">{t.pulse.noData || "No pulse data available."}</div>
      )}
    </div>
  );
}
