import type {
  AgentRunInfo,
  Classification,
  Competitor,
  Maker,
  ProductIdea,
  ResearchResult,
  ShoppingOffer,
  Supplier,
} from "./types";
import { extractProduct, firecrawlEnabled, search, type SearchResult } from "./firecrawl";
import { googleShopping, apifyEnabled } from "./apify";
import { analyzeWithClaude, classifyProduct, llmEnabled } from "./llm";
import { parsePrice, priceRangeOf } from "./price";

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

function firstBrand(title: string): string {
  const words = title.trim().split(/\s+/);
  let brand = words[0] || "";
  if (words[1] && /^[A-Z0-9]/.test(words[1]) && brand.length <= 5) brand += " " + words[1];
  return brand.replace(/[^A-Za-z0-9& ]/g, "").trim();
}

function buildMakers(competitors: Competitor[], offers: ShoppingOffer[]): Maker[] {
  const map = new Map<string, { name: string; low: number | null; currency: string; count: number }>();
  const add = (name: string, priceValue: number | null, currency: string) => {
    const clean = name.trim();
    if (clean.length < 3) return;
    const key = clean.toLowerCase();
    const e = map.get(key) ?? { name: clean, low: null, currency: currency || "", count: 0 };
    e.count += 1;
    if (priceValue != null && (e.low == null || priceValue < e.low)) {
      e.low = priceValue;
      e.currency = currency || e.currency;
    }
    map.set(key, e);
  };

  competitors.forEach((c) => {
    if (c.brand && !c.brand.includes(".")) add(c.brand, c.priceValue, c.currency);
  });
  offers.forEach((o) => add(firstBrand(o.title), o.priceValue, o.currency));

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((m) => ({
      name: m.name,
      offers: m.count,
      lowestPrice: m.low != null ? `${m.currency === "USD" ? "$" : (m.currency || "$") + " "}${Math.round(m.low)}` : "",
    }));
}

function buildInsights(
  idea: ProductIdea,
  competitors: Competitor[],
  offers: ShoppingOffer[],
  priceRange: ResearchResult["benchmark"]["priceRange"]
): string[] {
  const insights: string[] = [];
  const total = competitors.length + offers.length;
  if (total) insights.push(`Found ${total} comparable listing${total === 1 ? "" : "s"} across the web and marketplaces.`);
  if (priceRange) {
    const fmt = (n: number) => `${priceRange.currency === "USD" ? "$" : (priceRange.currency || "$") + " "}${Math.round(n)}`;
    insights.push(`Market pricing ranges from ${fmt(priceRange.min)} to ${fmt(priceRange.max)} (avg ~${fmt(priceRange.avg)}).`);
    const target = parsePrice(idea.priceTarget).value;
    if (target != null) {
      if (target < priceRange.min) insights.push(`Your ${fmt(target)} target undercuts every product found — a potential value play.`);
      else if (target > priceRange.max) insights.push(`Your ${fmt(target)} target sits above the market — lean into premium positioning.`);
      else insights.push(`Your ${fmt(target)} target lands mid-market — differentiation on features will matter.`);
    }
  }
  if (insights.length < 2) insights.push("Use the benchmark below to position pricing, features and messaging before committing to development.");
  return insights;
}

function buildEnrichment(idea: ProductIdea, competitors: Competitor[], classification: Classification | null) {
  const tags = classification?.keywords?.length ? classification.keywords.slice(0, 8) : keywords(idea.title, idea.features, idea.category);
  const baseSummary = classification?.summary ? classification.summary : (idea.description ? idea.description.slice(0, 160) : "No description provided.");
  return {
    suggestedCategory: classification?.category || idea.category || "Uncategorised",
    tags,
    targetAudience: idea.audience || idea.targetMarket || "General consumers",
    summary: `${baseSummary} Benchmarked against ${competitors.length} web product${competitors.length === 1 ? "" : "s"}.`,
  };
}

async function benchmarkViaFirecrawl(query: string): Promise<{ competitors: Competitor[]; sources: { title: string; url: string }[]; found: number }> {
  const results = await search(query, 8);
  const candidates = uniqueByDomain(results, 6).slice(0, 5);
  const extractions = await Promise.allSettled(candidates.map((c) => extractProduct(c.url)));

  const competitors: Competitor[] = candidates.map((cand, i) => {
    const res = extractions[i];
    const data = res.status === "fulfilled" ? res.value : null;
    const priced = parsePrice(data?.price);
    return {
      name: data?.productName?.trim() || cand.title.replace(/\s*[-|–].*$/, "").trim(),
      brand: data?.brand?.trim() || domainOf(cand.url),
      price: data?.price?.trim() || "",
      priceValue: priced.value,
      currency: priced.currency,
      features: (data?.keyFeatures ?? []).slice(0, 5).map((f) => String(f).trim()).filter(Boolean),
      url: cand.url,
      source: domainOf(cand.url),
    };
  });

  return {
    competitors,
    sources: results.slice(0, 8).map((r) => ({ title: r.title, url: r.url })),
    found: results.length,
  };
}

async function findSuppliers(productClass: string): Promise<Supplier[]> {
  const results = await search(`${productClass} manufacturer supplier wholesale OEM`, 8);
  return uniqueByDomain(results, 6)
    .slice(0, 6)
    .map((r) => ({ name: r.title.replace(/\s*[-|–].*$/, "").trim(), url: r.url, snippet: r.description }));
}

function offersToCompetitors(offers: ShoppingOffer[]): Competitor[] {
  return offers.slice(0, 8).map((o) => ({
    name: o.title,
    brand: firstBrand(o.title) || o.store,
    price: o.price,
    priceValue: o.priceValue,
    currency: o.currency,
    features: [],
    url: "",
    source: o.store,
  }));
}

