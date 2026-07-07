"use client";

import { useLang } from "@/hooks/useLang";
import { FadeIn } from "@/components/ui/FadeIn";
import UploadStudents from "@/components/UploadStudents";

export default function AdminUploadPage() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-900">
          {t.upload.title}
        </h1>
        <p className="text-stone-500 mt-1">{t.upload.subtitle}</p>
      </FadeIn>
      <UploadStudents />
    </div>
  );
}
