import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

import { readRouter }   from "./routes/read";
import { teachRouter }  from "./routes/teach";
import { pulseRouter }  from "./routes/pulse";
import { uploadRouter } from "./routes/upload";
import { whatsappRouter } from "./routes/whatsapp";

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security middleware ──────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://niido.learnscape.africa",
  ],
  credentials: true,
}));

// ── Rate limiting ────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Stricter limit for AI endpoints (cost protection)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "AI request limit reached. Please wait a moment.",
});

// ── Body parsing ─────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Health check ─────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "NiiDo API",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────
app.use("/api/read",     aiLimiter, readRouter);
app.use("/api/teach",    aiLimiter, teachRouter);
app.use("/api/pulse",    pulseRouter);
app.use("/api/upload",   uploadRouter);
app.use("/api/whatsapp", whatsappRouter);

// ── 404 handler ──────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════╗
  ║   NiiDo API  — Port ${PORT}     ║
  ║   NiiDo Read  · /api/read     ║
  ║   NiiDo Teach · /api/teach    ║
  ║   NiiDo Pulse · /api/pulse    ║
  ╚═══════════════════════════════╝
  `);
});

export default app;
