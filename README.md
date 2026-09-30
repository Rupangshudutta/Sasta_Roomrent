# Sasta Room — long-term room rental marketplace

Broker-free PGs, shared rooms, single rooms and flats for long-term stays in
India. Owners list rooms, an admin approves them, tenants send booking
requests, owners accept and the two sides connect directly.

**Deploying or launching? Read [`LAUNCH.md`](LAUNCH.md).**

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 17 (standalone components, signals), Bootstrap 5 |
| API | Node 18+, Express 4, TypeScript, `mysql2`, JWT auth, `bcryptjs`, `sharp` for photo resizing |
| Database | MySQL 8 / MariaDB / TiDB Cloud Serverless (schema in `backend/sql/schema.sql`) |
| Hosting | Vercel (one project: static app + `/api` serverless function). Hostinger guide in `hostinger-deploy/` |
| CI | GitHub Actions: build, MySQL-backed API smoke test, Playwright browser flow, production migration, live-site smoke test |

## Repository layout

```
api/index.js              Vercel serverless entry → backend/dist/app
backend/
  src/app.ts              Express app (helmet, CORS, rate limits, routes, /api/health)
  src/config/env.ts       Typed environment + missing-config report
  src/config/database.ts  mysql2 pool with stale-connection retry
  src/routes/             auth, properties, bookings, reviews, dashboard, inquiries, contact, help, images
  src/services/           business logic (property, booking, auth, image storage, mailer)
  src/db/migrate.ts       idempotent migration + seeds (help articles, admin user)
  sql/schema.sql          CREATE TABLE IF NOT EXISTS for every table
  scripts/smoke.mjs       API smoke test (owner → admin → customer loop, 44 checks)
e2e/
  ui-flow.mjs             Playwright test driving the real Angular build through the same loop
  spa-server.js           tiny static + /api proxy server that mimics Vercel locally
frontend/
  src/app/features/       pages (home, properties, auth, dashboards, list-property, help, …)
  src/app/core/           services, guards, interceptors, utils (client-side image compression)
vercel.json               install/build/rewrites for the single-project deploy
.github/workflows/        ci.yml, db-migrate.yml, smoke.yml
```

## Local development

```bash
cd backend && cp .env.example .env      # set DB_*, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm ci && npm run build && npm run migrate && npm start   # http://localhost:3000/api/health
cd ../frontend && npm ci && npm start                      # http://localhost:4200
```

End-to-end checks:

```bash
# API loop (any base URL)
BASE_URL=http://localhost:3000 SMOKE_ADMIN_EMAIL=… SMOKE_ADMIN_PASSWORD=… npm run smoke --prefix backend
# Browser loop against the production bundle (API on :3000)
npm run build --prefix frontend && npm ci --prefix e2e && (cd e2e && npx playwright install chromium)
node e2e/spa-server.js frontend/dist/sasta-room-frontend/browser 4300 &
UI_ADMIN_EMAIL=… UI_ADMIN_PASSWORD=… node e2e/ui-flow.mjs
```

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register` (`role`: `customer` \| `owner`), `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/change-password` |
| Properties | `GET /api/properties` (public, filters, active only), `GET /api/properties/:id`, `GET /api/properties/my` (owner), `GET /api/properties/pending` (admin), `POST /api/properties` (owner), `POST /api/properties/:id/images` (owner, multipart `images`, `is_primary`), `PATCH /api/properties/:id/status` (admin), `PUT`/`DELETE /api/properties/:id`, `POST /api/properties/:id/toggle-favorite`, `GET /api/properties/favorites` |
| Images | `GET /api/images/:id` (stored photos, cached one year) |
| Bookings | `GET /api/bookings` (role-aware), `POST /api/bookings` (customer), `GET`/`PUT`/`DELETE /api/bookings/:id` (owner/admin set `status`: confirmed/cancelled/active/completed) |
| Contact | `POST /api/contact` (public, stored + emailed), `GET /api/contact` (admin), `PATCH /api/contact/:id/read` |
| Other | `/api/reviews`, `/api/inquiries`, `/api/dashboard/{admin,owner,customer}`, `/api/help/*`, `/api/health` |

Responses are `{ success, message, data?, errors? }`. Validation failures return `422` with field-level `errors`.

## Security notes

- Secrets live only in environment variables; `.env` is git-ignored.
- `trust proxy` is on, so rate limits are per real client IP behind Vercel/Hostinger (600 req / 15 min general, 30 / 15 min on login and register).
- Owners can only read/modify bookings on their own listings; customers cannot change booking status; owner contact details are shared with a tenant only after the owner accepts.

## License

MIT
