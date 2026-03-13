"use client";

import Sidebar from "@/components/layout/Sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      <main className="md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
