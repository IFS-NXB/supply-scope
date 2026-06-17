import { CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import type { IdeaStatus } from "@/lib/types";

const map: Record<
  IdeaStatus,
  { label: string; className: string; icon: any; spin?: boolean }
> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-600", icon: Clock },
  researching: { label: "Researching", className: "bg-amber-100 text-amber-700", icon: Loader2, spin: true },
  complete: { label: "Researched", className: "bg-brand-100 text-brand-700", icon: CheckCircle2 },
  error: { label: "Needs attention", className: "bg-rose-100 text-rose-700", icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      <Icon className={`h-3.5 w-3.5 ${s.spin ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}
