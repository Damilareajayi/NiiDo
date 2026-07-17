// ── NiiDo Auth Route — public self-serve signup ────────────────
// Anyone can sign up directly as a student, teacher, or school admin,
// using any email address (gmail, personal, school-issued — no domain
// restriction), or via Google/phone sign-in (see /complete-profile).
// Self-serve accounts get schoolId = their own uid, i.e. their own
// independent space, distinct from admin-created accounts (see
// routes/admin.ts) which get assigned into the creating admin's real
// school. This means every existing schoolId-scoped query works
// unchanged for both paths.
import { Router, Request, Response } from "express";
import { z } from "zod";
import admin from "firebase-admin";
import { db, Timestamp } from "../firebase";
import { verifyTokenOnly } from "../middleware/auth";

export const authRouter = Router();

const ProfileFieldsSchema = z.object({
  role:      z.enum(["student", "teacher", "admin"]),
  language:  z.enum(["en", "ha", "yo", "ig", "fr"]).optional().default("en"),
  // student-specific
  grade:     z.string().optional(),
  age:       z.number().min(4).max(99).optional(),
  gender:    z.enum(["male", "female", "other"]).optional(),
  // teacher-specific
  subjects:  z.array(z.string()).optional(),
  // school (admin)-specific
  schoolName: z.string().min(2).optional(),
  state:      z.string().optional(),
  lga:        z.string().optional(),
});

function validateRoleFields(data: z.infer<typeof ProfileFieldsSchema>): string | null {
  if (data.role === "student" && !data.grade) return "Grade is required for student signup";
  if (data.role === "admin" && !data.schoolName) return "School name is required for school signup";
  return null;
}

// Shared Firestore writes for turning a Firebase Auth account into a
// NiiDo profile — used by both fresh signup and post-OAuth completion.
async function createNiiDoProfile(
  uid: string,
  name: string,
  email: string | undefined,
  data: z.infer<typeof ProfileFieldsSchema>
) {
  const schoolId = uid; // self-serve accounts own their own space
  const now = Timestamp.now();

  const userDoc: Record<string, unknown> = {
    role: data.role,
    schoolId,
    name,
    ...(email ? { email } : {}),
    language: data.language,
    createdAt: now,
    lastActive: now,
    // No payment processor wired up yet — always starts "free" until
    // manually upgraded (see backend/scripts/set-premium.ts) or real billing lands.
    subscriptionTier: "free",
  };

  if (data.role === "student") {
    userDoc.grade = data.grade;
    if (data.age !== undefined) userDoc.age = data.age;
    if (data.gender) userDoc.gender = data.gender;
    if (data.schoolName) userDoc.schoolName = data.schoolName;
  }
  if (data.role === "teacher") {
    if (data.subjects) userDoc.subjects = data.subjects;
    if (data.schoolName) userDoc.schoolName = data.schoolName;
  }

  const writes = [db.collection("users").doc(uid).set(userDoc)];

  if (data.role === "student") {
    writes.push(db.collection("students").doc(uid).set(userDoc, { merge: true }));
  }

  if (data.role === "admin") {
    writes.push(
      db.collection("schools").doc(schoolId).set({
        id: schoolId,
        name: data.schoolName,
        state: data.state || "",
        lga: data.lga || "",
        adminUid: uid,
        teacherCount: 0,
        studentCount: 0,
        createdAt: now,
        subscriptionTier: "free",
      })
    );
  }

  await Promise.all(writes);
}

// POST /api/auth/signup
// Fresh email+password signup — creates a brand-new Firebase Auth account.
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const data = ProfileFieldsSchema.extend({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    }).parse(req.body);

    const validationError = validateRoleFields(data);
    if (validationError) return res.status(400).json({ error: validationError });

    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    await createNiiDoProfile(userRecord.uid, data.name, data.email, data);

    res.json({ success: true, uid: userRecord.uid });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    if ((err as any)?.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/complete-profile
// For Google/phone sign-in: the Firebase Auth account already exists,
// but has no NiiDo profile yet. Requires a valid ID token (verifyTokenOnly
// does NOT require an existing Firestore doc, unlike requireAuth).
authRouter.post("/complete-profile", verifyTokenOnly, async (req: Request, res: Response) => {
  try {
    const data = ProfileFieldsSchema.extend({
      name: z.string().min(2),
    }).parse(req.body);

    const validationError = validateRoleFields(data);
    if (validationError) return res.status(400).json({ error: validationError });

    const uid = req.firebaseIdentity!.uid;
    const existing = await db.collection("users").doc(uid).get();
    if (existing.exists) {
      return res.status(409).json({ error: "Profile already exists for this account" });
    }

    await createNiiDoProfile(uid, data.name, req.firebaseIdentity!.email, data);

    res.json({ success: true, uid });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error("Complete-profile error:", err);
    res.status(500).json({ error: "Failed to complete profile" });
  }
});
