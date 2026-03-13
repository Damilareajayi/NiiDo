"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, BookOpen, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-teal-50 flex flex-col">

      {/* Language switcher */}
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

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 shadow-lg shadow-brand-200 mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-stone-900">
              {t.appName}
            </h1>
            <p className="text-stone-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
              {t.tagline}
            </p>
          </div>

          {/* Card */}
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
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error.includes("invalid-credential")
                    ? "Incorrect email or password. Please try again."
                    : error}
                </div>
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

          {/* Module pills */}
          <div className="flex justify-center gap-2 mt-8">
            <span className="badge-read">{t.modules.read}</span>
            <span className="badge-teach">{t.modules.teach}</span>
            <span className="badge-pulse">{t.modules.pulse}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
