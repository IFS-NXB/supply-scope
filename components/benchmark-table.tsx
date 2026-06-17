import { ExternalLink } from "lucide-react";
import type { ResearchResult } from "@/lib/types";

export function BenchmarkTable({ benchmark }: { benchmark: ResearchResult["benchmark"] }) {
  const { competitors } = benchmark;
  if (!competitors.length) {
    return <p className="text-sm text-slate-500">No comparable products were found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Brand / Source</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Key features</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {competitors.map((c, i) => (
              <tr key={c.url + i} className="align-top hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{c.brand}</div>
                  <div className="text-xs text-slate-400">{c.source}</div>
                </td>
                <td className="px-4 py-3">
                  {c.price ? (
                    <span className="font-semibold text-slate-900">{c.price}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.features.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.features.map((f, j) => (
                        <span key={j} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
