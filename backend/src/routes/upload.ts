import { Router, Request, Response } from "express";
import multer from "multer";
import { extractStudentsFromImage } from "../services/gemini";

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

// POST /api/upload/register-photo
// Teacher uploads photo of class register → extract student names
uploadRouter.post("/register-photo", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const base64 = req.file.buffer.toString("base64");
    const result = await extractStudentsFromImage(base64, req.file.mimetype);
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
    const csv = req.file.buffer.toString("utf-8");
    const lines = csv.split("\n").filter(Boolean);
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());

    const nameIdx   = headers.findIndex((h) => h.includes("name"));
    const gradeIdx  = headers.findIndex((h) => h.includes("grade") || h.includes("class"));
    const genderIdx = headers.findIndex((h) => h.includes("gender") || h.includes("sex"));

    const detected = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
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
