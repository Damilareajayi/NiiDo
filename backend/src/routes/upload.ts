import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { CopilotAgent } from "../services/agents/CopilotAgent";
import { requireAuth, requireRole } from "../middleware/auth";
import { createStudentAccount } from "../services/accounts";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and PDF files are allowed"));
  },
});

uploadRouter.use(requireAuth, requireRole("teacher", "admin"));

// POST /api/upload/register-photo
// Teacher uploads photo of class register → extract student names
uploadRouter.post("/register-photo", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const base64 = req.file.buffer.toString("base64");
    const result = await CopilotAgent.extractStudentsFromImage(base64, req.file.mimetype);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// POST /api/upload/csv
// Parse a CSV and return student list for review
uploadRouter.post("/csv", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const csv = req.file.buffer.toString("utf-8").replace(/\r/g, "");
    const lines = csv.split("\n").filter(Boolean);
    const headers = lines[0].toLowerCase().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((h) => h.replace(/^"|"$/g, "").trim());

    const nameIdx   = headers.findIndex((h) => h.includes("name"));
    const gradeIdx  = headers.findIndex((h) => h.includes("grade") || h.includes("class"));
    const genderIdx = headers.findIndex((h) => h.includes("gender") || h.includes("sex"));

    const detected = lines.slice(1).map((line) => {
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
      return {
        name:      nameIdx   >= 0 ? cols[nameIdx]   : cols[0] || "",
        grade:     gradeIdx  >= 0 ? cols[gradeIdx]  : null,
        gender:    genderIdx >= 0 ? cols[genderIdx] : null,
        confirmed: false,
      };
    }).filter((s) => s.name);

    res.json({
      success: true,
      detected,
      confidence: 0.95,
      rawText:    csv,
      warnings:   detected.length === 0 ? ["No students found — check CSV format"] : [],
    });
  } catch (err) {
    res.status(500).json({ error: "CSV processing failed" });
  }
});

const ConfirmSchema = z.object({
  students: z.array(z.object({
    name:   z.string().min(2),
    grade:  z.string().min(1),
    gender: z.enum(["male", "female", "other"]).optional(),
    age:    z.number().min(4).max(20).optional(),
  })).min(1),
});

// POST /api/upload/confirm
// Create real accounts for the reviewed/confirmed students from a photo or CSV import
uploadRouter.post("/confirm", async (req: Request, res: Response) => {
  try {
    const data = ConfirmSchema.parse(req.body);
    const schoolId = req.authUser!.schoolId;
    const teacherId = req.authUser!.role === "teacher" ? req.authUser!.uid : undefined;

    const created: { name: string; email: string; temporaryPassword: string }[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const student of data.students) {
      try {
        const account = await createStudentAccount(schoolId, { ...student, teacherId });
        created.push({ name: student.name, email: account.email, temporaryPassword: account.temporaryPassword });
      } catch (err) {
        failed.push({ name: student.name, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    res.json({ success: true, created, failed });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to import students" });
  }
});
