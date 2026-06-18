# Merge brief: SupplyScope → Retail Supply Intel

Handoff spec for merging this app (**SupplyScope**, `IFS-NXB/supply-scope`) into
**Retail Supply Intel** (**RSI**, `KeerthiPrasad10/Retail-supply-intel`) so both
live as **one app**, shipped through RSI's existing Vercel deployment and shared
Supabase. RSI is the host UI; SupplyScope contributes the "submit a product idea
→ multi-agent research & benchmark" feature.

> Run this from a session scoped to **`KeerthiPrasad10/Retail-supply-intel`**
> (it has push access there). SupplyScope is public — clone it read-only to port
> from:
> `git clone --depth 1 -b claude/eloquent-einstein-iiqj1x https://github.com/IFS-NXB/supply-scope`

## Source files to port (from supply-scope)
- **lib:** `lib/agents.ts` (orchestration), `lib/firecrawl.ts`, `lib/apify.ts`,
  `lib/price.ts`, `lib/types.ts` (idea/research types), `lib/integration.ts`
  (shared-DB fan-out), `lib/store.ts` (persistence), `lib/supabase.ts`
  (service-role client).
- **API:** `app/api/ideas/route.ts` (create/list), `app/api/ideas/[id]/research/route.ts`
  (runs the pipeline).
- **UI (Tailwind — must be restyled):** `app/submit/page.tsx`,
  `app/ideas/[id]/page.tsx`, and `components/*` (submit form, research panel,
  benchmark table, supplier list, strategy analysis, sources).

## Target conventions (RSI `web/`)
- Next.js 14 App Router. **Plain-CSS NxB design system** (`web/app/tokens.css` +
  `web/app/app.css`) — **no Tailwind**. `@/*` → `web/`.
- Dashboard is a **client SPA**: `web/components/Dashboard.tsx` owns view-state
  (`View` = overview|insights|trending|deepdive|map|suppliers|shortlist);
  `web/components/sidebar.tsx` is the nav; `web/app/page.tsx` is the only server
  component (loads snapshot via `web/lib/data.ts` → `web/lib/model.ts`).
- **Server AI routes already exist** — mirror their style:
  `web/app/api/extract/route.ts`, `web/app/api/refresh/route.ts`
  (`runtime="nodejs"`, `dynamic="force-dynamic"`, key via
  `ANTHROPIC_API_KEY || RSI_ANTHROPIC_API_KEY`, graceful 501/mock without a key).
- Supabase: dashboard reads via **anon** key (`NEXT_PUBLIC_SUPABASE_*`,
  `web/lib/supabase.ts`/`data.ts`). Writes need the **service-role** key,
  server-side only.
- Schema source of truth is **`pipelines/src/rsi/models.py`**; regenerate the
  migration with `uv run rsi schema --dialect postgres` — never hand-edit
  `supabase/migrations/0001_initial_schema.sql`.

## Implementation steps
1. **Nav + view:** add a `View` value (e.g. `"ideas"`, label "Validate") to
   `web/lib/types.ts`, render it in `Dashboard.tsx`, add a `sidebar.tsx` item +
   icon, and a `crumbs` entry.
2. **UI:** create `web/components/views/ideas.tsx` (+ subcomponents): the
   submission form and the results view (classification, store/competitor
   benchmark, suppliers, strategy analysis, sources). **Restyle** from Tailwind
   into NxB CSS — reuse `web/components/primitives.tsx` and
   `web/components/views/shared.tsx`. No Tailwind.
3. **API:** port to `web/app/api/ideas/route.ts` and
   `web/app/api/ideas/[id]/research/route.ts` using RSI route conventions
   (`runtime="nodejs"`, `force-dynamic`, graceful degradation). Reuse
   `ANTHROPIC_API_KEY`; add `FIRECRAWL_API_KEY`, `APIFY_API_TOKEN`.
4. **lib:** copy `agents.ts`, `firecrawl.ts`, `apify.ts`, `price.ts` and the
   idea/research types into `web/lib/ideas/` (namespaced to avoid collisions).

## Data-model reconciliation (important — don't skip)
SupplyScope's `lib/integration.ts` currently writes parallel `insights` and
`product_ideas` tables, a `snapshots` row, and `competitors.source` — which do
**not** all match RSI's canonical schema. Reconcile as follows:

- **Do NOT write to RSI's `snapshots` table.** RSI's dashboard reads the *latest*
  `snapshots` row as its entire view-model (`web/lib/data.ts`); a foreign-shaped
  row would clobber the live dashboard.
- **Map idea analysis onto RSI's existing `triggers`** model (`score`,
  `rationale`, `payload` JSON, `status`, `category_id`) instead of a custom
  `insights` table — natural fit and the dashboard can surface it.
- **Add a `product_ideas` model** to `models.py` (id, title, description,
  category_id, image_url, status, research JSON, created_at) and regenerate the
  migration.
- **Suppliers/competitors** already align with
  `suppliers(name,country_code,category_id,external_id,source)` and
  `competitors(name,home_country)` — drop the non-schema `competitors.source`
  (or add it to the model deliberately). Keep the existing resolve-or-create on
  `product_categories`.
- Writes use a **server-only** service-role client (new env
  `SUPABASE_SERVICE_ROLE_KEY`, e.g. `web/lib/ideas/supabase-admin.ts`); reads
  stay on the anon key.

## Surface it back (optional but recommended)
Add a panel that reads `product_ideas` + their `triggers` rows live (existing
Supabase patterns) so submitted ideas and analyses appear in the dashboard.

## Env + verify
- Extend `web/.env.example` with `SUPABASE_SERVICE_ROLE_KEY`,
  `FIRECRAWL_API_KEY`, `APIFY_API_TOKEN` (note `ANTHROPIC_API_KEY` already used).
  Document in `docs/DEPLOYMENT.md`; set the same vars in RSI's Vercel project.
- Verify: `cd web && npm install && npm run build && npm run typecheck && npm run lint`.
- Schema: `cd pipelines && uv run rsi schema --dialect postgres`, then apply the
  additive change to Supabase.

## Gotchas
- No Tailwind — restyle into tokens, don't add the dependency.
- Keep SupplyScope's graceful degradation (no keys → demo data) so the
  dashboard's prerender (`web/lib/snapshot.json`) still builds.
- The shared Supabase already contains SupplyScope's added tables from an earlier
  integration; bringing them into `models.py` (or migrating that data into
  `triggers`) makes the repo's schema reflect reality.
