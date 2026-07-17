// Drives Google's hidden translate widget (see components/layout/GoogleTranslate.tsx)
// from our own UI.
//
// Earlier version tried to simulate a change event on Google's internal
// ".goog-te-combo" <select> — that's fragile and silently no-ops across some
// versions of the widget. Google Translate actually reads a "googtrans"
// cookie on page load to decide what to translate to, so setting that cookie
// and reloading is the reliable, documented way to drive it from custom UI.
const COOKIE_NAME = "googtrans";

function writeCookie(value: string | null) {
  const expires = value === null ? "expires=Thu, 01 Jan 1970 00:00:00 UTC;" : "";
  const cookieValue = value ?? "";
  // Set both without a domain (covers localhost and most setups) and with the
  // current hostname explicitly (Google's own script sometimes reads/writes
  // it at the root domain) so this works whichever one it checks.
  document.cookie = `${COOKIE_NAME}=${cookieValue}; ${expires} path=/`;
  document.cookie = `${COOKIE_NAME}=${cookieValue}; ${expires} path=/; domain=${window.location.hostname}`;
}

export function setSiteLanguage(code: string): void {
  if (code === "en") {
    writeCookie(null); // clears translation entirely, restoring the original text
  } else {
    writeCookie(`/en/${code}`);
  }
  window.location.reload();
}

export function getCurrentSiteLanguage(): string {
  const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
  return match ? match[1] : "en";
}
