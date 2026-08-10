"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Check, Sparkles } from "lucide-react";

// The exact three plans shown on the landing page's pricing section —
// extracted here so the paywall (My Learning) and the profile page's
// "Your Plan" card can show the real, identical plan info instead of
// just a generic "upgrade" link with no context on what you'd actually get.
export function PricingCards() {
  const { t } = useLang();

  return (
    <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
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
        <a href="mailto:sales@learnscape.africa?subject=Upgrade%20to%20NiiDo%20Premium" className="btn-brand w-full text-center mt-3">
          {t.landing.premiumCta}
        </a>
      </div>

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
    </div>
  );
}
