export type IdeaStatus = "queued" | "researching" | "complete" | "error";

export type ProductIdea = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  category: string;
  targetMarket: string;
  audience: string;
  priceTarget: string;
  features: string;
  imageUrl: string;
  submittedBy: string;
  status: IdeaStatus;
  research?: ResearchResult;
};

export type Competitor = {
  name: string;
  brand: string;
  price: string;
  priceValue: number | null;
  currency: string;
  features: string[];
  url: string;
  source: string;
};

export type AgentRunInfo = {
  id: string;
  name: string;
  description: string;
  status: "complete" | "error" | "skipped";
  detail: string;
};

export type Classification = {
  category: string;
  productClass: string;
  keywords: string[];
  attributes: string[];
  summary: string;
};

export type ShoppingOffer = {
  title: string;
  price: string;
  priceValue: number | null;
  currency: string;
  store: string;
  rating: number | null;
  reviews: number | null;
  image: string;
};

export type Supplier = {
  name: string;
  url: string;
  snippet: string;
};

export type Maker = {
  name: string;
  offers: number;
  lowestPrice: string;
};

export type ResearchResult = {
  mode: "live" | "demo";
  ranAt: string;
  durationMs: number;
  enrichment: {
    suggestedCategory: string;
    tags: string[];
    targetAudience: string;
    summary: string;
  };
  benchmark: {
    competitors: Competitor[];
    priceRange: { min: number; max: number; avg: number; currency: string } | null;
    insights: string[];
  };
  classification?: Classification | null;
  marketplace?: {
    offers: ShoppingOffer[];
    priceRange: { min: number; max: number; avg: number; currency: string } | null;
  } | null;
  suppliers?: Supplier[];
  makers?: Maker[];
  analysis?: {
    summary: string;
    positioning: string;
    differentiation: string[];
    risks: string[];
    suggestedPrice: string;
    nextSteps: string[];
  } | null;
  agents: AgentRunInfo[];
  sources: { title: string; url: string }[];
  error?: string;
};

export type NewIdeaInput = {
  title: string;
  description: string;
  category?: string;
  targetMarket?: string;
  audience?: string;
  priceTarget?: string;
  features?: string;
  imageUrl?: string;
  submittedBy?: string;
};
