"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag — not covered by the standard media query.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Chrome/Edge/Android: fires beforeinstallprompt, which we capture and
// replay later from our own button (the browser suppresses its default
// mini-infobar once we call preventDefault(), so without this there'd be
// no visible way to install at all on some platforms) — clicking triggers
// the real native install prompt.
// iOS Safari: has no install API whatsoever — "Add to Home Screen" is only
// reachable via the Share sheet, so clicking instead opens a small popover
// with those steps. Kept as the same compact button in both cases (rather
// than always-visible instruction text) so it doesn't overflow the nav bar
// on narrow phones, where the iOS case is by far the most common visitor.
export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (isIOS()) {
      setIos(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowHint(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClick = async () => {
    if (ios) {
      setShowHint((s) => !s);
      return;
    }
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
  };

  if (installed) return null;
  if (!ios && !installEvent) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="btn-ghost text-sm font-semibold text-stone-700 flex items-center gap-1.5"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showHint && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 z-20 text-sm text-stone-600 leading-relaxed">
          <p className="flex items-center gap-1.5 font-semibold text-stone-900 mb-1">
            <Share className="w-4 h-4" /> Tap Share
          </p>
          <p className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 shrink-0" /> then &quot;Add to Home Screen&quot;
          </p>
        </div>
      )}
    </div>
  );
}
