import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  colorClass?: string; // e.g. "bg-teal-100 text-teal-600"
  mascotSrc?: string; // when set, replaces the icon badge with the NiiDo mascot — use for friendly/neutral empty states, not errors
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  colorClass = "bg-stone-100 text-stone-500",
  mascotSrc,
}: EmptyStateProps) {
  return (
    <div className="card p-10 flex flex-col items-center text-center">
      {mascotSrc ? (
        <img src={mascotSrc} alt="" className="w-24 h-auto mb-4" />
      ) : (
        <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <p className="font-semibold text-stone-900 mb-1">{title}</p>
      <p className="text-stone-500 text-sm max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-brand mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
