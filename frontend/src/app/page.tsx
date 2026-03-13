"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else {
      // Role-based redirect
      switch (user.role) {
        case "student": router.replace("/student"); break;
        case "teacher": router.replace("/teacher"); break;
        case "admin":   router.replace("/admin");   break;
        default:        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center">
          <span className="text-white font-display font-bold text-xl">N</span>
        </div>
        <p className="text-stone-400 text-sm animate-pulse">Loading NiiDo...</p>
      </div>
    </div>
  );
}