function runDemo(idea: ProductIdea, started: number): ResearchResult {
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
    enrichment: buildEnrichment(idea, competitors, null),
    benchmark: { competitors, priceRange, insights: buildInsights(idea, competitors, [], priceRange) },
    makers: buildMakers(competitors, []),
    agents: [
      { id: "discovery", name: "Market Discovery Agent", description: "Searches the live web for similar products.", status: "skipped", detail: "Demo mode — set FIRECRAWL_API_KEY for live web research." },
      { id: "benchmark", name: "Benchmarking Agent", description: "Extracts competitor pricing and features.", status: "complete", detail: "Generated sample benchmark data." },
    ],
    sources: [],
  };
}

export async function runResearch(idea: ProductIdea): Promise<ResearchResult> {
  const started = Date.now();

  // Zero-key safety net — keep the workflow demonstrable.
  if (!firecrawlEnabled() && !apifyEnabled() && !llmEnabled()) {
    return runDemo(idea, started);
  }

  const agents: AgentRunInfo[] = [];

  // 1. Classify (Claude, vision-aware) — drives the search terms downstream.
  let classification: Classification | null = null;
  if (llmEnabled()) {
    classification = await classifyProduct(idea);
    agents.push({
      id: "classifier",
      name: "Classifier",
      description: "Classifies the product and derives search terms.",
      status: classification ? "complete" : "error",
      detail: classification
        ? `Class: ${classification.productClass} · ${classification.keywords.length} keywords.`
        : "Could not classify.",
    });
  }
  const productClass = classification?.productClass || idea.category || idea.title;
  const searchQuery =
    (classification?.keywords?.length ? classification.keywords.join(" ") : `${idea.title} ${idea.category}`.trim()) +
    " similar products";

  // 2/3 + 4 + 5 run in parallel: Firecrawl benchmark, Apify marketplace, Firecrawl suppliers.
  const [benchRes, offers, suppliers] = await Promise.all([
    firecrawlEnabled() ? benchmarkViaFirecrawl(searchQuery) : Promise.resolve(null),
    apifyEnabled() ? googleShopping(productClass, 12) : Promise.resolve<ShoppingOffer[]>([]),
    firecrawlEnabled() ? findSuppliers(productClass) : Promise.resolve<Supplier[]>([]),
  ]);

  const competitors = benchRes?.competitors ?? [];
  const sources = benchRes?.sources ?? [];

  if (firecrawlEnabled()) {
    agents.push({
      id: "discovery",
      name: "Market Discovery Agent",
      description: "Searches the live web for similar products.",
      status: benchRes && benchRes.found ? "complete" : "error",
      detail: benchRes ? `Found ${benchRes.found} candidate sources.` : "No web results returned.",
    });
    const withData = competitors.filter((c) => c.price || c.features.length).length;
    agents.push({
      id: "benchmark",
      name: "Benchmarking Agent",
      description: "Extracts competitor pricing and features.",
      status: competitors.length ? "complete" : "error",
      detail: `Benchmarked ${competitors.length} products (${withData} with pricing/features).`,
    });
  }

  let marketplace: ResearchResult["marketplace"] = null;
  if (apifyEnabled()) {
    marketplace = offers.length ? { offers, priceRange: priceRangeOf(offers) } : null;
    const stores = new Set(offers.map((o) => o.store).filter(Boolean)).size;
    agents.push({
      id: "marketplace",
      name: "Marketplace Scan",
      description: "Finds live store listings and prices.",
      status: offers.length ? "complete" : "error",
      detail: offers.length ? `Found ${offers.length} store offers across ${stores} retailers.` : "No store offers found.",
    });
  }

  if (firecrawlEnabled()) {
    agents.push({
      id: "suppliers",
      name: "Sourcing Agent",
      description: "Finds manufacturers and suppliers.",
      status: suppliers.length ? "complete" : "error",
      detail: suppliers.length ? `Found ${suppliers.length} supplier leads.` : "No suppliers found.",
    });
  }

  // Derived views.
  const priceRange = priceRangeOf([...competitors, ...offers]);
  const makers = buildMakers(competitors, offers);
  const insights = buildInsights(idea, competitors, offers, priceRange);
  const enrichment = buildEnrichment(idea, competitors, classification);

  // If live research produced nothing usable at all, fall back to demo data.
  if (!competitors.length && !offers.length && !classification && !suppliers.length) {
    return runDemo(idea, started);
  }

  const result: ResearchResult = {
    mode: "live",
    ranAt: new Date().toISOString(),
    durationMs: 0,
    enrichment,
    classification,
    benchmark: { competitors, priceRange, insights },
    marketplace,
    suppliers,
    makers,
    agents,
    sources,
  };

  // 6. Strategy analyst (Claude) — informed by web + marketplace data.
  if (llmEnabled()) {
    const analysis = await analyzeWithClaude(idea, [...competitors, ...offersToCompetitors(offers)], priceRange);
    if (analysis) {
      result.analysis = analysis;
      agents.push({
        id: "analyst",
        name: "Strategy Analyst",
        description: "Turns the research into positioning, pricing and next steps.",
        status: "complete",
        detail: `Produced positioning, ${analysis.differentiation.length} differentiators and ${analysis.nextSteps.length} next steps.`,
      });
    } else {
      agents.push({
        id: "analyst",
        name: "Strategy Analyst",
        description: "Turns the research into positioning, pricing and next steps.",
        status: "error",
        detail: "Analysis could not be generated.",
      });
    }
  }

  result.durationMs = Date.now() - started;
  return result;
}
