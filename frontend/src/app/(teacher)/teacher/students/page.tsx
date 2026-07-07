"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { GRADES } from "@/lib/constants";
import { FadeIn } from "@/components/ui/FadeIn";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Upload } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  grade: string;
  readProfile?: { primaryTrack: string };
}

const TRACK_LABELS: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Hands-On",
  readwrite: "Reader & Writer",
  multimodal: "Flexible",
};

export default function TeacherStudentsPage() {
  const { t } = useLang();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/teacher/students")
      .then((res) => res.json())
      .then((data) => setStudents(data.students || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
            {t.nav.students}
          </h1>
          <p className="text-stone-500 mt-1">Students assigned to your classes</p>
        </div>
        <Link href="/teacher/upload" className="btn-teal flex items-center gap-2">
          <Upload className="w-4 h-4" /> Import Students
        </Link>
      </FadeIn>

      {loading ? (
        <div className="card divide-y divide-stone-100">
          {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={Users}
            title="No students assigned yet"
            description="Ask your admin to assign students to you, or import your class register."
            actionLabel="Import Students"
            actionHref="/teacher/upload"
            colorClass="bg-teal-100 text-teal-600"
          />
        </FadeIn>
      ) : (
        <div className="card divide-y divide-stone-100">
          {students.map((student, i) => (
            <motion.div
              key={student.id}
              className="flex items-center gap-4 p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 truncate">{student.name}</p>
                <p className="text-sm text-stone-400 truncate">
                  {GRADES.find((g) => g.value === student.grade)?.label || student.grade}
                </p>
              </div>
              {student.readProfile?.primaryTrack && (
                <span className={`track-${student.readProfile.primaryTrack} text-xs font-semibold px-3 py-1 rounded-full border shrink-0`}>
                  {TRACK_LABELS[student.readProfile.primaryTrack]}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
