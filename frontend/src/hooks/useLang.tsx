"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import translations from "@/i18n/translations";
import { Language } from "@/types";

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.en;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("niido_lang", l);
    }
  };

  const t = translations[lang] as typeof translations.en;

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
