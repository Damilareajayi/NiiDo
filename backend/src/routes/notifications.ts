// ── NiiDo Push Notifications Route ──────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { db, Timestamp } from "../firebase";
import { requireAuth } from "../middleware/auth";
import { sendPushNotification, pushConfigured } from "../services/webpush";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// A stable, short ID per device — same endpoint re-subscribing (e.g. after
// a page reload) overwrites its own doc instead of accumulating duplicates.
function subscriptionId(endpoint: string): string {
  return crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
}

// POST /api/notifications/subscribe
notificationsRouter.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const subscription = SubscriptionSchema.parse(req.body);
    const uid = req.authUser!.uid;
    const id = subscriptionId(subscription.endpoint);

    await db.collection("users").doc(uid).collection("pushSubscriptions").doc(id).set({
      ...subscription,
      createdAt: Timestamp.now(),
    });

    // Confirms the whole pipeline works the moment someone opts in, rather
    // than leaving them to wonder whether it actually did anything.
    const result = await sendPushNotification(subscription, {
      title: "Notifications on 🎉",
      body: "You'll hear from NiiDo when there's something worth knowing about.",
    });

    res.json({ success: true, delivered: result.delivered });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subscription", details: err.errors });
    }
    console.error("Push subscribe error:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// POST /api/notifications/unsubscribe
notificationsRouter.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    const uid = req.authUser!.uid;
    await db.collection("users").doc(uid).collection("pushSubscriptions").doc(subscriptionId(endpoint)).delete();
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error("Push unsubscribe error:", err);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

// GET /api/notifications/status — whether push is configured server-side
// and whether this user has any active subscriptions, so the frontend
// doesn't need its own separate check.
notificationsRouter.get("/status", async (req: Request, res: Response) => {
  try {
    const uid = req.authUser!.uid;
    const snap = await db.collection("users").doc(uid).collection("pushSubscriptions").limit(1).get();
    res.json({ configured: pushConfigured, subscribed: !snap.empty });
  } catch (err) {
    console.error("Push status error:", err);
    res.status(500).json({ error: "Failed to check notification status" });
  }
});
