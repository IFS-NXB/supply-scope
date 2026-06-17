import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Tag, Globe, Users, DollarSign } from "lucide-react";
import { getIdea } from "@/lib/store";
import { StatusBadge } from "@/components/status-badge";
import { ResearchPanel } from "@/components/research-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idea = await getIdea(params.id);
  return { title: idea ? idea.title : "Idea not found" };
}

function splitFeatures(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function IdeaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { run?: string };
}) {
  const idea = await getIdea(params.id);
  if (!idea) notFound();

  const features = splitFeatures(idea.features);
  const autoRun =
    searchParams?.run === "1" ||
    ((idea.status === "queued" || idea.status === "researching") && !idea.research);

  const meta = [
    idea.category && { icon: Tag, label: idea.category },
    idea.targetMarket && { icon: Globe, label: idea.targetMarket },
    idea.audience && { icon: Users, label: idea.audience },
    idea.priceTarget && { icon: DollarSign, label: `Target ${idea.priceTarget}` },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <section className="section">
      <div className="container-page max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          {idea.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idea.imageUrl}
              alt={idea.title}
              className="h-28 w-28 rounded-2xl border border-slate-200 object-cover"
            />
          ) : null}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={idea.status} />
              <span className="text-xs text-slate-400">
                Submitted {new Date(idea.createdAt).toLocaleDateString()}
                {idea.submittedBy ? ` · ${idea.submittedBy}` : ""}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {idea.title}
            </h1>
            {idea.description && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{idea.description}</p>
            )}

            {meta.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <m.icon className="h-4 w-4 text-slate-400" />
                    {m.label}
                  </span>
                ))}
              </div>
            )}

            {features.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {features.map((f, i) => (
                  <span key={i} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <hr className="my-10 border-slate-100" />

        {/* Agents + results */}
        <ResearchPanel idea={idea} autoRun={autoRun} />
      </div>
    </section>
  );
}
