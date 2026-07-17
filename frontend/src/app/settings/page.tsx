"use client";

import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { FadeIn } from "@/components/ui/FadeIn";
import { User, Mail, Shield, Globe2, LogOut } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "fr", label: "Français" },
] as const;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();

  return (
    <ProtectedLayout>
        <div className="max-w-2xl mx-auto">
          <FadeIn className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
              {t.nav.settings}
            </h1>
            <p className="text-stone-500 mt-1">Your account and preferences</p>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-stone-900 mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Name</p>
                    <p className="text-sm font-medium text-stone-900">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Email</p>
                    <p className="text-sm font-medium text-stone-900">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Role</p>
                    <p className="text-sm font-medium text-stone-900 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <Globe2 className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="font-semibold text-stone-900">AI Content Language</h2>
              </div>
              <p className="text-stone-400 text-xs mb-4">
                The language NiiDo writes lesson plans, generated content, and WhatsApp
                messages in. To translate what's on screen into another language, use the
                "Select Language" menu in the top corner instead.
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`text-sm px-4 py-2 rounded-xl font-medium transition-all
                      ${lang === l.code
                        ? "bg-brand-500 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.18}>
            <button
              onClick={logout}
              className="w-full card p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium text-sm"
            >
              <LogOut className="w-4 h-4" /> {t.nav.logout}
            </button>
          </FadeIn>
        </div>
    </ProtectedLayout>
  );
}
