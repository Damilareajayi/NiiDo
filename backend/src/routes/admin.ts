// ── NiiDo Admin Route — teacher & student account management ──
import { Router, Request, Response } from "express";
import { z } from "zod";
import admin from "firebase-admin";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole } from "../middleware/auth";
import { createStudentAccount, generatePassword } from "../services/accounts";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

// ── Teachers ────────────────────────────────────────────────

const CreateTeacherSchema = z.object({
  name:      z.string().min(2),
  email:     z.string().email(),
  subjects:  z.array(z.string()).optional().default([]),
  language:  z.enum(["en", "ha", "yo", "ig"]).optional().default("en"),
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
  age:       z.number().min(4).max(20).optional(),
  email:     z.string().email().optional(),
  teacherId: z.string().optional(),
  language:  z.enum(["en", "ha", "yo", "ig"]).optional().default("en"),
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
