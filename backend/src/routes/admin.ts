// ── NiiDo Admin Route — teacher & student account management ──
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import admin from "firebase-admin";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole } from "../middleware/auth";
import { createStudentAccount, generatePassword } from "../services/accounts";
import { todayKey } from "./analytics";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

// Platform-wide metrics (below) are NiiDo's own, not any one school's — every
// other route on this router is scoped to req.authUser.schoolId, which is
// deliberately wrong for that. Gate it to the platform owner specifically,
// same email the frontend's Profile Role Switcher already restricts itself to.
const OWNER_EMAIL = "ajayidamilarefelix@gmail.com";

function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.authUser?.email !== OWNER_EMAIL) {
    return res.status(403).json({ error: "Owner access only" });
  }
  next();
}

// ── Teachers ────────────────────────────────────────────────

const CreateTeacherSchema = z.object({
  name:      z.string().min(2),
  email:     z.string().email(),
  subjects:  z.array(z.string()).optional().default([]),
  language:  z.enum(["en", "ha", "yo", "ig", "fr"]).optional().default("en"),
});

// POST /api/admin/teachers
adminRouter.post("/teachers", async (req: Request, res: Response) => {
  try {
    const data = CreateTeacherSchema.parse(req.body);
    const schoolId = req.authUser!.schoolId;
    const password = generatePassword();

    const userRecord = await admin.auth().createUser({
      email: data.email,
      password,
      displayName: data.name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      role: "teacher",
      schoolId,
      name: data.name,
      email: data.email,
      subjects: data.subjects,
      language: data.language,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
    });

    res.json({ success: true, uid: userRecord.uid, email: data.email, temporaryPassword: password });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    if ((err as any)?.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create teacher account" });
  }
});

// GET /api/admin/teachers
adminRouter.get("/teachers", async (req: Request, res: Response) => {
  try {
    const snap = await db.collection("users")
      .where("schoolId", "==", req.authUser!.schoolId)
      .where("role", "==", "teacher")
      .get();
    const teachers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    res.json({ teachers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// ── Students ────────────────────────────────────────────────

const CreateStudentSchema = z.object({
  name:      z.string().min(2),
  grade:     z.string(),
  gender:    z.enum(["male", "female", "other"]).optional(),
  age:       z.number().min(4).max(99).optional(),
  email:     z.string().email().optional(),
  teacherId: z.string().optional(),
  language:  z.enum(["en", "ha", "yo", "ig", "fr"]).optional().default("en"),
});

// POST /api/admin/students
adminRouter.post("/students", async (req: Request, res: Response) => {
  try {
    const data = CreateStudentSchema.parse(req.body);
    const account = await createStudentAccount(req.authUser!.schoolId, data);
    res.json({ success: true, ...account });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    if ((err as any)?.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create student account" });
  }
});

// GET /api/admin/students
adminRouter.get("/students", async (req: Request, res: Response) => {
  try {
    const snap = await db.collection("students")
      .where("schoolId", "==", req.authUser!.schoolId)
      .get();
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

import { GrowthAgent } from "../services/agents/GrowthAgent";

const GrowthSchema = z.object({
  type:             z.enum(["school-pitch", "parent-nudge"]),
  adminName:        z.string().optional(),
  schoolName:       z.string().optional(),
  totalStudents:     z.number().optional(),
  assessedCount:     z.number().optional(),
  lessonsGenerated:  z.number().optional(),
  primaryNeedsCount: z.number().optional(),
  parentName:       z.string().optional(),
  studentName:      z.string().optional(),
  primaryTrack:     z.string().optional(),
  completedLessons: z.number().optional(),
});

// POST /api/admin/growth-marketing
adminRouter.post("/growth-marketing", async (req: Request, res: Response) => {
  try {
    const data = GrowthSchema.parse(req.body);
    if (data.type === "school-pitch") {
      const pitch = await GrowthAgent.generateSchoolPitch({
        adminName:        data.adminName || "Administrator",
        schoolName:       data.schoolName || "Our School",
        totalStudents:     data.totalStudents || 100,
        assessedCount:     data.assessedCount || 40,
        lessonsGenerated:  data.lessonsGenerated || 15,
        primaryNeedsCount: data.primaryNeedsCount || 5,
      });
      return res.json({ success: true, ...pitch });
    } else {
      const nudge = await GrowthAgent.generateParentNudge({
        parentName:       data.parentName || "Parent",
        studentName:      data.studentName || "Student",
        primaryTrack:     data.primaryTrack || "Visual",
        completedLessons: data.completedLessons || 3,
      });
      return res.json({ success: true, ...nudge });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate marketing campaign" });
  }
});

// ── Platform dashboard (owner-only) ──────────────────────────

// GET /api/admin/platform-stats
adminRouter.get("/platform-stats", requireOwner, async (_req: Request, res: Response) => {
  try {
    const [usersSnap, studentsSnap, lessonsSnap, schoolsSnap, visitsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("students").get(),
      db.collection("lessons").get(),
      db.collection("schools").get(),
      db.collection("analyticsDaily").orderBy("date", "desc").limit(14).get(),
    ]);

    let students = 0, teachers = 0, admins = 0, premium = 0, free = 0;
    usersSnap.forEach((doc) => {
      const d = doc.data();
      if (d.role === "student") students++;
      if (d.role === "teacher") teachers++;
      if (d.role === "admin") admins++;
      if (d.subscriptionTier === "premium") premium++; else free++;
    });

    const assessmentsCompleted = studentsSnap.docs.filter((d) => !!d.data().readProfile).length;

    const visitsSeries = visitsSnap.docs
      .map((d) => ({ date: d.id, visits: (d.data().visits as number) || 0 }))
      .reverse();
    const today = todayKey();
    const visitsToday = visitsSeries.find((v) => v.date === today)?.visits || 0;
    const visitsLast14Days = visitsSeries.reduce((sum, v) => sum + v.visits, 0);

    res.json({
      totalUsers: usersSnap.size,
      students,
      teachers,
      admins,
      schools: schoolsSnap.size,
      lessonsGenerated: lessonsSnap.size,
      assessmentsCompleted,
      subscriptions: { free, premium },
      visits: { today: visitsToday, last14Days: visitsLast14Days, series: visitsSeries },
    });
  } catch (err) {
    console.error("Platform stats error:", err);
    res.status(500).json({ error: "Failed to load platform stats" });
  }
});
