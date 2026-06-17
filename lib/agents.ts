import type { AgentRunInfo, Competitor, ProductIdea, ResearchResult } from "./types";
import { extractProduct, firecrawlEnabled, search, type SearchResult } from "./firecrawl";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "without", "of", "to", "in",
  "on", "by", "your", "our", "that", "this", "is", "are", "be", "new", "made",
  "from", "into", "product", "products", "design", "designed", "high", "best",
]);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function parsePrice(input?: string): { value: number | null; currency: string } {
  if (!input) return { value: null, currency: "" };
  const text = input.replace(/,/g, "");
  const currencyMatch = text.match(/(A\$|US\$|\$|£|€|¥|USD|AUD|GBP|EUR|NZD|CAD)/i);
  const numberMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
  return {
    value: numberMatch ? parseFloat(numberMatch[1]) : null,
    currency: currencyMatch ? currencyMatch[1].toUpperCase().replace("US$", "USD").replace("A$", "AUD").replace("$", "USD") : "",
  };
}

function keywords(...parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts.join(" ").toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (p.length < 3 || STOPWORDS.has(p) || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= 8) break;
  }
  return out;
}

function buildQuery(idea: ProductIdea): string {
  const bits = [idea.title, idea.category].filter(Boolean).join(" ");
  return `${bits} similar products`.trim();
}

function uniqueByDomain(results: SearchResult[], max: number): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const d = domainOf(r.url);
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

function buildInsights(idea: ProductIdea, competitors: Competitor[], priceRange: ResearchResult["benchmark"]["priceRange"]): string[] {
  const insights: string[] = [];
  if (competitors.length) {
    insights.push(`Found ${competitors.length} comparable product${competitors.length === 1 ? "" : "s"} currently on the market.`);
  }
  if (priceRange) {
    const fmt = (n: number) => `${priceRange.currency || "$"}${Math.round(n)}`;
    insights.push(`Market pricing ranges from ${fmt(priceRange.min)} to ${fmt(priceRange.max)} (avg ~${fmt(priceRange.avg)}).`);
    const target = parsePrice(idea.priceTarget).value;
    if (target != null) {
      if (target < priceRange.min) insights.push(`Your ${priceRange.currency || "$"}${target} target undercuts every competitor found — a potential value play.`);
      else if (target > priceRange.max) insights.push(`Your ${priceRange.currency || "$"}${target} target sits above the market — lean into premium positioning.`);
      else insights.push(`Your ${priceRange.currency || "$"}${target} target lands mid-market — differentiation on features will matter.`);
    }
  }
  // Most common features across competitors.
  const featureCount = new Map<string, number>();
  competitors.forEach((c) => c.features.forEach((f) => {
    const key = f.trim().toLowerCase();
    if (key.length > 2) featureCount.set(key, (featureCount.get(key) ?? 0) + 1);
  }));
  const common = Array.from(featureCount.entries()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0];
  if (common) insights.push(`"${common[0]}" appears across multiple competitors — consider it table stakes.`);
  if (insights.length < 2) insights.push("Use the benchmark below to position pricing, features and messaging before committing to development.");
  return insights;
}

function buildEnrichment(idea: ProductIdea, competitors: Competitor[]) {
  const tags = keywords(idea.title, idea.features, idea.category);
  return {
    suggestedCategory: idea.category || (competitors[0]?.brand ? "Consumer goods" : "Uncategorised"),
    tags,
    targetAudience: idea.audience || idea.targetMarket || "General consumers",
    summary:
      `"${idea.title}" benchmarked against ${competitors.length} live market product${competitors.length === 1 ? "" : "s"}. ` +
      (idea.description ? idea.description.slice(0, 160) : "No description provided."),
  };
}

function priceRangeOf(competitors: Competitor[]): ResearchResult["benchmark"]["priceRange"] {
  const values = competitors.map((c) => c.priceValue).filter((v): v is number => v != null && v > 0);
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const currency = competitors.find((c) => c.currency)?.currency || "USD";
  return { min, max, avg, currency };
}

