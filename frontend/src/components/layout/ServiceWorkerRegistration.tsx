"use client";

import { useEffect } from "react";

// Registers the no-op service worker (public/sw.js) needed for PWA
// installability. Silently no-ops in browsers without support, and never
// throws — this must never be able to break the app.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
