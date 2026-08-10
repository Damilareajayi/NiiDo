"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useReadProfile } from "@/hooks/useReadProfile";
import { apiFetch } from "@/lib/api";
import { GRADES, SUBJECTS } from "@/lib/constants";
import { FadeIn } from "@/components/ui/FadeIn";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { School as SchoolType } from "@/types";
import {
  Mail, GraduationCap, Users, Brain, MapPin, BookOpenCheck,
  FileText, AlertCircle, Crown,
} from "lucide-react";

function PlanCard({ tier }: { tier?: "free" | "premium" }) {
  const isPremium = tier === "premium";
  return (
    <FadeIn delay={0.2}>
      <div className={`card p-6 flex items-center gap-4 ${isPremium ? "border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white" : ""}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isPremium ? "bg-brand-500 text-white" : "bg-stone-100 text-stone-500"}`}>
          <Crown className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Your Plan</p>
          <p className="font-display font-semibold text-stone-900">
            {isPremium ? "NiiDo Premium" : "NiiDo Free"}
          </p>
        </div>
        {!isPremium && (
          <a href="/#pricing" className="btn-brand text-sm shrink-0">Upgrade</a>
        )}
      </div>
    </FadeIn>
  );
}

const TRACK_LABELS: Record<string, string> = {
  visual: "Visual", auditory: "Auditory", kinesthetic: "Hands-On",
  readwrite: "Reader & Writer", multimodal: "Flexible",
};

function ProfileHeader({ badgeClass, badgeLabel }: { badgeClass: string; badgeLabel: string }) {
  const { user } = useAuth();
  return (
    <FadeIn className="flex items-center gap-4 mb-8">
      <div className={`w-16 h-16 rounded-2xl ${badgeClass} flex items-center justify-center text-2xl font-display font-bold shrink-0`}>
        {user?.name?.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-display font-bold text-stone-900 truncate">{user?.name}</h1>
        <div className="flex items-center gap-1.5 text-stone-400 text-sm mt-0.5">
          <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{user?.email}</span>
        </div>
        <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
    </FadeIn>
  );
}

function StudentProfile() {
  const { user } = useAuth();
  const { profile, loading } = useReadProfile();
  const track = profile?.primaryTrack;

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileHeader badgeClass="bg-coral-100 text-coral-700" badgeLabel="Student" />

      <FadeIn delay={0.08}>
        <div className="card p-6 mb-4">
          <h2 className="font-semibold text-stone-900 mb-4">About You</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-400 text-xs">Grade</p>
              <p className="font-medium text-stone-900">{GRADES.find((g) => g.value === user?.grade)?.label || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs">Age</p>
              <p className="font-medium text-stone-900">{user?.age || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs">Gender</p>
              <p className="font-medium text-stone-900 capitalize">{user?.gender || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs">School</p>
              <p className="font-medium text-stone-900">{user?.schoolName || "—"}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.14}>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-coral-600" />
            <h2 className="font-semibold text-stone-900">LearnerDNA Profile</h2>
          </div>
          {loading ? (
            <p className="text-stone-400 text-sm">Loading...</p>
          ) : !profile ? (
            <p className="text-stone-500 text-sm">
              You haven&apos;t completed NiiDo Read yet.{" "}
              <a href="/student/read" className="text-coral-600 font-medium">Start your assessment</a>
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><span className="text-stone-400">Learning style:</span>{" "}
                <span className="font-medium text-stone-900">{TRACK_LABELS[track || ""] || track}</span></p>
              {profile.supportLevel && (
                <p><span className="text-stone-400">Support level:</span>{" "}
                  <span className="font-medium text-stone-900 capitalize">{profile.supportLevel}</span></p>
              )}
            </div>
          )}
        </div>
      </FadeIn>

      <div className="mt-4">
        <PlanCard tier={user?.subscriptionTier} />
      </div>
    </div>
  );
}

function TeacherProfile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalStudents: number; lessonsGeneratedThisWeek: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/teacher/class-stats").then((res) => res.json()).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileHeader badgeClass="bg-teal-100 text-teal-700" badgeLabel="Teacher" />

      <FadeIn delay={0.08}>
        <div className="card p-6 mb-4">
          <h2 className="font-semibold text-stone-900 mb-4">About You</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-stone-400 shrink-0" />
              <span className="text-stone-400">School:</span>
              <span className="font-medium text-stone-900">{user?.schoolName || "—"}</span>
            </div>
            <div className="flex items-start gap-2">
              <BookOpenCheck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span className="text-stone-400">Subjects:</span>
              <span className="font-medium text-stone-900">
                {user?.subjects?.length
                  ? user.subjects.map((s) => SUBJECTS.find((x) => x.value === s)?.label || s).join(", ")
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard index={0} label="My Students" value={stats?.totalStudents ?? 0} icon={Users} color="bg-sky-100 text-sky-600" />
            <StatCard index={1} label="Lessons This Week" value={stats?.lessonsGeneratedThisWeek ?? 0} icon={FileText} color="bg-teal-100 text-teal-600" />
          </>
        )}
      </div>

      <div className="mt-4">
        <PlanCard tier={user?.subscriptionTier} />
      </div>
    </div>
  );
}

