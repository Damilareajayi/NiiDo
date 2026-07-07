import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  colorClass?: string; // e.g. "bg-teal-100 text-teal-600"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  colorClass = "bg-stone-100 text-stone-500",
}: EmptyStateProps) {
  return (
    <div className="card p-10 flex flex-col items-center text-center">
      <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
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
