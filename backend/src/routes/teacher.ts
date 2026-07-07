// ── NiiDo Teacher Route — own roster & class stats ─────────────
import { Router, Request, Response } from "express";
import { db, Timestamp } from "../firebase";
import { requireAuth, requireRole } from "../middleware/auth";

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole("teacher"));

const TRACKS = ["visual", "auditory", "kinesthetic", "readwrite", "multimodal"] as const;

// GET /api/teacher/students
teacherRouter.get("/students", async (req: Request, res: Response) => {
  try {
    const snap = await db.collection("students")
      .where("schoolId", "==", req.authUser!.schoolId)
      .where("teacherId", "==", req.authUser!.uid)
      .get();
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET /api/teacher/class-stats
teacherRouter.get("/class-stats", async (req: Request, res: Response) => {
  try {
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const [snap, lessonsSnap] = await Promise.all([
      db.collection("students")
        .where("schoolId", "==", req.authUser!.schoolId)
        .where("teacherId", "==", req.authUser!.uid)
        .get(),
      db.collection("lessons")
        .where("teacherId", "==", req.authUser!.uid)
        .where("createdAt", ">=", Timestamp.fromDate(startOfWeek))
        .get(),
    ]);

    const totalStudents = snap.size;
    let assessedCount = 0;
    const trackCounts: Record<string, number> = {
      visual: 0, auditory: 0, kinesthetic: 0, readwrite: 0, multimodal: 0,
    };

    snap.forEach((doc) => {
      const profile = doc.data().readProfile;
      if (profile?.primaryTrack) {
        assessedCount += 1;
        if (TRACKS.includes(profile.primaryTrack)) trackCounts[profile.primaryTrack] += 1;
      }
    });

    const trackDistribution = TRACKS.reduce((acc, track) => {
      acc[track] = assessedCount > 0 ? Math.round((trackCounts[track] / assessedCount) * 100) : 0;
      return acc;
    }, {} as Record<typeof TRACKS[number], number>);

    res.json({
      totalStudents,
      assessedCount,
      readCompletionRate: totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0,
      trackDistribution,
      lessonsGeneratedThisWeek: lessonsSnap.size,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch class stats" });
  }
});
