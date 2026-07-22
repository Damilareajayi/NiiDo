"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { getGreeting } from "@/lib/greeting";
import { FadeIn } from "@/components/ui/FadeIn";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { GraduationCap, Users, FileText, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface ClassStats {
  totalStudents: number;
  assessedCount: number;
  lessonsGeneratedThisWeek: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/teacher/class-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickStats = [
    { label: "My Students",       value: stats?.totalStudents ?? 0,           icon: Users,    color: "bg-sky-100 text-sky-600" },
    { label: "Lessons Generated", value: stats?.lessonsGeneratedThisWeek ?? 0, icon: FileText, color: "bg-teal-100 text-teal-600" },
    { label: "Students Assessed", value: stats?.assessedCount ?? 0,          icon: Sparkles, color: "bg-coral-100 text-coral-600" },
  ];

  // A solo teacher with 0-1 students has nothing meaningful to manage yet —
  // the fuller class/roster dashboard only makes sense once there's a real class.
  const isSimple = !loading && (stats?.totalStudents ?? 0) < 2;

  return (
    <div className="max-w-5xl mx-auto">
      <FadeIn className="mb-8 flex items-center gap-4">
        <img src="/mascot/mascot-running.png" alt="" className="w-14 h-auto hidden sm:block" />
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👩‍🏫
          </h1>
          <p className="text-stone-500 mt-1">Here&apos;s what&apos;s happening in your classroom today.</p>
        </div>
      </FadeIn>

      {/* Stats — only meaningful once there's a real class to report on */}
      {!isSimple && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading
            ? [0, 1, 2].map((i) => <StatCardSkeleton key={i} />)
            : quickStats.map((s, i) => <StatCard key={i} index={i} {...s} />)}
        </div>
      )}

      {isSimple && (
        <FadeIn delay={0.1}>
          <div className="card p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <img src="/mascot/mascot-waving.png" alt="" className="w-20 h-auto shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-display font-semibold text-stone-900">
                Add your first students to unlock your class dashboard
              </h2>
              <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                Once you have at least 2 students, you&apos;ll see class-wide stats, learning-track
                breakdowns, and assessment progress here.
              </p>
            </div>
            <Link href="/teacher/upload" className="btn-brand shrink-0 flex items-center gap-2">
              Import Students <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      )}

      {/* NiiDo Teach CTA */}
      <FadeIn delay={0.16}>
        <div className="card p-6 md:p-8 mb-6 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <span className="badge-teach mb-2">{t.modules.teach}</span>
              <h2 className="text-xl font-display font-semibold text-stone-900 mt-1">
                Generate a personalised lesson plan
              </h2>
              <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                AI-powered, curriculum-aligned. Differentiated for all your learners in seconds.
              </p>
            </div>
            <Link href="/teacher/teach" className="btn-teal shrink-0 flex items-center gap-2">
              {t.teach.generate} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Quick links */}
      <div className={`grid grid-cols-1 gap-4 ${isSimple ? "sm:max-w-sm" : "sm:grid-cols-2"}`}>
        {!isSimple && (
          <FadeIn delay={0.22}>
            <Link href="/teacher/class" className="card p-5 hover:border-brand-300 group cursor-pointer block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">My Classes</p>
                  <p className="text-stone-400 text-xs">View student profiles and learning tracks</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 group-hover:translate-x-0.5 ml-auto transition-all" />
              </div>
            </Link>
          </FadeIn>
        )}

        <FadeIn delay={0.28}>
          <Link href="/teacher/upload" className="card p-5 hover:border-brand-300 group cursor-pointer block">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Import Students</p>
                <p className="text-stone-400 text-xs">Upload register photo or CSV file</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 group-hover:translate-x-0.5 ml-auto transition-all" />
            </div>
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
