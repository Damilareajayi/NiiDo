"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow";
import { Loader2 } from "lucide-react";

export default function PublicAssessmentPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="flex items-center px-4 py-4 max-w-2xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/niido-icon-mark.svg" alt="" className="w-6 h-6" />
          <span className="font-display font-bold text-stone-900">NiiDo</span>
        </Link>
      </div>

      <div className="flex-1 px-4 pb-16 pt-4">
        {loading ? (
          <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
          </div>
        ) : (
          <AssessmentFlow mode={user ? "authenticated" : "public"} />
        )}
      </div>
    </div>
  );
}
