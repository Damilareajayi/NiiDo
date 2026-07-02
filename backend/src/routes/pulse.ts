// ── NiiDo Pulse Route ────────────────────────────────────────
import { Router, Request, Response } from "express";
import { db, Timestamp } from "../firebase";

const TRACKS = ["visual", "auditory", "kinesthetic", "readwrite", "multimodal"] as const;

export const pulseRouter = Router();

// GET /api/pulse/school/:schoolId
pulseRouter.get("/school/:schoolId", async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  if (!schoolId) {
    return res.status(400).json({ error: "Missing schoolId" });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const [studentsSnap, teachersSnap, lessonsSnap, activeTeachersSnap] = await Promise.all([
      db.collection("students").where("schoolId", "==", schoolId).get(),
      db.collection("users").where("schoolId", "==", schoolId).where("role", "==", "teacher").get(),
      db.collection("lessons").where("schoolId", "==", schoolId).where("createdAt", ">=", Timestamp.fromDate(startOfWeek)).get(),
      db.collection("users").where("schoolId", "==", schoolId).where("role", "==", "teacher").where("lastActive", ">=", Timestamp.fromDate(startOfDay)).get(),
    ]);

    const totalStudents = studentsSnap.size;
    const totalTeachers = teachersSnap.size;
    let assessedCount = 0;
    let supportNeedsCount = 0;
    const trackCounts: Record<string, number> = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      readwrite: 0,
      multimodal: 0,
    };

    studentsSnap.forEach((doc) => {
      const student = doc.data() as any;
      const profile = student.readProfile;
      if (profile && typeof profile === "object") {
        assessedCount += 1;
        const primaryTrack = profile.primaryTrack as string | undefined;
        const secondaryTrack = profile.secondaryTrack as string | undefined;
        const supportLevel = profile.supportLevel as string | undefined;

        if (supportLevel && supportLevel !== "none") {
          supportNeedsCount += 1;
        }

        if (primaryTrack && TRACKS.includes(primaryTrack as any)) {
          trackCounts[primaryTrack] += 1;
        }
        if (secondaryTrack && TRACKS.includes(secondaryTrack as any) && secondaryTrack !== primaryTrack) {
          trackCounts[secondaryTrack] += 1;
        }
      }
    });

    const trackDistribution = TRACKS.reduce((acc, track) => {
      const pct = assessedCount > 0 ? Math.round((trackCounts[track] / assessedCount) * 100) : 0;
      acc[track] = pct;
      return acc;
    }, {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      readwrite: 0,
      multimodal: 0,
    } as Record<typeof TRACKS[number], number>);

    const readCompletionRate = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;

    res.json({
      schoolId,
      totalStudents,
      totalTeachers,
      readCompletionRate,
      trackDistribution,
      lessonsGeneratedThisWeek: lessonsSnap.size,
      activeTeachersToday: activeTeachersSnap.size,
      supportNeedsCount,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Pulse route error:", err);
    res.status(500).json({ error: "Failed to fetch pulse data" });
  }
});
