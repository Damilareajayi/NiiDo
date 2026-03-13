"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Brain, BookOpen, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLang();

  const hasProfile = !!(user as any)?.readProfile;
  const track = (user as any)?.readProfile?.primaryTrack;

  const trackColors: Record<string, string> = {
    visual:      "from-purple-400 to-purple-600",
    auditory:    "from-blue-400 to-blue-600",
    kinesthetic: "from-green-400 to-green-600",
    readwrite:   "from-amber-400 to-amber-600",
    multimodal:  "from-pink-400 to-pink-600",
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          Hello, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-stone-500 mt-1">
          {hasProfile
            ? "Your learning profile is ready. Keep going!"
            : "Let's find out how you learn best."}
        </p>
      </div>

      {/* NiiDo Read CTA */}
      {!hasProfile ? (
        <div className="card p-6 md:p-8 mb-6 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center shrink-0">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <span className="badge-read mb-2">{t.modules.read}</span>
              <h2 className="text-xl font-display font-semibold text-stone-900 mt-1">
                Discover your learning style
              </h2>
              <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                Take a short 20-question assessment and find out how your brain learns best.
                It only takes 5–8 minutes.
              </p>
            </div>
            <Link href="/student/read" className="btn-teal shrink-0 flex items-center gap-2">
              {t.read.startAssess} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className={`card p-6 mb-6 bg-gradient-to-br ${trackColors[track] || "from-teal-400 to-teal-600"} text-white border-0`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium">Your Learning Style</p>
              <h2 className="text-xl font-display font-semibold mt-0.5">
                {t.read.tracks[track as keyof typeof t.read.tracks]}
              </h2>
            </div>
            <Link href="/student/read" className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              View Profile
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/student/read" className="card p-5 hover:border-teal-300 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
              <Brain className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">{t.modules.read}</p>
              <p className="text-stone-400 text-xs">
                {hasProfile ? "View your learning profile" : "Start your assessment"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-teal-500 ml-auto transition-colors" />
          </div>
        </Link>

        <Link href="/student/learn" className="card p-5 hover:border-brand-300 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
              <BookOpen className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">My Learning</p>
              <p className="text-stone-400 text-xs">Access your personalised content</p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-500 ml-auto transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
