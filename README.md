# LocalMarket-Platform

- **`api/`** — Express + Prisma API (`npm run dev` in `api`, default port **4000**).
- **`web/`** — **Next.js 15** (App Router) admin / organizer dashboard: EthioLocal shell with sidebar + navbar ([shadcn/ui](https://ui.shadcn.com)). Run `npm run dev` in `web` (default **3000**). In dev, `next.config` rewrites `/api/*` → `http://localhost:4000/api/*` so the UI can call the API without CORS setup.

## Local development

1. Start API: `cd api && npm run dev`
2. Start dashboard: `cd web && npm run dev` → open [http://localhost:3000](http://localhost:3000) (redirects to `/dashboard`).

### Auth (dashboard)

- [http://localhost:3000/login](http://localhost:3000/login) — sign in (`POST /api/v1/auth/login`).
- [http://localhost:3000/register](http://localhost:3000/register) — register (`POST /api/v1/auth/register`).
- Access JWT and refresh token are stored in **localStorage** after success; the axios client attaches `Authorization: Bearer` for API calls.

Build order for the dashboard: Layout → Auth → Dashboard → Products → … (see project plan).