function SchoolProfile() {
  const { user } = useAuth();
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [stats, setStats] = useState<{ totalStudents: number; totalTeachers: number; supportNeedsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) return;
    Promise.all([
      getDoc(doc(db, "schools", user.schoolId)).then((snap) => (snap.exists() ? (snap.data() as SchoolType) : null)),
      apiFetch(`/api/pulse/school/${user.schoolId}`).then((res) => res.json()).catch(() => null),
    ]).then(([schoolDoc, pulseStats]) => {
      setSchool(schoolDoc);
      setStats(pulseStats);
    }).finally(() => setLoading(false));
  }, [user?.schoolId]);

  return (
    <div className="max-w-2xl mx-auto">
      <ProfileHeader badgeClass="bg-sky-100 text-sky-700" badgeLabel="School Admin" />

      <FadeIn delay={0.08}>
        <div className="card p-6 mb-4">
          <h2 className="font-semibold text-stone-900 mb-4">School Information</h2>
          {loading ? (
            <p className="text-stone-400 text-sm">Loading...</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-medium text-stone-900">{school?.name || "—"}</span>
              </div>
              {(school?.state || school?.lga) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-stone-600">{[school?.lga, school?.state].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </FadeIn>

      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatCard index={0} label="Students" value={stats?.totalStudents ?? 0} icon={Users} color="bg-brand-100 text-brand-600" />
            <StatCard index={1} label="Teachers" value={stats?.totalTeachers ?? 0} icon={GraduationCap} color="bg-sky-100 text-sky-600" />
            <StatCard index={2} label="Need Support" value={stats?.supportNeedsCount ?? 0} icon={AlertCircle} color="bg-coral-100 text-coral-600" />
          </>
        )}
      </div>

      {!loading && (
        <FadeIn delay={0.2} className="mt-4">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">School Plan</p>
              <p className="font-display font-semibold text-stone-900 capitalize">
                {school?.subscriptionTier === "institutional" ? "Institutional" :
                 school?.subscriptionTier === "sponsored" ? "Sponsored" : "Free"}
              </p>
            </div>
            {school?.subscriptionTier !== "institutional" && (
              <a href="mailto:sales@learnscape.africa" className="btn-outline text-sm shrink-0">Contact Sales</a>
            )}
          </div>
        </FadeIn>
      )}
    </div>
  );
}

function RoleSwitcher() {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  // Exclusively restrict this tool to the platform owner/developer account
  if (user?.email !== "ajayidamilarefelix@gmail.com") return null;

  const handleRoleChange = async (newRole: "student" | "teacher" | "admin") => {
    if (!user?.uid || updating) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole });
    } catch (err) {
      console.error("Error updating role:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <FadeIn delay={0.2} className="card p-6 mt-6 max-w-2xl mx-auto">
      <h2 className="font-semibold text-stone-900 mb-2">Switch Portal View</h2>
      <p className="text-stone-400 text-xs mb-4">
        Need to switch between student, teacher, or school administrator dashboards? Change your profile role here to update your dashboard layout.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(["student", "teacher", "admin"] as const).map((r) => (
          <button
            key={r}
            type="button"
            disabled={updating}
            onClick={() => handleRoleChange(r)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all
              ${user?.role === r 
                ? "bg-stone-900 border-stone-900 text-white shadow-sm" 
                : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
          >
            {r === "admin" ? "Admin" : r}
          </button>
        ))}
      </div>
    </FadeIn>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedLayout>
      {user?.role === "student" && <StudentProfile />}
      {user?.role === "teacher" && <TeacherProfile />}
      {user?.role === "admin" && <SchoolProfile />}
      <RoleSwitcher />
    </ProtectedLayout>
  );
}
