"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { FadeIn } from "@/components/ui/FadeIn";
import { VisitsChart } from "@/components/admin/VisitsChart";
import { Users, GraduationCap, School, BookOpenCheck, ClipboardCheck, Crown, Eye, Loader2 } from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  students: number;
  teachers: number;
  admins: number;
  schools: number;
  lessonsGenerated: number;
  assessmentsCompleted: number;
  subscriptions: { free: number; premium: number };
  visits: { today: number; last14Days: number; series: { date: string; visits: number }[] };
}

const OWNER_EMAIL = "ajayidamilarefelix@gmail.com";

function StatTile({ icon: Icon, label, value, accent }: {
  icon: typeof Users; label: string; value: number | string; accent: string;
}) {
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-display font-bold text-stone-900 tabular-nums mt-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-stone-500 text-xs font-medium">{label}</p>
    </div>
  );
}

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email !== OWNER_EMAIL) return;
    apiFetch("/api/admin/platform-stats")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [user]);

  // Same restriction as the Profile Role Switcher — this is platform-wide
  // data, not any one school's, so it's exclusively the owner's to see.
  if (user?.email !== OWNER_EMAIL) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <FadeIn className="mb-8">
        <span className="badge-pulse mb-2">NiiDo Platform</span>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900 mt-1">
          Platform Dashboard
        </h1>
        <p className="text-stone-500 mt-1">
          Site-wide traffic, accounts, and usage across all of NiiDo — owner view only.
        </p>
      </FadeIn>

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
          <p className="text-stone-600 font-medium">Loading platform stats...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {stats && !loading && (
        <FadeIn className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={Eye}            label="Visits Today"        value={stats.visits.today}          accent="bg-brand-50 text-brand-600" />
            <StatTile icon={Users}          label="Total Users"         value={stats.totalUsers}            accent="bg-sky-50 text-sky-600" />
            <StatTile icon={GraduationCap}  label="Students"            value={stats.students}              accent="bg-coral-50 text-coral-600" />
            <StatTile icon={School}         label="Teachers"            value={stats.teachers}              accent="bg-teal-50 text-teal-600" />
            <StatTile icon={School}         label="Schools"             value={stats.schools}               accent="bg-amber-50 text-amber-600" />
            <StatTile icon={Crown}          label="Premium Subscribers" value={stats.subscriptions.premium} accent="bg-purple-50 text-purple-600" />
            <StatTile icon={BookOpenCheck}  label="Lessons Generated"   value={stats.lessonsGenerated}      accent="bg-blue-50 text-blue-600" />
            <StatTile icon={ClipboardCheck} label="Assessments Done"    value={stats.assessmentsCompleted}  accent="bg-green-50 text-green-600" />
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-semibold text-stone-900">Visits — Last 14 Days</h2>
              <p className="text-stone-400 text-xs">{stats.visits.last14Days.toLocaleString()} total</p>
            </div>
            <p className="text-stone-400 text-xs mb-5">Page loads on the NiiDo landing page</p>
            <VisitsChart series={stats.visits.series} />
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-stone-900 mb-4">Subscriptions</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${stats.subscriptions.premium + stats.subscriptions.free > 0
                      ? (stats.subscriptions.premium / (stats.subscriptions.premium + stats.subscriptions.free)) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm text-stone-500 shrink-0 tabular-nums">
                {stats.subscriptions.premium.toLocaleString()} premium · {stats.subscriptions.free.toLocaleString()} free
              </p>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
