"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { pushSupported, enablePushNotifications } from "@/lib/pushNotifications";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Only offered once the app is actually running as an installed app (Add
// to Home Screen / desktop install) — matching the ask specifically:
// notifications for NiiDo "added or downloaded to mobile devices", not a
// popup shown to every browser-tab visitor. Dismissing hides it for the
// rest of the session (stored in sessionStorage) rather than nagging on
// every page.
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported() || !isStandalone()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    if (sessionStorage.getItem("niido-notif-dismissed")) return;
    setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("niido-notif-dismissed", "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    const ok = await enablePushNotifications();
    setBusy(false);
    if (ok) setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  return (
    <div className="card p-4 mb-5 flex items-center gap-3 border-brand-200 bg-brand-50/50">
      <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900">Turn on notifications?</p>
        <p className="text-xs text-stone-500">Get notified about the things that matter, right on your device.</p>
      </div>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="btn-brand text-xs px-3 py-2 shrink-0"
      >
        {busy ? "..." : "Enable"}
      </button>
      <button type="button" onClick={dismiss} className="text-stone-400 hover:text-stone-600 shrink-0" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
