# SupplyScope — Product Idea Intelligence

Submit (or upload) a product idea and let a team of AI agents go and **seek
information about it** — including **benchmarking similar products in the
market** with live web data.

This is a functional rebuild of the core SupplyScope workflow: capture product
ideas from anyone, then automatically research and benchmark them so teams can
validate and position faster.

## What it does

1. **Submit a product idea** — title, description, category, target market,
   audience, target price, key features, and an optional reference image
   (upload or URL).
2. **Agents go to work automatically** — a pipeline of agents runs:
   - **Classifier** _(Claude, vision-aware)_ — classifies the product (using the
     uploaded image if present) into a category/class and derives search terms.
   - **Market Discovery Agent** _(Firecrawl)_ — searches the live web for
     similar products.
   - **Benchmarking Agent** _(Firecrawl)_ — extracts competitor **pricing and
     features** from real product pages.
   - **Marketplace Scan** _(Apify · Google Shopping)_ — pulls live store
     listings with **prices, retailers and ratings**.
   - **Sourcing Agent** _(Firecrawl)_ — finds **manufacturers and suppliers**.
   - **Strategy Analyst** _(Claude)_ — turns it all into positioning,
     differentiation, a suggested price and next steps.
3. **Review the results** — competitor benchmark, store prices, "who's making
   it", supplier leads, positioning insights, AI strategy analysis, and sources.

## How the agents work

The agents combine three providers, each behind its own key and each degrading
gracefully when its key is absent:

- **[Firecrawl](https://firecrawl.dev)** — `/search` discovers comparable
  products and suppliers; `/scrape` with a structured `json` schema extracts each
  competitor's name, brand, price and features.
- **[Apify](https://apify.com)** — runs a Google Shopping actor to return live
  store offers (price, retailer, rating, reviews).
- **[Claude](https://www.anthropic.com)** — classifies the product (with vision
  on the uploaded image) and writes the strategy analysis via structured output.

If **no** keys are set, the agents return deterministic **demo data** so the
workflow is still fully demonstrable.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Firecrawl** for live web research & supplier discovery
- **Apify** (Google Shopping) for live store prices
- **Claude** (Anthropic SDK) for classification & strategy analysis
- Lightweight **JSON file store** for persistence (`.data/db.json`)

## Getting started

```bash
npm install

# Optional but recommended — enables live web research
cp .env.example .env.local
# then edit .env.local and set your FIRECRAWL_API_KEY

npm run dev
# open http://localhost:3000
```

### Environment variables

| Variable             | Required | Description                                                          |
| -------------------- | -------- | ------------------------------------------------------------------- |
| `FIRECRAWL_API_KEY`  | No\*     | Enables web research, benchmarking & supplier discovery.           |
| `ANTHROPIC_API_KEY`  | No       | Enables the Claude Classifier (vision) and Strategy Analyst.        |
| `ANTHROPIC_MODEL`    | No       | Overrides the analysis model (sensible default if unset).          |
| `APIFY_API_TOKEN`    | No       | Enables the Marketplace Scan (live store prices via Google Shopping).|

\* Required for real benchmarking against the live web.

## Project structure

```
app/
  page.tsx                     Dashboard (list ideas, stats, how-it-works)
  submit/page.tsx              Submission form
  ideas/[id]/page.tsx          Idea detail + agent results
  api/ideas/route.ts           Create / list ideas
  api/ideas/[id]/research/...  Run the agent pipeline
lib/
  types.ts                     Domain types
  store.ts                     JSON file persistence
  firecrawl.ts                 Firecrawl client (search + extraction)
  agents.ts                    Agent orchestration (discovery, benchmark, insights)
components/                    UI (submit form, research panel, benchmark table, …)
```

## Notes & next steps

- **Persistence:** the JSON file store is great for local/dev and a single
  long-running server. For production / serverless (e.g. Vercel), swap
  `lib/store.ts` for a database — Supabase/Postgres slots in cleanly behind the
  same interface.
- **Background runs:** research currently runs synchronously per request
  (~20–40s). For larger fan-out, move it to a queue/job and poll for status.
- **Auth & teams, attachments, more agents** (sourcing, demand/trend research)
  are natural follow-ups.
