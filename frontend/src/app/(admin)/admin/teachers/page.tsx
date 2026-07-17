"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { FadeIn } from "@/components/ui/FadeIn";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { GraduationCap, Loader2, Plus, X, Copy, Check } from "lucide-react";

interface TeacherRow {
  uid: string;
  name: string;
  email: string;
  language: string;
  subjects?: string[];
}

export default function AdminTeachersPage() {
  const { t } = useLang();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/teachers", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create teacher");
      setCreated({ email: data.email, temporaryPassword: data.temporaryPassword });
      setName("");
      setEmail("");
      setShowForm(false);
      await loadTeachers();
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
            {t.nav.teachers}
          </h1>
          <p className="text-stone-500 mt-1">Manage teacher accounts for your school</p>
        </div>
        <button className="btn-brand flex items-center gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Teacher
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
                  <p className="font-semibold text-stone-900 mb-1">Teacher account created</p>
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
                <h2 className="font-semibold text-stone-900">New Teacher</h2>
                <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
      ) : teachers.length === 0 ? (
        <FadeIn delay={0.08}>
          <EmptyState
            icon={GraduationCap}
            mascotSrc="/mascot/mascot-waving.png"
            title="No teachers yet"
            description="Add your first teacher above to start assigning classes and generating lesson plans."
            colorClass="bg-brand-100 text-brand-600"
          />
        </FadeIn>
      ) : (
        <div className="card divide-y divide-stone-100">
          {teachers.map((teacher, i) => (
            <motion.div
              key={teacher.uid}
              className="flex items-center gap-4 p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-brand-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-stone-900 truncate">{teacher.name}</p>
                <p className="text-sm text-stone-400 truncate">{teacher.email}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
