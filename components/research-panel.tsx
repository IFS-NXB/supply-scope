"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  BarChart3,
  Lightbulb,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Tag,
  Users,
  TriangleAlert,
  Compass,
  Zap,
  DollarSign,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import type { ProductIdea, ResearchResult } from "@/lib/types";
import { BenchmarkTable } from "@/components/benchmark-table";

const PIPELINE = [
  { id: "search", name: "Market Discovery Agent", description: "Searching the web for similar products…", icon: Search },
  { id: "benchmark", name: "Benchmarking Agent", description: "Extracting competitor pricing & features…", icon: BarChart3 },
  { id: "insights", name: "Insights Agent", description: "Synthesising positioning & insights…", icon: Lightbulb },
];

export function ResearchPanel({ idea, autoRun }: { idea: ProductIdea; autoRun: boolean }) {
  const router = useRouter();
  const [result, setResult] = useState<ResearchResult | null>(idea.research ?? null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    idea.research ? "done" : "idle"
  );
  const [activeStep, setActiveStep] = useState(0);
  const started = useRef(false);

  async function run() {
    setStatus("running");
    setActiveStep(0);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/research`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data?.idea) throw new Error(data?.error || "Research failed");
      const research: ResearchResult | undefined = data?.idea?.research;
      setResult(research ?? null);
      setStatus(research?.error ? "error" : "done");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  // Auto-run on first mount when requested (e.g. straight after submission).
  useEffect(() => {
    if (autoRun && !started.current && status !== "done") {
      started.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate the pipeline steps while running.
  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, PIPELINE.length - 1));
    }, 3500);
    return () => clearInterval(t);
  }, [status]);

  return (
    <div className="space-y-8">
      {/* Control bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">AI Research Agents</p>
            <p className="text-xs text-slate-500">
              {result
                ? `Last run ${new Date(result.ranAt).toLocaleString()} · ${(result.durationMs / 1000).toFixed(1)}s`
                : "Agents seek market info and benchmark similar products."}
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={status === "running"}
          className="btn-primary disabled:opacity-60"
        >
          {status === "running" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> {result ? "Re-run research" : "Run research"}
            </>
          )}
        </button>
      </div>

      {/* Running state */}
      {status === "running" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {PIPELINE.map((step, i) => {
            const state = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-5 transition ${
                  state === "active"
                    ? "border-brand-300 bg-brand-50/60 shadow-soft"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${state === "pending" ? "bg-slate-100 text-slate-400" : "bg-ink-950 text-white"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {state === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-600" />
                  ) : state === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">{step.name}</p>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {status === "error" && !result && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <XCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Research failed to complete. Please try again.</p>
        </div>
      )}

      {/* Results */}
      {result && status !== "running" && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: ResearchResult }) {
  const pr = result.benchmark.priceRange;
  const fmt = (n: number) => `${pr?.currency === "USD" ? "$" : (pr?.currency || "$") + " "}${Math.round(n)}`;

  return (
    <div className="space-y-8">
      {result.mode === "demo" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            <strong>Demo data.</strong> Set a <code className="rounded bg-amber-100 px-1">FIRECRAWL_API_KEY</code> to let agents
            research live products on the web.
          </p>
        </div>
      )}

      {/* AI strategy analysis (Claude-powered) */}
      {result.analysis && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-ink-950 px-6 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">AI strategy analysis</p>
              <p className="text-xs text-slate-400">Generated by the Strategy Analyst agent</p>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <p className="text-base leading-relaxed text-slate-700">{result.analysis.summary}</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <AnalysisBlock icon={Compass} title="Positioning">
                <p className="text-sm leading-relaxed text-slate-600">{result.analysis.positioning}</p>
              </AnalysisBlock>
              <AnalysisBlock icon={DollarSign} title="Suggested price">
                <p className="text-lg font-bold text-slate-900">{result.analysis.suggestedPrice}</p>
              </AnalysisBlock>
              <AnalysisBlock icon={Zap} title="Differentiation">
                <AnalysisList items={result.analysis.differentiation} dot="bg-brand-500" />
              </AnalysisBlock>
              <AnalysisBlock icon={ShieldAlert} title="Risks to watch">
                <AnalysisList items={result.analysis.risks} dot="bg-amber-500" />
              </AnalysisBlock>
            </div>

            {result.analysis.nextSteps.length > 0 && (
              <AnalysisBlock icon={ListChecks} title="Recommended next steps">
                <ol className="space-y-2">
                  {result.analysis.nextSteps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </AnalysisBlock>
            )}
          </div>
        </div>
      )}

      {/* Agent run summary */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Agent activity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {result.agents.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">{a.name}</p>
                {a.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-600" />
                ) : a.status === "skipped" ? (
                  <span className="text-xs font-semibold text-slate-400">Skipped</span>
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{a.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enrichment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900">Enriched understanding</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.enrichment.summary}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow icon={Tag} label="Suggested category" value={result.enrichment.suggestedCategory} />
          <InfoRow icon={Users} label="Target audience" value={result.enrichment.targetAudience} />
        </div>
        {result.enrichment.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.enrichment.tags.map((t) => (
              <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Benchmark */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Market benchmark</h2>
          {pr && (
            <div className="flex gap-4 text-sm">
              <Stat label="Low" value={fmt(pr.min)} />
              <Stat label="Average" value={fmt(pr.avg)} accent />
              <Stat label="High" value={fmt(pr.max)} />
            </div>
          )}
        </div>
        <div className="mt-4">
          <BenchmarkTable benchmark={result.benchmark} />
        </div>
      </div>

      {/* Insights */}
      {result.benchmark.insights.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50/70 to-white p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Lightbulb className="h-5 w-5 text-brand-600" /> Insights
          </h2>
          <ul className="mt-4 space-y-3">
            {result.benchmark.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {ins}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {result.sources.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sources</h2>
          <ul className="mt-3 space-y-2">
            {result.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-700"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-base font-bold ${accent ? "text-brand-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function AnalysisBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      {children}
    </div>
  );
}

function AnalysisList({ items, dot }: { items: string[]; dot: string }) {
  if (!items.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}
