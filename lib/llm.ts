import Anthropic from "@anthropic-ai/sdk";
import type { Classification, Competitor, ProductIdea, ResearchResult } from "./types";

export type CompetitiveAnalysis = {
  summary: string;
  positioning: string;
  differentiation: string[];
  risks: string[];
  suggestedPrice: string;
  nextSteps: string[];
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function llmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "2-3 sentence executive summary of the opportunity." },
    positioning: { type: "string", description: "How this product should be positioned against the market." },
    differentiation: { type: "array", items: { type: "string" }, description: "Concrete ways the product can stand out." },
    risks: { type: "array", items: { type: "string" }, description: "Key risks, gaps or concerns to watch." },
    suggestedPrice: { type: "string", description: "A specific recommended price or range, with currency." },
    nextSteps: { type: "array", items: { type: "string" }, description: "Recommended next actions for the team." },
  },
  required: ["summary", "positioning", "differentiation", "risks", "suggestedPrice", "nextSteps"],
};

function buildPrompt(
  idea: ProductIdea,
  competitors: Competitor[],
  priceRange: ResearchResult["benchmark"]["priceRange"]
): string {
  const compLines = competitors
    .map((c) => `- ${c.name} (${c.brand}) — ${c.price || "price n/a"} — ${c.features.join("; ") || "no features listed"}`)
    .join("\n");
  const range = priceRange
    ? `Market price range: ${priceRange.currency} ${Math.round(priceRange.min)}–${Math.round(priceRange.max)} (avg ${Math.round(priceRange.avg)}).`
    : "No reliable market pricing was extracted.";

  return [
    "You are a product strategist helping a team evaluate a new product idea against the live market.",
    "",
    "PRODUCT IDEA",
    `Title: ${idea.title}`,
    `Description: ${idea.description || "(none)"}`,
    `Category: ${idea.category || "(unspecified)"}`,
    `Target market: ${idea.targetMarket || "(unspecified)"}`,
    `Target audience: ${idea.audience || "(unspecified)"}`,
    `Target price: ${idea.priceTarget || "(unspecified)"}`,
    `Key features: ${idea.features || "(none provided)"}`,
    "",
    "BENCHMARKED COMPETITORS (from live web research)",
    compLines || "(no comparable products were found)",
    range,
    "",
    "Produce a concise, decision-useful competitive analysis. Reference specific competitors and pricing where relevant. Be concrete and avoid generic filler.",
  ].join("\n");
}

const CLASSIFICATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string", description: "Broad product category, e.g. 'Drinkware & Kitchen'." },
    productClass: { type: "string", description: "Concise product class to search for to find similar products, e.g. 'insulated stainless steel water bottle'." },
    keywords: { type: "array", items: { type: "string" }, description: "3-6 search keywords for finding comparable products." },
    attributes: { type: "array", items: { type: "string" }, description: "Notable attributes/materials/features inferred." },
    summary: { type: "string", description: "One-line description of what the product is." },
  },
  required: ["category", "productClass", "keywords", "attributes", "summary"],
};

function imageBlock(imageUrl: string): any | null {
  if (!imageUrl) return null;
  const m = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
  if (/^https?:\/\//.test(imageUrl)) return { type: "image", source: { type: "url", url: imageUrl } };
  return null;
}

export async function classifyProduct(idea: ProductIdea): Promise<Classification | null> {
  if (!llmEnabled()) return null;
  const client = new Anthropic();

  const content: any[] = [];
  const img = imageBlock(idea.imageUrl);
  if (img) content.push(img);
  content.push({
    type: "text",
    text:
      "Classify this product idea for market research. Use the image if one is provided.\n" +
      `Title: ${idea.title}\n` +
      `Description: ${idea.description || "(none)"}\n` +
      `Stated category: ${idea.category || "(none)"}\n` +
      `Features: ${idea.features || "(none)"}\n\n` +
      "Return the category, a concise product class to search for, search keywords, key attributes, and a one-line summary.",
  });

  const params: any = {
    model: MODEL,
    max_tokens: 1200,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: CLASSIFICATION_SCHEMA },
    },
    messages: [{ role: "user", content }],
  };

  try {
    const res = await client.messages.create(params);
    const block = (res.content as any[]).find((b) => b.type === "text");
    if (!block?.text) return null;
    const parsed = JSON.parse(block.text) as Classification;
    if (!parsed.productClass) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function analyzeWithClaude(
  idea: ProductIdea,
  competitors: Competitor[],
  priceRange: ResearchResult["benchmark"]["priceRange"]
): Promise<CompetitiveAnalysis | null> {
  if (!llmEnabled()) return null;

  const client = new Anthropic();
  // Cast params to keep this resilient across SDK type-definition versions.
  const params: any = {
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
    },
    messages: [{ role: "user", content: buildPrompt(idea, competitors, priceRange) }],
  };

  try {
    const res = await client.messages.create(params);
    const block = (res.content as any[]).find((b) => b.type === "text");
    if (!block?.text) return null;
    const parsed = JSON.parse(block.text) as CompetitiveAnalysis;
    // Basic shape guard.
    if (!parsed.summary || !Array.isArray(parsed.differentiation)) return null;
    return parsed;
  } catch {
    return null;
  }
}
