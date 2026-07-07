"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { getGreeting } from "@/lib/greeting";
import { FadeIn } from "@/components/ui/FadeIn";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { BarChart3, Users, GraduationCap, Brain, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SchoolStats } from "@/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) return;
    apiFetch(`/api/pulse/school/${user.schoolId}`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  const statCards = [
    { label: t.pulse.students,    value: stats?.totalStudents ?? 0,          icon: Users,         color: "bg-brand-100 text-brand-600" },
    { label: t.pulse.teachers,    value: stats?.totalTeachers ?? 0,          icon: GraduationCap, color: "bg-sky-100 text-sky-600" },
    { label: t.pulse.assessed,    value: `${stats?.readCompletionRate ?? 0}%`, icon: Brain,       color: "bg-teal-100 text-teal-600" },
    { label: t.pulse.needSupport, value: stats?.supportNeedsCount ?? 0,      icon: AlertCircle,   color: "bg-coral-100 text-coral-600" },
    { label: t.pulse.lessons,     value: stats?.lessonsGeneratedThisWeek ?? 0, icon: TrendingUp,  color: "bg-brand-100 text-brand-600" },
    { label: t.pulse.activeToday, value: stats?.activeTeachersToday ?? 0,    icon: Users,         color: "bg-sky-100 text-sky-600" },
  ];

  const trackData = [
    { track: "Visual",      key: "visual",      pct: stats?.trackDistribution.visual ?? 0,      color: "bg-purple-400" },
    { track: "Hands-On",    key: "kinesthetic", pct: stats?.trackDistribution.kinesthetic ?? 0,  color: "bg-green-400"  },
    { track: "Auditory",    key: "auditory",    pct: stats?.trackDistribution.auditory ?? 0,     color: "bg-blue-400"   },
    { track: "Read/Write",  key: "readwrite",   pct: stats?.trackDistribution.readwrite ?? 0,    color: "bg-amber-400"  },
    { track: "Multimodal",  key: "multimodal",  pct: stats?.trackDistribution.multimodal ?? 0,   color: "bg-pink-400"   },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <FadeIn className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="badge-pulse">{t.modules.pulse}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          {getGreeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-stone-500 mt-1">
          Real-time overview of your school's learning activity.
        </p>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((s, i) => <StatCard key={i} index={i} {...s} />)}
      </div>

      {/* Learning Track Distribution */}
      <FadeIn delay={0.3}>
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-stone-900">Learning Track Distribution</h2>
              <p className="text-stone-400 text-sm mt-0.5">How your students learn best</p>
            </div>
            <Link href="/admin/pulse" className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
              Full Report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {trackData.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <p className="text-sm font-medium text-stone-700 w-24 shrink-0">{item.track}</p>
                <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-sm font-semibold text-stone-600 w-10 text-right shrink-0">
                  {item.pct}%
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-4 text-center italic">
            Data populates as students complete NiiDo Read assessments
          </p>
        </div>
      </FadeIn>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FadeIn delay={0.36}>
          <Link href="/admin/teachers" className="card p-5 hover:border-brand-300 group cursor-pointer block">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Manage Teachers</p>
                <p className="text-stone-400 text-xs">Add, edit and monitor teacher accounts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 group-hover:translate-x-0.5 ml-auto transition-all" />
            </div>
          </Link>
        </FadeIn>

        <FadeIn delay={0.42}>
          <Link href="/admin/upload" className="card p-5 hover:border-teal-300 group cursor-pointer block">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Import Students</p>
                <p className="text-stone-400 text-xs">Upload register photo or CSV</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-500 group-hover:translate-x-0.5 ml-auto transition-all" />
            </div>
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
