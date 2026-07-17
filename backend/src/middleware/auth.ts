import { Request, Response, NextFunction } from "express";
import { db } from "../firebase";
import admin from "firebase-admin";

export interface AuthUser {
  uid: string;
  role: "student" | "teacher" | "admin";
  schoolId: string;
  name: string;
  email: string;
  subscriptionTier: "free" | "premium";
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

// Verifies the Firebase ID token on the Authorization header and attaches
// the caller's role/schoolId (from their own Firestore user doc) to req.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: "No NiiDo profile for this account" });
    }

    const data = userDoc.data()!;
    req.authUser = {
      uid: decoded.uid,
      role: data.role,
      schoolId: data.schoolId,
      name: data.name,
      email: data.email,
      subscriptionTier: data.subscriptionTier === "premium" ? "premium" : "free",
    };
    next();
  } catch (err) {
    console.error("Auth verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// No payment processor is wired up yet — subscriptionTier is only ever set
// manually (see backend/scripts/set-premium.ts) until real Stripe billing exists.
export function requirePremium(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.subscriptionTier !== "premium") {
    return res.status(403).json({ error: "This feature requires a NiiDo Premium subscription", code: "PREMIUM_REQUIRED" });
  }
  next();
}

export interface FirebaseIdentity {
  uid: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
}

declare global {
  namespace Express {
    interface Request {
      firebaseIdentity?: FirebaseIdentity;
    }
  }
}

// Verifies the Firebase ID token WITHOUT requiring an existing Firestore
// user doc — used only for profile completion, where a Firebase Auth
// account already exists (via Google/phone sign-in) but hasn't been
// turned into a NiiDo profile yet.
export async function verifyTokenOnly(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseIdentity = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      phoneNumber: decoded.phone_number,
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
