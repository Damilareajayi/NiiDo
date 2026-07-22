"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { Grade, Subject } from "@/types";
import { User, GraduationCap, School, Loader2 } from "lucide-react";

type Role = "student" | "teacher" | "admin";

const ROLES: { value: Role; label: string; icon: typeof User; badgeClass: string; activeClass: string }[] = [
  { value: "student", label: "Student", icon: User,          badgeClass: "bg-coral-100 text-coral-600", activeClass: "border-coral-400 bg-coral-50" },
  { value: "teacher", label: "Teacher", icon: GraduationCap, badgeClass: "bg-teal-100 text-teal-600",   activeClass: "border-teal-400 bg-teal-50" },
  { value: "admin",   label: "School",  icon: School,        badgeClass: "bg-sky-100 text-sky-600",     activeClass: "border-sky-400 bg-sky-50" },
];

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { firebaseUser } = useAuth();
  const { lang } = useLang();

  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState(firebaseUser?.displayName || "");
  const [grade, setGrade] = useState<Grade | "">("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [schoolName, setSchoolName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = ROLES.find((r) => r.value === role)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/complete-profile", {
        method: "POST",
        body: JSON.stringify({
          role, name, language: lang,
          ...(role === "student" ? {
            grade, age: age ? Number(age) : undefined,
            gender: gender || undefined, schoolName: schoolName || undefined,
          } : {}),
          ...(role === "teacher" ? {
            subjects: subjects.length ? subjects : undefined,
            schoolName: schoolName || undefined,
          } : {}),
          ...(role === "admin" ? { schoolName, state: state || undefined, lga: lga || undefined } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete profile");
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="flex justify-center items-center px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/niido-icon-mark.svg" alt="" className="w-6 h-6" />
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img src="/mascot/mascot-waving.png" alt="" className="w-20 h-auto mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-stone-900">One more step</h1>
            <p className="text-stone-500 mt-1 text-sm">
              You&apos;re signed in as {firebaseUser?.email || firebaseUser?.phoneNumber} — tell us who you are
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                  ${role === r.value ? r.activeClass : "border-stone-200 bg-white hover:border-stone-300"}`}
              >
                <div className={`w-8 h-8 rounded-lg ${r.badgeClass} flex items-center justify-center`}>
                  <r.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700">{r.label}</span>
              </button>
            ))}
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {role === "student" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Grade</label>
                      <select className="input" required value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                        <option value="" disabled>—</option>
                        {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Age (optional)</label>
                      <input type="number" className="input" min={4} max={99} value={age} onChange={(e) => setAge(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Gender (optional)</label>
                      <select className="input" value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}>
                        <option value="">—</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">School (optional)</label>
                      <input className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {role === "teacher" && (
                <>
                  <div>
                    <label className="label">What school do you teach at? (optional)</label>
                    <input className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Subjects you teach (optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          type="button"
                          key={s.value}
                          onClick={() => setSubjects((prev) =>
                            prev.includes(s.value) ? prev.filter((x) => x !== s.value) : [...prev, s.value]
                          )}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border
                            ${subjects.includes(s.value)
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-white text-stone-500 border-stone-200 hover:border-teal-300"}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {role === "admin" && (
                <>
                  <div>
                    <label className="label">School Name</label>
                    <input className="input" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">State (optional)</label>
                      <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">LGA (optional)</label>
                      <input className="input" value={lga} onChange={(e) => setLga(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all
                  active:scale-[0.98] shadow-sm hover:shadow-md
                  ${role === "student" ? "bg-coral-500 hover:bg-coral-600" :
                    role === "teacher" ? "bg-teal-500 hover:bg-teal-600" :
                    "bg-sky-500 hover:bg-sky-600"}`}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : `Continue as ${activeRole.label}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
