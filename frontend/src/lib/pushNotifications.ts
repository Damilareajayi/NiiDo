import { apiFetch } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Web Push application server keys are base64url; PushManager.subscribe
// needs them as a raw Uint8Array — this is the standard conversion.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC_KEY;
}

// Requests notification permission, subscribes via the already-registered
// service worker, and saves the subscription server-side. Returns false
// (never throws) if the user declines or anything in the chain fails —
// this is an optional enhancement, not something that should be able to
// break the page that offered it.
export async function enablePushNotifications(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // TS's lib.dom types are overly strict here (Uint8Array's buffer is
      // typed ArrayBufferLike, which technically also covers
      // SharedArrayBuffer) — this one is always a plain ArrayBuffer, built
      // fresh via `new Uint8Array(length)` above, never shared.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
    });

    const res = await apiFetch("/api/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription.toJSON()),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to enable push notifications:", err);
    return false;
  }
}
