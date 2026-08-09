"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { FadeIn } from "@/components/ui/FadeIn";
import { progressColorAt } from "@/lib/colorGradient";
import { Brain, GraduationCap, BarChart3, School, User, ArrowRight, Globe2, BookOpenCheck, MessageCircle, Check, Sparkles, BookOpen } from "lucide-react";

const LEARNER_DNA_PREVIEW = [
  { label: "Visual",     pct: 62, color: "bg-purple-500" },
  { label: "Auditory",   pct: 38, color: "bg-blue-500" },
  { label: "Hands-On",   pct: 45, color: "bg-green-500" },
];

export default function RootPage() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (!user.role || !["student", "teacher", "admin"].includes(user.role)) {
      router.replace("/complete-profile");
      return;
    }
    switch (user.role) {
      case "student": router.replace("/student"); break;
      case "teacher": router.replace("/teacher"); break;
      case "admin":   router.replace("/admin");   break;
    }
  }, [user, loading, router]);

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
          <Link href="/login" className="btn-ghost text-sm font-semibold text-stone-700">
            {t.landing.signIn}
          </Link>
          <Link href="/assessment" className="btn-brand text-sm">
            {t.landing.tryForFree}
          </Link>
        </div>
      </nav>

      {/* Hero — merged with the assessment pitch, one mascot serving both */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Text side — on a coral card so it calls out against the plain page background */}
          <FadeIn delay={0.06}>
            <div className="relative rounded-3xl bg-gradient-to-br from-coral-500 to-coral-600 overflow-hidden p-8 md:p-10">
              <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl" />
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
                  {t.landing.assessmentCtaTitle}
                </h1>
                <p className="text-coral-50 text-lg mt-4 leading-relaxed">
                  {t.landing.assessmentCtaSubtitle}
                </p>
                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-2 bg-white text-coral-600 font-semibold px-6 py-3.5 rounded-xl mt-7
                             hover:bg-coral-50 transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" /> {t.landing.assessmentCtaButton}
                </Link>
                <p className="text-coral-100/80 text-xs mt-3">{t.landing.assessmentCtaNote}</p>
              </div>
            </div>
          </FadeIn>

          {/* Mascot — bigger, transparent, no background card */}
          <FadeIn delay={0.12} className="flex justify-center lg:justify-end">
            <img
              src="/mascot/mascot-waving.png"
              alt=""
              className="w-72 md:w-[26rem] h-auto select-none"
            />
          </FadeIn>
        </div>
      </section>

      {/* Choose your path — our three major users, each colored to match their home module */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-5">
          <FadeIn delay={0.1}>
            <Link href="/signup?role=student" className="card p-8 flex flex-col h-full group border-t-4 border-t-coral-500 hover:shadow-lg hover:-translate-y-0.5 block relative overflow-hidden transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-coral-50/80 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-coral-100 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-coral-600" />
                </div>
                <h2 className="text-xl font-display font-semibold text-stone-900">
                  {t.landing.ctaStudentTitle}
                </h2>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed flex-1">
                  {t.landing.ctaStudentDesc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-coral-600 font-semibold text-sm mt-5 group-hover:gap-2.5 transition-all">
                  {t.landing.getStarted} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.16}>
            <Link href="/signup?role=teacher" className="card p-8 flex flex-col h-full group border-t-4 border-t-teal-500 hover:shadow-lg hover:-translate-y-0.5 block relative overflow-hidden transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-display font-semibold text-stone-900">
                  {t.landing.ctaTeacherTitle}
                </h2>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed flex-1">
                  {t.landing.ctaTeacherDesc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-teal-600 font-semibold text-sm mt-5 group-hover:gap-2.5 transition-all">
                  {t.landing.getStarted} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.22}>
            <Link href="/signup?role=admin" className="card p-8 flex flex-col h-full group border-t-4 border-t-sky-500 hover:shadow-lg hover:-translate-y-0.5 block relative overflow-hidden transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50/80 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
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
              </div>
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
            <div className="card overflow-hidden h-full flex flex-col">
              <div className="h-44 overflow-hidden bg-coral-50 shrink-0 flex items-end justify-center">
                <img src="/mascot/mascot-read.webp" alt="" className="h-full w-auto object-contain" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-coral-500 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="badge-read mb-2">{t.modules.read}</span>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed mb-4">{t.landing.readDesc}</p>
                <ul className="space-y-2">
                  {[t.landing.readFeature1, t.landing.readFeature2, t.landing.readFeature3].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-coral-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="card overflow-hidden h-full flex flex-col">
              <div className="h-44 overflow-hidden bg-teal-50 shrink-0 flex items-end justify-center">
                <img src="/mascot/mascot-running.png" alt="" className="h-full w-auto object-contain" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="badge-teach mb-2">{t.modules.teach}</span>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed mb-4">{t.landing.teachDesc}</p>
                <ul className="space-y-2">
                  {[t.landing.teachFeature1, t.landing.teachFeature2, t.landing.teachFeature3].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.18}>
            <div className="card overflow-hidden h-full flex flex-col">
              <div className="h-44 overflow-hidden bg-sky-50 shrink-0 flex items-end justify-center">
                <img src="/mascot/mascot-pulse.webp" alt="" className="h-full w-auto object-contain" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="badge-pulse mb-2">{t.modules.pulse}</span>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed mb-4">{t.landing.pulseDesc}</p>
                <ul className="space-y-2">
                  {[t.landing.pulseFeature1, t.landing.pulseFeature2, t.landing.pulseFeature3].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Platform snapshot — real UI patterns from NiiDo Read, LearnerDNA, and My Learning, not illustrative mockups */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-4">
          <FadeIn delay={0.04}>
            <div className="card p-5">
              <span className="badge-read">{t.modules.read}</span>
              <p className="font-semibold text-stone-900 mt-3">Discover your learning style</p>
              <p className="text-xs text-stone-400 mt-0.5 mb-3">A short, colorful assessment — no two learners look the same</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2.5 rounded-full"
                    style={{ backgroundColor: progressColorAt(i / 9), opacity: i <= 6 ? 1 : 0.25 }}
                  />
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="card p-5">
              <p className="text-[10px] tracking-widest text-stone-400 font-semibold uppercase mb-3">LearnerDNA Profile</p>
              <div className="space-y-2">
                {LEARNER_DNA_PREVIEW.map((track) => (
                  <div key={track.label} className="flex items-center gap-2.5">
                    <p className="text-xs font-medium text-stone-600 w-14 shrink-0">{track.label}</p>
                    <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${track.color} rounded-full`} style={{ width: `${track.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="card p-5">
              <div className="flex items-center gap-2 text-brand-500 mb-3">
                <BookOpen className="w-4 h-4" />
                <p className="text-[10px] tracking-widest font-semibold uppercase">My Learning</p>
              </div>
              <p className="font-semibold text-stone-900">Learn anything, at your pace</p>
              <p className="text-xs text-stone-400 mt-0.5 mb-3">Self-guided steps, any subject or discipline</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full ${i <= 1 ? "bg-brand-500" : "bg-stone-100"}`} />
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2">Step 2 of 5</p>
            </div>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <FadeIn delay={0.1}>
            <div className="card p-5 h-full">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                <p className="text-[10px] tracking-widest font-semibold uppercase">Languages</p>
              </div>
              <p className="text-2xl font-display font-bold text-brand-600">20+</p>
              <p className="text-xs text-stone-400 mt-0.5">Any language, any learner</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="card p-5 h-full">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1.5">
                <BookOpenCheck className="w-3.5 h-3.5" />
                <p className="text-[10px] tracking-widest font-semibold uppercase">Curriculum</p>
              </div>
              <p className="text-2xl font-display font-bold text-teal-600">Global</p>
              <p className="text-xs text-stone-400 mt-0.5">NERDC, CBC, IB &amp; more</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="card p-5 h-full">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <p className="text-[10px] tracking-widest font-semibold uppercase">Teach via</p>
              </div>
              <p className="text-2xl font-display font-bold text-sky-600">WhatsApp</p>
              <p className="text-xs text-stone-400 mt-0.5">Built-in delivery</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.25}>
            <Link href="/signup" className="rounded-2xl bg-brand-600 hover:bg-brand-700 transition-colors p-5 h-full flex flex-col justify-center block">
              <p className="text-white/60 text-[10px] tracking-widest font-semibold uppercase">Start Your Journey</p>
              <p className="font-display font-bold text-lg text-white mt-1">{t.landing.tryForFree}</p>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Pricing — Free / Premium / School */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 pb-24">
        <FadeIn className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
            {t.landing.pricingTitle}
          </h2>
          <p className="text-stone-500 mt-2">{t.landing.pricingSubtitle}</p>
        </FadeIn>

        <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <FadeIn delay={0.08}>
            <div className="card p-8 h-full flex flex-col">
              <h3 className="text-lg font-display font-semibold text-stone-900">{t.landing.freeTitle}</h3>
              <p className="text-stone-400 text-sm mt-1">{t.landing.freeSubtitle}</p>
              <p className="font-display font-bold text-4xl text-stone-900 mt-4">{t.landing.freePrice}</p>
              <ul className="space-y-2.5 mt-6 flex-1">
                {[t.landing.freeFeature1, t.landing.freeFeature2, t.landing.freeFeature3, t.landing.freeFeature4, t.landing.freeFeature5].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-brand w-full text-center mt-6">
                {t.landing.freeCta}
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <div className="card p-8 h-full flex flex-col border-2 border-brand-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Popular
              </div>
              <h3 className="text-lg font-display font-semibold text-stone-900">{t.landing.premiumTitle}</h3>
              <p className="text-stone-400 text-sm mt-1">{t.landing.premiumSubtitle}</p>
              <p className="mt-4">
                <span className="font-display font-bold text-4xl text-stone-900">{t.landing.premiumPrice}</span>
                <span className="text-stone-400 text-sm font-medium">{t.landing.premiumPricePeriod}</span>
              </p>
              <ul className="space-y-2.5 mt-6 flex-1">
                {[t.landing.premiumFeature1, t.landing.premiumFeature2, t.landing.premiumFeature3, t.landing.premiumFeature4, t.landing.premiumFeature5].map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "text-stone-500 italic" : "text-stone-600"}`}>
                    {i !== 0 && <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />} {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-brand-600 font-medium mt-4">{t.landing.premiumNote}</p>
              <Link href="/signup" className="btn-brand w-full text-center mt-3">
                {t.landing.premiumCta}
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="card p-8 h-full flex flex-col">
              <h3 className="text-lg font-display font-semibold text-stone-900">{t.landing.schoolTitle}</h3>
              <p className="text-stone-400 text-sm mt-1">{t.landing.schoolSubtitle}</p>
              <p className="font-display font-bold text-4xl text-stone-900 mt-4">{t.landing.schoolPrice}</p>
              <ul className="space-y-2.5 mt-6 flex-1">
                {[t.landing.schoolFeature1, t.landing.schoolFeature2, t.landing.schoolFeature3, t.landing.schoolFeature4, t.landing.schoolFeature5].map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "text-stone-500 italic" : "text-stone-600"}`}>
                    {i !== 0 && <Check className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />} {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-stone-400 font-medium mt-4">{t.landing.schoolNote}</p>
              <a href="mailto:sales@learnscape.africa" className="btn-outline w-full text-center mt-3">
                {t.landing.schoolCta}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <img src="/niido-icon-mark.svg" alt="" className="w-3.5 h-3.5" />
            </div>
            <span className="font-display font-semibold text-stone-700 text-sm">NiiDo</span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <span className="text-stone-400 font-semibold uppercase tracking-wide">LearnScape</span>
            <a
              href="https://learnscape.africa/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 hover:text-stone-700 transition-colors"
            >
              Main Website
            </a>
            <a
              href="https://learnscape.africa/edvolution"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 hover:text-stone-700 transition-colors"
            >
              Edvolution Summit
            </a>
          </div>

          <p className="text-stone-400 text-xs">
            {t.landing.footerTagline} · by LearnScape Africa
          </p>
        </div>
      </footer>
    </div>
  );
}
