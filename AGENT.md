# Sasta Room — notes for AI agents and new contributors

Read `README.md` for the layout and `LAUNCH.md` for deployment. Key facts
that are easy to get wrong:

- **Monorepo, one Vercel project.** `vercel.json` at the root installs and
  builds both `backend/` and `frontend/`. `api/index.js` wraps
  `backend/dist/app.js` as the serverless function; `/api/*` is rewritten to
  it and everything else falls back to the Angular `index.html`.
- **The frontend calls the API at the relative path `/api`** in production
  (`frontend/src/environments/environment.prod.ts`, applied through
  `fileReplacements` in `angular.json`). Locally it uses
  `http://localhost:3000/api`.
- **No ORM.** The API uses `mysql2` with hand-written parameterised SQL in
  `backend/src/services/*`. The schema is `backend/sql/schema.sql`
  (idempotent) and is applied by `backend/src/db/migrate.ts`.
- **Photos are stored in the database** (`property_image_blobs`) and served
  from `GET /api/images/:id`. Nothing writes to the local filesystem, which
  is required on Vercel. `frontend/src/app/core/utils/image-compress.ts`
  shrinks photos in the browser before upload; the API resizes again with
  `sharp` (falls back to raw bytes if sharp is unavailable).
- **Roles** are `customer`, `owner`, `admin`. The API also accepts the legacy
  value `room_owner` and normalises it to `owner`.
- **Listing lifecycle:** created as `pending` → admin `PATCH
  /api/properties/:id/status` → `active` (public) or `inactive`.
- **Booking lifecycle:** customer creates `pending` → owner/admin `PUT
  /api/bookings/:id { status }` → `confirmed` (owner contact revealed to
  tenant) / `cancelled` / `active` / `completed`.
- **Config** is read once in `backend/src/config/env.ts`; `/api/health`
  reports DB reachability and any missing variables.
- **Email** (`backend/src/services/mailer.service.ts`) is optional and
  best-effort: never let a send failure fail a request.
- **Verification:** `backend/scripts/smoke.mjs` exercises the full product
  loop against any base URL, and `e2e/ui-flow.mjs` drives the real Angular
  build through the same loop in Chromium (it caught a CORS bug the API
  test could not: browsers send `Origin` on same-origin POSTs). CI runs
  both against a MySQL service on every push. Run them before changing API
  or page behaviour.
- **Angular version is 17.3**: no `@let`, no `output()` helpers, etc.
- Do not commit `.env`, `node_modules`, or `dist`.
