import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, BarChart3, Lightbulb } from "lucide-react";
import { SubmitForm } from "@/components/submit-form";

export const metadata: Metadata = {
  title: "Submit a product idea",
};

const agents = [
  { icon: Search, name: "Market Discovery", desc: "Finds similar products on the live web." },
  { icon: BarChart3, name: "Benchmarking", desc: "Extracts competitor pricing & features." },
  { icon: Lightbulb, name: "Insights", desc: "Suggests positioning & pricing." },
];

export default function SubmitPage() {
  return (
    <section className="section">
      <div className="container-page">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Submit a product idea
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-500">
              Tell us about the product. The more detail you provide, the better the agents can
              benchmark it against the market.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <SubmitForm />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:pt-20">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
              <p className="text-sm font-bold text-slate-900">What happens next</p>
              <p className="mt-1 text-sm text-slate-500">
                As soon as you submit, three agents start working:
              </p>
              <ul className="mt-5 space-y-4">
                {agents.map((a) => (
                  <li key={a.name} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-white">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.name} Agent</p>
                      <p className="text-xs text-slate-500">{a.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
