// ── Web Push notifications ──────────────────────────────────────
// Standard Web Push (RFC 8291/8292) via a self-generated VAPID key pair —
// not Firebase Cloud Messaging. FCM's Web Push VAPID certificate has to be
// generated through the Firebase Console (no API for it, confirmed), which
// would've blocked this on a manual step; raw Web Push needs nothing but
// these two keys and works identically across browsers.
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@learnscape.africa";

export const pushConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// Never throws — a dead/expired subscription (very normal: uninstalled
// app, cleared browser data) shouldn't be able to break whatever feature
// triggered the notification. Returns whether it actually delivered, so
// the caller can decide whether to prune the subscription.
export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: { title: string; body: string; url?: string }
): Promise<{ delivered: boolean; expired: boolean }> {
  if (!pushConfigured) return { delivered: false, expired: false };
  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload));
    return { delivered: true, expired: false };
  } catch (err: any) {
    const expired = err?.statusCode === 404 || err?.statusCode === 410;
    if (!expired) console.error("Push notification failed:", err?.message || err);
    return { delivered: false, expired };
  }
}
