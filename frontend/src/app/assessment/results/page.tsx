"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useReadProfile } from "@/hooks/useReadProfile";
import { apiFetch } from "@/lib/api";
import { AssessmentResultCard } from "@/components/assessment/AssessmentResultCard";
import { PENDING_KEY, PendingAssessment } from "@/components/assessment/AssessmentFlow";
import { Loader2 } from "lucide-react";

type Stage = "loading" | "submitting" | "results" | "error" | "no-data";

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const { profile, loading: profileLoading, refetch } = useReadProfile();

  const [stage, setStage] = useState<Stage>("loading");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?next=/assessment/results");
      return;
    }
    if (profileLoading) return;

    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) {
      if (profile) {
        setResult(profile);
        setStage("results");
      } else {
        setStage("no-data");
      }
      return;
    }

    const pending: PendingAssessment = JSON.parse(raw);
    setStage("submitting");
    apiFetch("/api/read/analyse", {
      method: "POST",
      body: JSON.stringify({ ...pending, language: pending.language || lang }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Assessment analysis failed");
        const data = await res.json();
        sessionStorage.removeItem(PENDING_KEY);
        await refetch();
        setResult(data.profile);
        setStage("results");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStage("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, profileLoading]);

  if (stage === "loading" || stage === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <img src="/mascot/mascot-reading.png" alt="" className="w-20 h-auto" />
        <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
        <p className="text-stone-500 text-sm">
          {stage === "submitting" ? "Building your learning profile..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (stage === "no-data") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <img src="/mascot/mascot-waving.png" alt="" className="w-20 h-auto" />
        <p className="text-stone-600 font-medium">We couldn't find a completed assessment for you yet.</p>
        <a href="/assessment" className="btn-coral">Take the Assessment</a>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="card p-6 text-red-600 max-w-md">{error}</div>
      </div>
    );
  }

  const homeHref = user?.role === "teacher" ? "/teacher" : user?.role === "admin" ? "/admin" : "/student";

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <AssessmentResultCard result={result} homeHref={homeHref} />
    </div>
  );
}
