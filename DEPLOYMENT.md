# Deployment: Render (backend) + Vercel (frontend)

Markay Hall is a **monolithic Next.js 14** app. Production is split as follows:

| Layer | Platform | Role |
|-------|----------|------|
| **Frontend** | [Vercel](https://vercel.com) | Public URL, SSR pages, middleware, NextAuth UI |
| **Backend API + DB** | [Render](https://render.com) | PostgreSQL, API routes, file uploads, webhooks, cron targets |

Vercel proxies `/api/*` and `/uploads/*` to Render so the browser stays on one origin (cookies and auth work).

---

## Prerequisites

- GitHub repo connected to both Render and Vercel
- Node.js 20 locally for one-time seed (optional)

---

## Step 1 — Deploy backend on Render

### Option A: Blueprint (recommended)

1. In Render: **New → Blueprint** → connect this repo.
2. Render reads [`render.yaml`](./render.yaml) and creates:
   - `markay-hall-db` — PostgreSQL
   - `markay-hall-api` — Next.js web service
   - Two cron jobs (cart abandonment, analytics email)
3. After the first deploy, open **markay-hall-api → Environment** and set:

   | Variable | Value |
   |----------|--------|
   | `NEXTAUTH_URL` | `https://YOUR-VERCEL-URL.vercel.app` (update after Step 2) |
   | `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
   | SMTP, Stripe, Twilio, Flutterwave, VAPID keys | As needed |

4. On **each cron service**, set `MARKAY_API_URL` to your Render API URL, e.g. `https://markay-hall-api.onrender.com` (no trailing slash).

5. **Seed the database** (once): Render shell on `markay-hall-api`:

   ```bash
   npm run db:seed
   # Or update only production login accounts:
   npm run users:production
   ```

6. Ensure **NEXTAUTH_SECRET** / **AUTH_SECRET** are identical on Vercel and Render, and **NEXTAUTH_URL** matches your Vercel domain exactly.

7. **Bootstrap production logins** (once after deploy):

   ```bash
   curl "https://YOUR-VERCEL-URL/api/system/bootstrap-users?secret=YOUR_CRON_SECRET"
   ```

   Or on Render shell: `npm run users:production`

### Option B: Manual web service

1. **New → PostgreSQL** → note the **Internal** and **External** connection strings.
2. **New → Web Service** → connect repo:
   - **Build:** `npm run build:render`
   - **Start:** `npm run start`
   - **Health check:** `/api/config/public`
3. Add env var `DATABASE_URL` from the Postgres instance.
4. Add a **persistent disk** mounted at `/opt/render/project/src/public/uploads` (1 GB) for image uploads.

---

## Step 2 — Deploy frontend on Vercel

1. [vercel.com/new](https://vercel.com/new) → import the same repo.
2. Framework preset: **Next.js** (uses [`vercel.json`](./vercel.json)).
3. Set **Environment variables** (Production):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | Render Postgres **External** URL (Vercel needs external, not internal) |
   | `NEXTAUTH_SECRET` | Same value as on Render |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |
   | `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
   | `RENDER_BACKEND_URL` | `https://markay-hall-api.onrender.com` (**required** for uploads) |
   | `NEXT_PUBLIC_UPLOAD_BASE_URL` | Same as `RENDER_BACKEND_URL` (optional; improves image URLs in emails) |
   | `CRON_SECRET` | Same as on Render (also signs upload tokens) |
   | Payment / SMS / SMTP / VAPID vars | Mirror Render |

4. Deploy.

5. **Enable auto-deploy from GitHub** (required for pushes to update the live site):
   - Vercel → your project → **Settings → Git**
   - Connect **`prinstinegroupofcompanies/e_commerce_app`** on branch **`main`**
   - If the project was created via CLI without Git, use **Connect Git Repository** or re-import the repo
   - After connecting, open **Deployments → Redeploy** on the latest commit

   **Alternative (CI):** add GitHub Actions secrets (repo → Settings → Secrets → Actions):
   - `VERCEL_TOKEN` — [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` — from `.vercel/project.json` after `npx vercel link`, or Vercel project Settings → General

   The workflow [`.github/workflows/vercel-production.yml`](./.github/workflows/vercel-production.yml) deploys on every push to `main` when those secrets are set.

6. Go back to Render **markay-hall-api** and update `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL` to your final Vercel URL (or custom domain).

---

## Step 3 — Custom domain (optional)

1. **Vercel:** add your domain → set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL.
2. **Render:** update the same two vars on `markay-hall-api`.

---

## Step 4 — Webhooks and third-party callbacks

Point external services at the **Render API** URL:

| Service | Endpoint |
|---------|----------|
| Stripe | `https://markay-hall-api.onrender.com/api/payments/webhook` |
| Flutterwave | `https://markay-hall-api.onrender.com/api/payments/flutterwave/webhook` |

Payment return pages load on Vercel; verification API calls are proxied to Render.

---

## Local development

Unchanged — SQLite via `DATABASE_URL="file:./dev.db"`. Do **not** set `RENDER_BACKEND_URL` locally.

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth cookies not sticking | `NEXTAUTH_URL` must exactly match the browser URL (scheme + host, no trailing slash). |
| Auth login fails on Vercel | Set `AUTH_SECRET` and `NEXTAUTH_SECRET` to the same value. Run bootstrap-users endpoint. Auth runs on Vercel, not Render. |
| API 502 from Vercel | Render service may be restarting after deploy; check Render logs. |
| Uploads 404 on Vercel | Set `RENDER_BACKEND_URL` on Vercel (uploads are proxied to Render disk). Re-upload images after fixing env. |
| Upload 502 on Vercel | Fixed: browser uploads go direct to Render via `/api/upload/token`. Ensure `CRON_SECRET` matches on Vercel and Render. |
| Upload too large | Max 15MB per image; use direct Render upload (automatic in production). |
| Prisma errors on Vercel build | `DATABASE_URL` must be Postgres **external** URL. |
| Cron unauthorized | `CRON_SECRET` must match on Render API and cron services. |

---

## Demo logins (after seed or `npm run users:production`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@markayhall.com` | `Admin@MarkayHall` |
| Seller | `seller@markayhall.com` | `Seller@2026` |
| Customer | `customer@markayhall.com` | `Customer@2026` |
