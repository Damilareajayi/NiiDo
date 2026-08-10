"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, Check } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Language } from "@/types";

// Each language labeled in its own script, so it's recognizable even to
// someone who can't read English — the whole point of offering it.
const LANGUAGES = [
  { code: "en",    label: "English" },
  { code: "fr",    label: "Français" },
  { code: "es",    label: "Español" },
  { code: "pt",    label: "Português" },
  { code: "ar",    label: "العربية" },
  { code: "sw",    label: "Kiswahili" },
  { code: "ha",    label: "Hausa" },
  { code: "yo",    label: "Yorùbá" },
  { code: "ig",    label: "Igbo" },
  { code: "am",    label: "አማርኛ" },
  { code: "zh-CN", label: "中文" },
  { code: "hi",    label: "हिन्दी" },
  { code: "ur",    label: "اردو" },
  { code: "bn",    label: "বাংলা" },
  { code: "de",    label: "Deutsch" },
  { code: "ru",    label: "Русский" },
  { code: "ja",    label: "日本語" },
  { code: "ko",    label: "한국어" },
  { code: "tr",    label: "Türkçe" },
  { code: "id",    label: "Bahasa Indonesia" },
];

// A clean, fully custom "Select Language" control that floats bottom-right.
// On mobile it's icon-only (a compact circular FAB) rather than a wide
// pill — confirmed via screenshot audit that the full pill can land on top
// of whatever content happens to be at that corner of the current scroll
// position (login's module badges, signup's Age/School fields), since a
// fixed element doesn't know what's underneath it. A small circle can still
// graze content but can't fully cover a field the way a ~140px pill does.
// From sm: up there's enough room that the full label is safe to show.
export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLang();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (code: string) => {
    setLang(code as Language);
    setOpen(false);
  };

  const currentLabel = LANGUAGES.find((l) => l.code === lang)?.label || "Select Language";

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 max-h-72 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl py-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => select(l.code)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left hover:bg-stone-50 transition-colors
                ${lang === l.code ? "text-brand-700 font-medium" : "text-stone-700"}`}
            >
              {l.label}
              {lang === l.code && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center gap-2 bg-white border border-stone-200 shadow-md
                   w-11 h-11 rounded-full sm:w-auto sm:h-auto sm:pl-3 sm:pr-4 sm:py-2.5
                   text-sm font-medium text-stone-700 hover:shadow-lg transition-shadow"
        aria-label="Select language"
      >
        <Globe2 className="w-4 h-4 text-brand-500 shrink-0" />
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>
    </div>
  );
}
