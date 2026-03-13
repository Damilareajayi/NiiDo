"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GraduationCap, Users, FileText, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLang();

  const quickStats = [
    { label: "My Students",      value: "—", icon: Users,        color: "bg-brand-100 text-brand-600" },
    { label: "Lessons Generated", value: "—", icon: FileText,     color: "bg-teal-100 text-teal-600" },
    { label: "Students Assessed", value: "—", icon: Sparkles,     color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          Welcome, {user?.name?.split(" ")[0]} 👩‍🏫
        </h1>
        <p className="text-stone-500 mt-1">Here's what's happening in your classroom today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickStats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-display font-bold text-stone-900">{s.value}</p>
            <p className="text-stone-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* NiiDo Teach CTA */}
      <div className="card p-6 md:p-8 mb-6 border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <span className="badge-teach mb-2">{t.modules.teach}</span>
            <h2 className="text-xl font-display font-semibold text-stone-900 mt-1">
              Generate a personalised lesson plan
            </h2>
            <p className="text-stone-500 text-sm mt-1 leading-relaxed">
              AI-powered, NERDC curriculum aligned. Differentiated for all your learners in seconds.
            </p>
          </div>
          <Link href="/teacher/teach" className="btn-brand shrink-0 flex items-center gap-2">
            {t.teach.generate} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/teacher/class" className="card p-5 hover:border-brand-300 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">My Classes</p>
              <p className="text-stone-400 text-xs">View student profiles and learning tracks</p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 ml-auto" />
          </div>
        </Link>

        <Link href="/teacher/upload" className="card p-5 hover:border-teal-300 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Import Students</p>
              <p className="text-stone-400 text-xs">Upload register photo or CSV file</p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-500 ml-auto" />
          </div>
        </Link>
      </div>
    </div>
  );
}
