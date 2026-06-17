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
2. **Agents go to work automatically** — three agents run as a pipeline:
   - **Market Discovery Agent** — searches the live web for similar products.
   - **Benchmarking Agent** — extracts competitor **pricing and features** from
     real product pages.
   - **Insights Agent** — synthesises pricing position, recurring ("table
     stakes") features, tags and an enriched summary.
   - **Strategy Analyst** _(optional, Claude-powered)_ — turns the benchmark
     into positioning, differentiation, a suggested price and next steps.
     Runs only when `ANTHROPIC_API_KEY` is set.
3. **Review the benchmark** — a competitor table (name, brand, price, features,
   source link), a market price range (low / average / high), positioning
   insights, and cited sources.

## How the agents work

The agents are powered by [Firecrawl](https://firecrawl.dev):

- `POST /v2/search` discovers comparable products on the open web.
- `POST /v2/scrape` with a structured `json` schema extracts each competitor's
  product name, brand, price and key features.
- Prices are parsed into numbers to compute the market range, and features are
  tallied to surface common (table-stakes) attributes.

If `FIRECRAWL_API_KEY` is **not** set, the agents return deterministic **demo
data** so the workflow is still fully demonstrable.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Firecrawl** for live web research
- **Claude** (Anthropic SDK) for the optional Strategy Analyst agent
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
| `FIRECRAWL_API_KEY`  | No\*     | Enables live market research. Without it, agents return demo data.  |
| `ANTHROPIC_API_KEY`  | No       | Enables the Claude-powered Strategy Analyst (positioning, pricing). |
| `ANTHROPIC_MODEL`    | No       | Overrides the analysis model (sensible default if unset).          |

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
