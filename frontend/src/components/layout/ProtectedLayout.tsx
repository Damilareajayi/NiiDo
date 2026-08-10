"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <img src="/niido-icon-mark.svg" alt="" className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      <main className="md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 page-enter">
          <NotificationPrompt />
          {children}
        </div>
      </main>
    </div>
  );
}
