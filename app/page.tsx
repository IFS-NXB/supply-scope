import Link from "next/link";
import { Plus, Search, BarChart3, Lightbulb, Lightbulb as Bulb, Layers, CheckCircle2 } from "lucide-react";
import { listIdeas } from "@/lib/store";
import { IdeaCard } from "@/components/idea-card";

export const dynamic = "force-dynamic";

const steps = [
  {
    icon: Plus,
    title: "Submit a product idea",
    desc: "Upload a sketch or photo and describe the product, target market and price.",
  },
  {
    icon: Search,
    title: "Agents seek information",
    desc: "Discovery agents search the live web for similar products in the market.",
  },
  {
    icon: BarChart3,
    title: "Benchmark & insights",
    desc: "Get a competitor benchmark with pricing, features and positioning insights.",
  },
];

export default async function DashboardPage() {
  const ideas = await listIdeas();
  const researched = ideas.filter((i) => i.status === "complete").length;
  const benchmarked = ideas.reduce((n, i) => n + (i.research?.benchmark.competitors.length ?? 0), 0);

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,197,94,0.10),transparent_70%)]" />
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Product Idea Intelligence
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              Submit a product idea. <br />
              <span className="text-gradient">Let AI agents research it.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
              Capture product ideas from anyone on your team. SupplyScope&apos;s agents go and
              seek information — including benchmarking similar products in the market — so you
              can validate and position faster.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/submit" className="btn-primary">
                <Plus className="h-4 w-4" /> Submit a product idea
              </Link>
              <Link href="#how-it-works" className="btn-secondary">
                How it works
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid max-w-3xl grid-cols-3 gap-4">
            <StatCard icon={Layers} value={ideas.length} label="Ideas submitted" />
            <StatCard icon={CheckCircle2} value={researched} label="Researched" />
            <StatCard icon={BarChart3} value={benchmarked} label="Products benchmarked" />
          </div>
        </div>
      </section>

      {/* Ideas */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Product ideas</h2>
            <Link href="/submit" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline">
              + New idea
            </Link>
          </div>

          {ideas.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section scroll-mt-20 border-t border-slate-100 bg-slate-50/70">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              From idea to market benchmark in minutes
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                <span className="absolute right-5 top-5 text-5xl font-black text-slate-100">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-950 text-white">
        <Bulb className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-xl font-bold text-slate-950">No product ideas yet</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Submit your first idea and watch the AI agents research the market and benchmark
        similar products for you.
      </p>
      <Link href="/submit" className="btn-primary mt-6">
        <Plus className="h-4 w-4" /> Submit a product idea
      </Link>
    </div>
  );
}
