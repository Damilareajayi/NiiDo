"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      // Redirect handled by root page via auth state
      router.push("/");
    } catch {
      // Error shown via auth context
    } finally {
      setSubmitting(false);
    }
  };

  const langs = [
    { code: "en", label: "English" },
    { code: "ha", label: "Hausa" },
    { code: "yo", label: "Yorùbá" },
    { code: "ig", label: "Igbo" },
  ] as const;

  return (
    <div className="min-h-screen flex">
      {/* Left — brand hero panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy items-center justify-center p-12">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(circle at 30% 20%, #4c1d95 0%, #1a1a2e 65%)" }}
        />
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <img src="/niido-icon-mark.svg" alt="" className="w-10 h-10 mb-6" />
            <h1 className="font-display text-5xl leading-none">
              <span className="font-bold text-brand-400">nıı</span>
              <span className="font-light text-brand-100">do</span>
            </h1>
            <p className="text-coral-400 text-xs font-semibold tracking-[0.2em] uppercase mt-3">
              {t.tagline}
            </p>
            <p className="text-brand-200/60 text-sm mt-8 leading-relaxed">
              One platform, three ways to reach every learner — an adaptive assessment for
              students, an AI lesson planner for teachers, and a live pulse for school leaders.
            </p>
            <div className="flex gap-2 mt-6">
              <span className="badge-read">{t.modules.read}</span>
              <span className="badge-teach">{t.modules.teach}</span>
              <span className="badge-pulse">{t.modules.pulse}</span>
            </div>
          </motion.div>

          <motion.img
            src="/niido-app-mockup.svg"
            alt=""
            className="w-full rounded-xl shadow-2xl mt-12 border border-white/10"
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col bg-stone-50">
        <div className="flex justify-end p-4 gap-2">
          {langs.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                ${lang === l.code
                  ? "bg-brand-500 text-white"
                  : "bg-white text-stone-500 hover:bg-stone-100 border border-stone-200"}`}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          >
            {/* Logo — mobile only, since the hero panel is hidden below lg */}
            <div className="text-center mb-10 lg:hidden">
              <img src="/niido-wordmark.svg" alt={t.appName} className="h-14 mx-auto mb-4" />
              <p className="text-stone-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                {t.tagline}
              </p>
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-display font-semibold text-stone-900 mb-1">
                {t.auth.loginTitle}
              </h2>
              <p className="text-stone-500 text-sm mb-6">
                {t.auth.loginSubtitle}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">{t.auth.email}</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="teacher@school.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="label">{t.auth.password}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input pr-11"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"
                  >
                    {error.includes("invalid-credential")
                      ? "Incorrect email or password. Please try again."
                      : error}
                  </motion.div>
                )}

                <button type="submit" disabled={submitting || loading}
                  className="btn-brand w-full flex items-center justify-center gap-2 py-3">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    : t.auth.login}
                </button>
              </form>

              <p className="text-center text-stone-400 text-xs mt-6">
                {t.auth.noAccount}{" "}
                <span className="text-brand-600 font-medium">
                  {t.auth.contactAdmin}
                </span>
              </p>
            </div>

            {/* Module pills — mobile only, hero panel already shows these on desktop */}
            <div className="flex justify-center gap-2 mt-8 lg:hidden">
              <span className="badge-read">{t.modules.read}</span>
              <span className="badge-teach">{t.modules.teach}</span>
              <span className="badge-pulse">{t.modules.pulse}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
