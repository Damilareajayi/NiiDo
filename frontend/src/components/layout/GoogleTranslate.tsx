"use client";

import { useEffect } from "react";
import Script from "next/script";

// Loads Google's translation engine invisibly — no visible Google widget at
// all. The actual UI is our own <LanguageSwitcher />, which drives this
// hidden element programmatically (see lib/googleTranslate.ts). This is the
// standard technique for using Google Translate without its default styling,
// since the language-selection popup itself is a cross-origin iframe we
// can't restyle any other way.
const INCLUDED_LANGUAGES = [
  "en", "fr", "es", "pt", "ar", "sw", "ha", "yo", "ig", "am",
  "zh-CN", "hi", "ur", "bn", "de", "ru", "ja", "ko", "tr", "id",
].join(",");

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

// Google's own script re-asserts the top banner iframe's visibility after our
// CSS loads, so a static stylesheet rule alone loses that fight intermittently.
// Actively re-hiding it on every DOM mutation (plus a polling fallback) wins
// regardless of when/how Google re-inserts or re-shows it.
function suppressGoogleBanner() {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe.goog-te-banner-frame");
  if (iframe) {
    iframe.style.setProperty("display", "none", "important");
    iframe.style.setProperty("visibility", "hidden", "important");
  }
  if (document.body.style.top !== "0px") {
    document.body.style.setProperty("top", "0px", "important");
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    const observer = new MutationObserver(suppressGoogleBanner);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    const poll = setInterval(suppressGoogleBanner, 500);
    return () => {
      observer.disconnect();
      clearInterval(poll);
    };
  }, []);

  return (
    // Positioned off-screen rather than zero-sized — Google's script has been
    // observed to skip rendering its internal <select> into a 0x0 container,
    // which would silently break the whole translate flow.
    <div style={{ position: "fixed", top: "-9999px", left: "-9999px" }} aria-hidden="true">
      <div id="google_translate_element" />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement(
              {
                pageLanguage: "en",
                includedLanguages: "${INCLUDED_LANGUAGES}",
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              },
              "google_translate_element"
            );
          }
        `}
      </Script>
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onError={() => console.error("[NiiDo] Google Translate script failed to load — likely blocked by an ad blocker or privacy extension.")}
      />
    </div>
  );
}
