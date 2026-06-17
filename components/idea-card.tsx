import Link from "next/link";
import { ArrowUpRight, Tag, BarChart3, Calendar } from "lucide-react";
import type { ProductIdea } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function IdeaCard({ idea }: { idea: ProductIdea }) {
  const competitorCount = idea.research?.benchmark.competitors.length ?? 0;
  const date = new Date(idea.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={idea.status} />
        <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-brand-600" />
      </div>

      <h3 className="mt-4 line-clamp-2 text-lg font-bold tracking-tight text-slate-950">
        {idea.title}
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
        {idea.description || "No description provided."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        {idea.category && (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {idea.category}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
          {competitorCount} benchmarked
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {date}
        </span>
      </div>
    </Link>
  );
}
