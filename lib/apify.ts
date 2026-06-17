import type { ShoppingOffer } from "./types";
import { parsePrice } from "./price";

const BASE = "https://api.apify.com/v2";

// Google Shopping actor — keyword search returning live store listings.
const GOOGLE_SHOPPING_ACTOR = "burbn~google-shopping-scraper";

export function apifyEnabled(): boolean {
  return Boolean(process.env.APIFY_API_TOKEN);
}

async function runActor(actorId: string, input: unknown, timeoutMs: number): Promise<any[] | null> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ctrl.signal,
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.items ?? null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function googleShopping(query: string, limit = 12): Promise<ShoppingOffer[]> {
  const items = await runActor(
    GOOGLE_SHOPPING_ACTOR,
    { searchQuery: query, limit: Math.max(10, limit), country: "us", language: "en" },
    150_000
  );
  if (!items) return [];

  return items
    .filter((i) => i?.product_title)
    .map((i) => {
      const p = parsePrice(i.price);
      return {
        title: String(i.product_title).trim(),
        price: i.price ? String(i.price).trim() : "",
        priceValue: p.value,
        currency: p.currency,
        store: i.store_name ? String(i.store_name).trim() : "",
        rating: typeof i.product_rating === "number" ? i.product_rating : null,
        reviews: typeof i.product_num_reviews === "number" ? i.product_num_reviews : null,
        image: Array.isArray(i.product_photos) ? String(i.product_photos[0] ?? "") : "",
      } satisfies ShoppingOffer;
    });
}
