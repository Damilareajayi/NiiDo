import { Router, Request, Response } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { z } from "zod";
import { CopilotAgent } from "../services/agents/CopilotAgent";
import { requireAuth, requireRole } from "../middleware/auth";
import { createStudentAccount } from "../services/accounts";

export const uploadRouter = Router();

const EXCEL_MIMETYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // legacy .xls
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/csv", ...EXCEL_MIMETYPES];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images, PDF, CSV, or Excel files are allowed"));
  },
});

// Shared by /csv and /excel — both end up with the same shape (a header
// row plus data rows of plain strings), so the "which column is the name/
// grade/gender" guessing only needs to live in one place.
function detectStudentsFromRows(rows: string[][]) {
  if (rows.length === 0) return { detected: [], warnings: ["File appears to be empty"] };

  const headers = rows[0].map((h) => (h || "").toLowerCase().trim());
  const nameIdx   = headers.findIndex((h) => h.includes("name"));
  const gradeIdx  = headers.findIndex((h) => h.includes("grade") || h.includes("class"));
  const genderIdx = headers.findIndex((h) => h.includes("gender") || h.includes("sex"));

  const detected = rows.slice(1).map((cols) => ({
    name:      (nameIdx   >= 0 ? cols[nameIdx]   : cols[0])?.trim() || "",
    grade:     (gradeIdx  >= 0 ? cols[gradeIdx]  : null)?.trim() || null,
    gender:    (genderIdx >= 0 ? cols[genderIdx] : null)?.trim() || null,
    confirmed: false,
  })).filter((s) => s.name);

  return {
    detected,
    warnings: detected.length === 0 ? ["No students found — check the file has a header row with a Name column"] : [],
  };
}

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
    const rows = lines.map((line) =>
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim())
    );
    const { detected, warnings } = detectStudentsFromRows(rows);

    res.json({ success: true, detected, confidence: 0.95, rawText: csv, warnings });
  } catch (err) {
    res.status(500).json({ error: "CSV processing failed" });
  }
});

// POST /api/upload/excel
// Parse an Excel workbook (.xlsx/.xls), first worksheet, and return student
// list for review — same shape/flow as /csv, just a different source format.
uploadRouter.post("/excel", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const workbook = new ExcelJS.Workbook();
    // exceljs's .load() types want a Buffer<ArrayBuffer> specifically, but
    // @types/node's own Buffer type (what multer's req.file.buffer actually
    // is) resolves to the broader Buffer<ArrayBufferLike> — a real Buffer
    // at runtime either way, just a generic-instantiation mismatch that no
    // cast through Buffer itself can satisfy.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(req.file.buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: "The workbook has no worksheets" });
    }

    const rows: string[][] = [];
    worksheet.eachRow((row) => {
      const cells: string[] = [];
      // ExcelJS rows are 1-indexed and can have gaps — iterate up to the
      // sheet's own column count so a value in, say, column D isn't lost
      // because columns A-C were skipped.
      for (let i = 1; i <= worksheet.columnCount; i++) {
        const cell = row.getCell(i);
        cells.push(cell.text?.trim() || "");
      }
      rows.push(cells);
    });

    const { detected, warnings } = detectStudentsFromRows(rows);
    res.json({ success: true, detected, confidence: 0.95, warnings });
  } catch (err) {
    console.error("Excel processing error:", err);
    res.status(500).json({ error: "Failed to read the Excel file — make sure it's a valid .xlsx or .xls workbook" });
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
