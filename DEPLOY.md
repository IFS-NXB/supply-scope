# Deploying SupplyScope (GitHub → Vercel, access-gated)

SupplyScope is a Next.js 14 app. The intended setup is **GitHub → Vercel**:
connect the repo once, and Vercel builds a **production** deployment on every
push to `main` and a **preview** deployment for every pull request.

The public deployment is protected by an **HTTP Basic Auth gate** (see
[`middleware.ts`](./middleware.ts)) so unauthenticated visitors can't trigger
shared-DB writes or burn Anthropic / Firecrawl / Apify credits.

---

## 1. One-time: connect the repo to Vercel

1. In Vercel, **Add New → Project → Import Git Repository** and pick
   `IFS-NXB/supply-scope`.
2. Framework is auto-detected as **Next.js** (Build `next build`, Install
   `npm install`). No `vercel.json` is needed.
3. Add the environment variables below **before** the first deploy.
4. Deploy.

After this, pushes to the feature branch / PR get preview URLs and `main` gets
the production URL automatically.

## 2. Environment variables

Set these in **Project → Settings → Environment Variables**. Real secret values
are **not** stored in this repo — copy them from wherever you keep them (the
local `.env.local`, your password manager, the provider dashboards).

| Variable                    | Purpose                                          | Set for                |
| --------------------------- | ------------------------------------------------ | ---------------------- |
| `BASIC_AUTH_PASSWORD`       | **Access gate.** Required on Vercel — if unset the app fails closed (503). | Production **+ Preview** |
| `BASIC_AUTH_USER`           | Gate username (defaults to `supplyscope` if unset). | Production **+ Preview** |
| `SUPABASE_URL`              | Shared Retail-supply-intel DB API URL.           | Production (+ Preview to make previews live) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server-side service-role key (bypasses RLS). Never expose client-side. | Production (+ Preview)  |
| `ANTHROPIC_API_KEY`         | Claude Classifier + Strategy Analyst.            | Production (+ Preview)  |
| `ANTHROPIC_MODEL`           | Optional analysis-model override.                | optional                |
| `FIRECRAWL_API_KEY`         | Web research / supplier discovery.               | Production (+ Preview)  |
| `APIFY_API_TOKEN`           | Online Stores (Amazon) + China Suppliers (AliExpress). | Production (+ Preview) |

`SUPABASE_URL` for this project is `https://dkoaqoijntxypvidxrsv.supabase.co`
(not a secret — the API URL is safe to commit; the service-role **key** is the
secret and must only live in Vercel env settings).

## 3. How the access gate works

`middleware.ts` runs on every page and API route (except static assets):

- **`BASIC_AUTH_PASSWORD` set** → browser prompts for credentials; only
  `BASIC_AUTH_USER` + `BASIC_AUTH_PASSWORD` get through.
- **On Vercel with no password** → returns **503 (fails closed)**, so a
  misconfigured deploy is never open *and* live.
- **Locally** (`npm run dev`, no `VERCEL` env, no password) → open, no prompt.

## 4. Preview deployments (PRs are public too)

Every PR gets a public preview URL, so treat previews like production:

- Always set `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` for **Preview** as well —
  otherwise previews return 503 by design (closed, never open).
- Only add the live data keys (`SUPABASE_*`, `ANTHROPIC_API_KEY`,
  `FIRECRAWL_API_KEY`, `APIFY_API_TOKEN`) to **Preview** if you want previews to
  run live against the shared DB. Leave them off Preview to have previews fall
  back to demo data (no DB writes, no API spend) behind the same gate.

## 5. Security notes

- The **service-role key bypasses RLS** — it is read only by server code
  (`lib/supabase.ts`) and is never sent to the browser. Keep it to Vercel env
  vars (and the gitignored `.env.local`); never put it in committed files or
  client code.
- The gate is the only thing between the public URL and real DB writes / paid
  API calls — set a strong `BASIC_AUTH_PASSWORD` and rotate it if shared.
- To rotate the Supabase key, generate a new service-role/secret key in the
  Supabase dashboard, update the Vercel env var, and redeploy.
