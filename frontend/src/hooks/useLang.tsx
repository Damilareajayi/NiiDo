"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language } from "@/types";

// Preload the English locale as the baseline fallback to ensure no blank screens
import enLocale from "@/i18n/locales/en.json";

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof enLocale;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [t, setT] = useState<typeof enLocale>(enLocale);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("niido_lang");
      if (saved && ["en", "ha", "yo", "ig", "fr", "es", "pt", "ar", "sw", "am", "zh-CN", "hi", "ur", "bn", "de", "ru", "ja", "ko", "tr", "id"].includes(saved)) {
        setLangState(saved as Language);
      }
    }
  }, []);

  useEffect(() => {
    // Load local translation dictionary dynamically based on the current active language
    const loadTranslations = async () => {
      try {
        let data: any;
        switch (lang) {
          case "fr":
            data = await import("@/i18n/locales/fr.json");
            break;
          case "ha":
            data = await import("@/i18n/locales/ha.json");
            break;
          case "yo":
            data = await import("@/i18n/locales/yo.json");
            break;
          case "ig":
            data = await import("@/i18n/locales/ig.json");
            break;
          case "es":
            data = await import("@/i18n/locales/es.json");
            break;
          case "pt":
            data = await import("@/i18n/locales/pt.json");
            break;
          case "ar":
            data = await import("@/i18n/locales/ar.json");
            break;
          case "sw":
            data = await import("@/i18n/locales/sw.json");
            break;
          case "am":
            data = await import("@/i18n/locales/am.json");
            break;
          case "zh-CN":
            data = await import("@/i18n/locales/zh-CN.json");
            break;
          case "hi":
            data = await import("@/i18n/locales/hi.json");
            break;
          case "ur":
            data = await import("@/i18n/locales/ur.json");
            break;
          case "bn":
            data = await import("@/i18n/locales/bn.json");
            break;
          case "de":
            data = await import("@/i18n/locales/de.json");
            break;
          case "ru":
            data = await import("@/i18n/locales/ru.json");
            break;
          case "ja":
            data = await import("@/i18n/locales/ja.json");
            break;
          case "ko":
            data = await import("@/i18n/locales/ko.json");
            break;
          case "tr":
            data = await import("@/i18n/locales/tr.json");
            break;
          case "id":
            data = await import("@/i18n/locales/id.json");
            break;
          default:
            data = enLocale;
        }
        setT(data.default || data);
      } catch (err) {
        console.error(`Failed to load translations for ${lang}:`, err);
        setT(enLocale); // Safe fallback to English on any loading error
      }
    };

    loadTranslations();
  }, [lang]);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("niido_lang", l);
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