async function runLive(idea: ProductIdea, started: number): Promise<ResearchResult> {
  const query = buildQuery(idea);
  const results = await search(query, 8);
  const searchAgent: AgentRunInfo = {
    id: "search",
    name: "Market Discovery Agent",
    description: "Searches the live web for similar products in the market.",
    status: results.length ? "complete" : "error",
    detail: results.length ? `Found ${results.length} candidate sources for “${query}”.` : "No web results returned.",
  };

  const candidates = uniqueByDomain(results, 6).slice(0, 5);
  const extractions = await Promise.allSettled(candidates.map((c) => extractProduct(c.url)));

  const competitors: Competitor[] = [];
  candidates.forEach((cand, i) => {
    const res = extractions[i];
    const data = res.status === "fulfilled" ? res.value : null;
    const priced = parsePrice(data?.price);
    competitors.push({
      name: data?.productName?.trim() || cand.title.replace(/\s*[-|–].*$/, "").trim(),
      brand: data?.brand?.trim() || domainOf(cand.url),
      price: data?.price?.trim() || "",
      priceValue: priced.value,
      currency: priced.currency,
      features: (data?.keyFeatures ?? []).slice(0, 5).map((f) => String(f).trim()).filter(Boolean),
      url: cand.url,
      source: domainOf(cand.url),
    });
  });

  const withData = competitors.filter((c) => c.price || c.features.length).length;
  const benchmarkAgent: AgentRunInfo = {
    id: "benchmark",
    name: "Benchmarking Agent",
    description: "Extracts pricing and feature data from competitor pages.",
    status: competitors.length ? "complete" : "error",
    detail: `Benchmarked ${competitors.length} product${competitors.length === 1 ? "" : "s"} (${withData} with extracted pricing/features).`,
  };

  const priceRange = priceRangeOf(competitors);
  const insights = buildInsights(idea, competitors, priceRange);
  const enrichment = buildEnrichment(idea, competitors);

  const insightAgent: AgentRunInfo = {
    id: "insights",
    name: "Insights Agent",
    description: "Synthesises positioning, pricing and feature insights.",
    status: "complete",
    detail: `Generated ${insights.length} insights and ${enrichment.tags.length} tags.`,
  };

  return {
    mode: "live",
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    enrichment,
    benchmark: { competitors, priceRange, insights },
    agents: [searchAgent, benchmarkAgent, insightAgent],
    sources: candidates.map((c) => ({ title: c.title, url: c.url })),
  };
}

function runDemo(idea: ProductIdea, started: number): ResearchResult {
  // Deterministic placeholder so the workflow is demonstrable without an API key.
  const base = 25 + (idea.title.length % 7) * 6;
  const competitors: Competitor[] = [
    { name: `${idea.category || "Market"} Leader Pro`, brand: "Northwind", price: `$${base + 20}`, priceValue: base + 20, currency: "USD", features: ["Premium materials", "2-year warranty", "Eco-friendly"], url: "https://example.com/a", source: "example.com" },
    { name: `Everyday ${idea.category || "Product"}`, brand: "Brightway", price: `$${base}`, priceValue: base, currency: "USD", features: ["Affordable", "Lightweight", "Eco-friendly"], url: "https://example.com/b", source: "example.com" },
    { name: `${idea.title} Alternative`, brand: "Marisol", price: `$${base + 10}`, priceValue: base + 10, currency: "USD", features: ["Compact", "Premium materials"], url: "https://example.com/c", source: "example.com" },
  ];
  const priceRange = priceRangeOf(competitors);
  return {
    mode: "demo",
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    enrichment: buildEnrichment(idea, competitors),
    benchmark: { competitors, priceRange, insights: buildInsights(idea, competitors, priceRange) },
    agents: [
      { id: "search", name: "Market Discovery Agent", description: "Searches the live web for similar products.", status: "skipped", detail: "Demo mode — set FIRECRAWL_API_KEY for live web research." },
      { id: "benchmark", name: "Benchmarking Agent", description: "Extracts pricing and feature data from competitors.", status: "complete", detail: "Generated sample benchmark data." },
      { id: "insights", name: "Insights Agent", description: "Synthesises positioning insights.", status: "complete", detail: "Generated sample insights." },
    ],
    sources: [],
  };
}

export async function runResearch(idea: ProductIdea): Promise<ResearchResult> {
  const started = Date.now();
  if (!firecrawlEnabled()) return runDemo(idea, started);
  try {
    const result = await runLive(idea, started);
    // If live research yielded nothing usable, fall back to demo data.
    if (!result.benchmark.competitors.length) return runDemo(idea, started);
    return result;
  } catch (err) {
    return {
      ...runDemo(idea, started),
      error: err instanceof Error ? err.message : "Research failed",
    };
  }
}
