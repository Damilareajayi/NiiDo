"use client";

import { FadeIn } from "@/components/ui/FadeIn";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export default function MyLearningPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          My Learning
        </h1>
        <p className="text-stone-500 mt-1">Your personalised content, tailored to how you learn.</p>
      </FadeIn>
      <FadeIn delay={0.08}>
        <EmptyState
          icon={BookOpen}
          title="Coming soon"
          description="Once you've completed NiiDo Read, this space will fill up with content picked for your learning style."
          colorClass="bg-brand-100 text-brand-600"
        />
      </FadeIn>
    </div>
  );
}
