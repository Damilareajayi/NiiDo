"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { GRADES } from "@/lib/constants";
import { Grade } from "@/types";
import { FadeIn } from "@/components/ui/FadeIn";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Loader2, Plus, X, Copy, Check } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  grade: string;
  gender?: string;
  age?: number;
  teacherId?: string;
  readProfile?: { primaryTrack: string };
}

interface TeacherOption {
  uid: string;
  name: string;
}

const TRACK_LABELS: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Hands-On",
  readwrite: "Reader & Writer",
  multimodal: "Flexible",
};

export default function AdminStudentsPage() {
  const { t } = useLang();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade | "">("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [age, setAge] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/students");
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    apiFetch("/api/admin/teachers").then((res) => res.json()).then((data) => setTeachers(data.teachers || []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/students", {
        method: "POST",
        body: JSON.stringify({
          name,
          grade,
          gender: gender || undefined,
          age: age ? Number(age) : undefined,
          teacherId: teacherId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");
      setCreated({ email: data.email, temporaryPassword: data.temporaryPassword });
      setName("");
      setGrade("");
      setGender("");
      setAge("");
      setTeacherId("");
      setShowForm(false);
      await loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (!created) return;
    navigator.clipboard.writeText(`${created.email} / ${created.temporaryPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
            {t.nav.students}
          </h1>
          <p className="text-stone-500 mt-1">Manage student accounts and view learning profiles</p>
        </div>
        <button className="btn-brand flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </FadeIn>

      <AnimatePresence>
        {created && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5 mb-6 bg-teal-50 border-teal-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-stone-900 mb-1">Student account created</p>
                  <p className="text-sm text-stone-600">
                    Share these credentials — this password is shown only once:
                  </p>
                  <p className="text-sm font-mono bg-white rounded-lg px-3 py-2 mt-2 border border-teal-200">
                    {created.email} / {created.temporaryPassword}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={copyPassword} className="btn-ghost p-2" title="Copy">
                    {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setCreated(null)} className="btn-ghost p-2" title="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-stone-900">New Student</h2>
                <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Grade</label>
                    <select className="input" required value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                      <option value="" disabled>—</option>
                      {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Age</label>
                    <input type="number" className="input" min={4} max={20} value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}>
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="label">Assign to Teacher</label>
                  <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.uid} value={teacher.uid}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={submitting} className="btn-brand w-full flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Account
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="card divide-y divide-stone-100">
          {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add your first student above, or import a whole class register at once."
            actionLabel="Import Students"
            actionHref="/admin/upload"
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
