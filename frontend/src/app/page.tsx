"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { FadeIn } from "@/components/ui/FadeIn";
import { Brain, GraduationCap, BarChart3, School, User, ArrowRight } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    switch (user.role) {
      case "student": router.replace("/student"); break;
      case "teacher": router.replace("/teacher"); break;
      case "admin":   router.replace("/admin");   break;
    }
  }, [user, loading, router]);

  const langs = [
    { code: "en", label: "EN" },
    { code: "ha", label: "HA" },
    { code: "yo", label: "YO" },
    { code: "ig", label: "IG" },
  ] as const;

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <img src="/niido-icon-mark.svg" alt="" className="w-10 h-10 animate-pulse" />
          <p className="text-stone-400 text-sm">Loading NiiDo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
            <img src="/niido-icon-mark.svg" alt="" className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-stone-900 text-lg">NiiDo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1">
            {langs.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all
                  ${lang === l.code ? "bg-brand-500 text-white" : "text-stone-400 hover:bg-stone-100"}`}>
                {l.label}
              </button>
            ))}
          </div>
          <Link href="/login" className="btn-ghost text-sm font-semibold text-stone-700">
            {t.landing.signIn}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <FadeIn>
          <div className="flex gap-2 mb-5">
            <span className="badge-read">{t.modules.read}</span>
            <span className="badge-teach">{t.modules.teach}</span>
            <span className="badge-pulse">{t.modules.pulse}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-900 leading-tight">
            {t.landing.heroHeadline}
          </h1>
          <p className="text-stone-500 text-lg mt-5 leading-relaxed max-w-lg">
            {t.landing.heroSubtitle}
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <motion.img
            src="/niido-app-mockup.svg"
            alt=""
            className="w-full rounded-xl shadow-2xl border border-stone-200"
            initial={{ rotate: 0 }}
            animate={{ rotate: -1 }}
            transition={{ duration: 0.6 }}
          />
        </FadeIn>
      </section>

      {/* Choose your path */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          <FadeIn delay={0.1}>
            <Link href="/login" className="card p-8 flex flex-col h-full group hover:border-sky-300 block">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center mb-4">
                <School className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-stone-900">
                {t.landing.ctaSchoolTitle}
              </h2>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed flex-1">
                {t.landing.ctaSchoolDesc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sky-600 font-semibold text-sm mt-5 group-hover:gap-2.5 transition-all">
                {t.landing.getStarted} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeIn>

          <FadeIn delay={0.18}>
            <Link href="/login" className="card p-8 flex flex-col h-full group hover:border-brand-300 block">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-stone-900">
                {t.landing.ctaIndividualTitle}
              </h2>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed flex-1">
                {t.landing.ctaIndividualDesc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-brand-600 font-semibold text-sm mt-5 group-hover:gap-2.5 transition-all">
                {t.landing.signIn} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <FadeIn className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
            {t.landing.modulesTitle}
          </h2>
          <p className="text-stone-500 mt-2">{t.landing.modulesSubtitle}</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          <FadeIn delay={0.06}>
            <div className="card p-6 h-full">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="badge-read mb-2">{t.modules.read}</span>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed">{t.landing.readDesc}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="card p-6 h-full">
              <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="badge-teach mb-2">{t.modules.teach}</span>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed">{t.landing.teachDesc}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.18}>
            <div className="card p-6 h-full">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="badge-pulse mb-2">{t.modules.pulse}</span>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed">{t.landing.pulseDesc}</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <img src="/niido-icon-mark.svg" alt="" className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-semibold text-stone-700 text-sm">NiiDo</span>
          </div>
          <p className="text-stone-400 text-xs">
            {t.landing.footerTagline} · by LearnScape Africa
          </p>
        </div>
      </footer>
    </div>
  );
}
