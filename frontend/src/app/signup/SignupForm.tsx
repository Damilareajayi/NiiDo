"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { Grade, Subject } from "@/types";
import { hasCompleteProfile, identityLabel } from "@/lib/authRouting";
import { User, GraduationCap, School, Eye, EyeOff, Loader2 } from "lucide-react";

type Role = "student" | "teacher" | "admin";

const ROLES: { value: Role; label: string; icon: typeof User; badgeClass: string; activeClass: string }[] = [
  { value: "student", label: "Student", icon: User,          badgeClass: "bg-coral-100 text-coral-600", activeClass: "border-coral-400 bg-coral-50" },
  { value: "teacher", label: "Teacher", icon: GraduationCap, badgeClass: "bg-teal-100 text-teal-600",   activeClass: "border-teal-400 bg-teal-50" },
  { value: "admin",   label: "School",  icon: School,        badgeClass: "bg-sky-100 text-sky-600",     activeClass: "border-sky-400 bg-sky-50" },
];

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, loading, user, firebaseUser, logout } = useAuth();
  const { lang } = useLang();

  const next = searchParams.get("next") || "/";
  // See login/page.tsx for why this exists: distinguishes "just signed up
  // right here" (continue straight in) from "already had a session when
  // this page loaded" (ask first, so switching accounts is always possible).
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!hasCompleteProfile(user)) {
      router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
    } else if (justSignedIn) {
      router.replace(next);
    }
  }, [firebaseUser, user, loading, justSignedIn, router, next]);

  const showContinueAs = !loading && firebaseUser && hasCompleteProfile(user) && !justSignedIn;

  const initialRole = (searchParams.get("role") as Role) || "student";
  const [role, setRole] = useState<Role>(
    ["student", "teacher", "admin"].includes(initialRole) ? initialRole : "student"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [grade, setGrade] = useState<Grade | "">("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [schoolName, setSchoolName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const isPreview = typeof window !== "undefined" && window.location.hostname.includes("preview.cloudshell.dev");
      const apiUrl = isPreview ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role, name, email, password, language: lang,
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
      if (!res.ok) throw new Error(data.error || "Signup failed");
      await login(email, password);
      setJustSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
      setJustSignedIn(true);
    } catch (err) {
      // This email already has a password account — hand off to /login,
      // where useAuth's googleLinkEmail state (already set by loginWithGoogle)
      // drives the password-to-link form. AuthProvider lives above this page
      // in the layout, so that state survives the client-side navigation.
      if (err instanceof Error && err.message === "account-link-required") {
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const activeRole = ROLES.find((r) => r.value === role)!;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="flex items-center px-4 py-4 max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/niido-icon-mark.svg" alt="" className="w-6 h-6" />
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-center mb-6">
            <img src="/mascot/mascot-waving.png" alt="" className="w-20 h-auto mx-auto mb-3" />
            <h1 className="text-2xl font-display font-bold text-stone-900">Create your account</h1>
            <p className="text-stone-500 mt-1 text-sm">Free to join — pick who you are to get started</p>
          </div>

          {showContinueAs ? (
            <div className="card p-8">
              <h2 className="text-xl font-display font-semibold text-stone-900 mb-1">
                Welcome back
              </h2>
              <p className="text-stone-500 text-sm mb-6">
                You&apos;re already signed in as <strong>{identityLabel(firebaseUser)}</strong>.
              </p>
              <button
                type="button"
                onClick={() => router.replace(next)}
                className="btn-brand w-full flex items-center justify-center gap-2 py-3 mb-3"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-center text-stone-400 text-xs hover:text-stone-600"
              >
                Not you? Sign out and create a new account
              </button>
            </div>
          ) : (
          <>
          {/* Role selector */}
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
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-stone-300
                         font-semibold text-sm text-stone-700 hover:bg-stone-50 transition-all mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google — pick your role after
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-stone-200 flex-1" />
              <span className="text-xs text-stone-400">or sign up with email</span>
              <div className="h-px bg-stone-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@gmail.com or your school email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input pr-11"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                      <input className="input" placeholder="e.g. Bright Future Primary" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {role === "teacher" && (
                <>
                  <div>
                    <label className="label">What school do you teach at? (optional)</label>
                    <input className="input" placeholder="e.g. Bright Future Secondary School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
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
                      <input className="input" placeholder="e.g. Lagos" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">LGA (optional)</label>
                      <input className="input" placeholder="e.g. Ikeja" value={lga} onChange={(e) => setLga(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error.includes("unauthorized-domain")
                    ? "Authentication is temporarily unavailable on this domain. Please contact support or try signing up with your email and password."
                    : error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all
                  active:scale-[0.98] shadow-sm hover:shadow-md
                  ${role === "student" ? "bg-coral-500 hover:bg-coral-600" :
                    role === "teacher" ? "bg-teal-500 hover:bg-teal-600" :
                    "bg-sky-500 hover:bg-sky-600"}`}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  : `Create ${activeRole.label} Account`}
              </button>
            </form>

            <p className="text-center text-stone-400 text-xs mt-6">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand-600 font-medium">Sign in</Link>
            </p>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
