// ── NiiDo Analytics Route — anonymous visit tracking ────────────
// Feeds the owner-only platform dashboard (see admin.ts's /platform-stats).
// Deliberately minimal: one counter per UTC day, no cookies, no per-user
// identity — just "how many page loads happened today."
import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase";

export const analyticsRouter = Router();

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// POST /api/analytics/pageview
// No auth — this counts anonymous visitors, not just signed-in users, so it
// can't require a token. Never fails loudly: a broken analytics ping should
// never be visible to a real visitor.
analyticsRouter.post("/pageview", async (_req: Request, res: Response) => {
  try {
    const key = todayKey();
    await db.collection("analyticsDaily").doc(key).set(
      { date: key, visits: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.error("Pageview tracking failed:", err);
  }
  res.status(204).end();
});
