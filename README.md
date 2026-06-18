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
   - **Online Stores** _(Apify · Amazon)_ — live listings with **brands,
     prices, ratings and review counts**.
   - **Web Research** _(Firecrawl)_ — finds and extracts similar products
     across the open web (DTC brands and long-tail).
   - **China Suppliers** _(Apify · AliExpress)_ — suppliers with **wholesale
     prices, order volume and ratings** (the margin & sourcing signal).
   - **Web Sourcing** _(Firecrawl)_ — additional manufacturer/supplier leads.
   - **Strategy Analyst** _(Claude)_ — turns it all into positioning,
     differentiation, a suggested price and next steps.
3. **Review the results** — competitor benchmark, store prices, "who's making
   it", supplier leads, positioning insights, AI strategy analysis, and sources.

## How the agents work

The agents combine three providers, each behind its own key and each degrading
gracefully when its key is absent:

- **[Apify](https://apify.com)** — marketplace-native actors: an **Amazon**
  scraper (brands, prices, ratings, reviews) and an **AliExpress** scraper
  (wholesale prices, order volume) for China suppliers.
- **[Firecrawl](https://firecrawl.dev)** — `/search` + `/scrape` for broad web
  discovery, DTC brand pages and long-tail supplier leads.
- **[Claude](https://www.anthropic.com)** — classifies the product (with vision
  on the uploaded image) and writes the strategy analysis via structured output.

If **no** keys are set, the agents return deterministic **demo data** so the
workflow is still fully demonstrable.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Apify** (Amazon + AliExpress) for store prices & China suppliers
- **Firecrawl** for broad web research & supplier leads
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
| `APIFY_API_TOKEN`    | No       | Enables Online Stores (Amazon) + China Suppliers (AliExpress).      |
| `SUPABASE_URL`       | No       | Shared Retail-supply-intel DB API URL (enables Postgres persistence).|
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-side service-role key; enables the shared-DB integration.   |
| `BASIC_AUTH_USER`    | No       | Access-gate username for the public deployment (default `supplyscope`).|
| `BASIC_AUTH_PASSWORD`| No†      | Access-gate password; gates every page + API route when set.        |

\* Required for real benchmarking against the live web.
† Required **on Vercel** — without it the deployment fails closed (503). See [`DEPLOY.md`](./DEPLOY.md).

## Deploy

The app deploys to **Vercel** from GitHub (production on `main`, preview per PR)
and is protected by an HTTP Basic Auth gate (`middleware.ts`) so the public URL
can run live against the shared DB without exposing it to anonymous traffic.
Full setup, environment-variable matrix and security notes are in
[`DEPLOY.md`](./DEPLOY.md).

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

- **Persistence:** when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set,
  ideas persist to Postgres and research fans out into the shared
  Retail-supply-intel tables (`lib/store.ts`, `lib/integration.ts`). Without
  them it falls back to the local JSON file store (`.data/db.json`), which is
  fine for local/dev but not durable on serverless — set Supabase for Vercel.
- **Background runs:** research currently runs synchronously per request
  (~20–40s). For larger fan-out, move it to a queue/job and poll for status.
- **Auth & teams, attachments, more agents** (sourcing, demand/trend research)
  are natural follow-ups.
