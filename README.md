# LocalMarket-Platform (EthioLocal)

Monorepo for **EthioLocal**: a local-marketplace stack with buyers, sellers, delivery partners, and admins. The **API** is Express + Prisma (PostgreSQL). The **web** app is **Next.js 15** (App Router) with the public marketing site, storefront, auth flows, and role-based dashboards (shadcn/ui).

| Package | Role | Default URL / how to run |
|--------|------|---------------------------|
| **`api/`** | REST API (`/api/v1`, also mounted at `/` for legacy paths) | [http://localhost:4000](http://localhost:4000) |
| **`web/`** | Next.js UI (marketing, shop, dashboards) | [http://localhost:3000](http://localhost:3000) |
| **`ethiolocal/`** | **Flutter** mobile client — talks to the API only (not the Next server) | API base defaults to `http://localhost:4000/api/v1` via `ApiConfig` (`ethiolocal/lib/core/config/api_config.dart`). On a **physical device** or **Android emulator**, use a reachable host (e.g. `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1` for emulator → your PC). **iOS Simulator** can use `http://localhost:4000/api/v1`. Run: `cd ethiolocal && flutter run`. |

In development, **`web/next.config.ts`** rewrites `/api/*` → `http://localhost:4000/api/*`, so the browser calls same-origin `/api/v1/...` without CORS setup. The **mobile app** does not use that rewrite; it must point **`API_BASE_URL`** at the machine where the API is listening.

---

## Prerequisites

- **Node.js** (LTS recommended)
- **PostgreSQL** database the API can reach
- Optional: **Redis** (caching), **Cloudinary** (image and partner proposal uploads in production-like setups)

---

## Quick start

1. **Database** — create a database and note the connection string.

2. **API environment** — in `api/`, create `.env` (see [API environment variables](#api-environment-variables) below). At minimum you need `DATABASE_URL` and `JWT_SECRET` (at least 32 characters).

3. **Migrations**

   ```bash
   cd api
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

   Optional seed (if configured in your repo):

   ```bash
   npm run db:seed
   ```

4. **Run the API**

   ```bash
   cd api
   npm run dev
   ```

5. **Run the web app**

   ```bash
   cd web
   npm install
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) — the home page is the **marketing / landing** experience. Signed-in users are routed by role (buyer → shop, seller/delivery/admin → their workspace).

---

## API environment variables

Defined and validated in `api/src/config/env.ts`. Common entries:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `PORT` | No | Default `4000` |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `ACCESS_TOKEN_EXPIRES_IN` | No | e.g. `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | No | e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Product images and partner proposals when set |
| `CLOUDINARY_UPLOAD_FOLDER` | No | Default `localmarket/products` |
| `API_PUBLIC_URL` | No | Public base URL for the API (no trailing slash); default `http://localhost:4000` — used for locally stored partner proposal URLs |
| `ALLOW_LOCAL_PARTNER_PROPOSAL_UPLOAD` | No | Set to `1` to allow on-disk proposal storage when Cloudinary is unset (also automatic in development/test in code paths) |
| `PASSWORD_RESET_RETURN_TOKEN` | No | Set to `1` only in dev/QA so `POST /auth/forgot-password` returns a `resetToken` in JSON — **never** on a public production API |
| `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` | No | Default `60` |
| `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` | No | Assistant features under `/assistant/*` |
| `REDIS_URL` | No | Optional caching |
| `TRUST_PROXY` | No | `1` when behind a reverse proxy (rate limiting) |

After changing env, restart the API process.

---

## Web deployment note

If the Next app and API are on **different origins**, set **`NEXT_PUBLIC_API_ORIGIN`** to the API base (no trailing slash). The axios client in `web/src/lib/axios-instance.ts` prefixes `/api/v1` with that origin when set.

---

## Authentication (web + API)

- **Sign in:** [http://localhost:3000/login](http://localhost:3000/login) — use **phone or email** plus password (`POST /api/v1/auth/login` with `{ identifier, password }`).
- **Register (buyer):** [http://localhost:3000/register/buyer](http://localhost:3000/register/buyer) — name, **email**, phone, password (`POST /api/v1/auth/register`).
- **Register (seller / delivery):** [http://localhost:3000/register/seller](http://localhost:3000/register/seller) and [http://localhost:3000/register/delivery](http://localhost:3000/register/delivery) — multipart `POST /api/v1/auth/register-partner` (proposal file, Cloudinary or local dev storage).
- **Forgot / reset password:** [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password) and [http://localhost:3000/reset-password?token=…](http://localhost:3000/reset-password) — `POST /auth/forgot-password`, `POST /auth/reset-password`.

Tokens are stored in **localStorage**; the client sends `Authorization: Bearer <accessToken>`.

**Seller / delivery approval:** Self-registered sellers and delivery agents wait for admin approval. Until then they use **`/seller/pending-approval`** or **`/delivery/pending-approval`** (standalone-style page with marketing sections; no sidebar). After approval, the workspace dashboard is available.

**Generic `/register`** redirects to **`/register/buyer`**.

---

## Useful API checks

- Health: `GET http://localhost:4000/api/v1/health`
- Feature checklist: `GET http://localhost:4000/api/v1/meta/checklist`

---

## Scripts

**API** (`api/package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | `tsx watch` API server |
| `npm run build` / `npm start` | Production build and run |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:deploy` | `prisma migrate deploy` |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run test` | Unit + integration tests (integration needs DB) |

**Web** (`web/package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and run |
| `npm run lint` | ESLint |

---

## Repository layout (high level)

```
api/          Express app, Prisma schema & migrations, Vitest
web/          Next.js App Router, dashboards, shop, marketing
ethiolocal/   Optional Flutter client (paths may lag the web API)
```

---

## Security

- Do **not** commit real `.env` files or API keys. Rotate any key that has appeared in a commit or public issue.
- Keep `PASSWORD_RESET_RETURN_TOKEN` off in production unless you fully control who can reach the API.
