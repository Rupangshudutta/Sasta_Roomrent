# Sasta Room — engineering conventions

Broker-free long-term room rental marketplace (India). Next.js 16 App Router + TypeScript +
Tailwind v4 + Supabase (Postgres/Auth/Storage, RLS) + Razorpay (feature-flagged) + Netlify.
The full plan lives in the approved rebuild plan; the hand-written prototype we port from is in
`docs/prototype/` (reference only, never served).

## Commands

- `npm run dev` — local dev (Turbopack). `npm run build` — production build (**webpack**, see below).
- `npm run check` — typecheck + lint + format check + unit tests. Run before every commit.
- `npm run test:e2e` — Playwright against a local `next start` (or `PLAYWRIGHT_BASE_URL=<deploy>`).
- `npm run db:types` — regenerate `types/database.types.ts` from the local Supabase schema.

## Non-negotiables

- **Authorization is enforced in Postgres (RLS, constraints, triggers, RPCs)** and re-checked in
  Server Actions. UI never decides access.
- Every write goes through a Server Action or Route Handler with a zod schema in
  `features/<domain>/schema.ts`. Return typed results `{ ok: true, data } | { ok: false, code, message, fieldErrors? }`;
  never throw raw errors to the client.
- The service-role key is used only in `lib/supabase/admin.ts` (`import "server-only"`).
  `NEXT_PUBLIC_*` is the only thing allowed in client code.
- No `any`, no `console.log` (use `console.warn/error` or the logger), `eqeqeq`.
- Config that was hard-coded in the prototype (cities, amenities, support phone, commission) lives in
  DB tables or `lib/config`, never in components.
- Money: `numeric(10,2)` INR. Time: `timestamptz`, displayed in `Asia/Kolkata`.
- Emails are best-effort: a failed email never fails the user's request.
- Never pin `@netlify/plugin-nextjs`. Production builds use `next build --webpack` because
  Next 16.3 + Turbopack + root `proxy.ts` breaks Netlify edge packaging (opennextjs-netlify#3575).

## Layout

```
app/            routes, layouts, route handlers (thin)
features/<d>/   actions.ts · queries.ts · schema.ts · components/
components/ui/  design-system primitives (tokens in app/globals.css @theme)
lib/supabase/   client.ts · server.ts · admin.ts   lib/config/  env.ts · server-env.ts
supabase/       migrations/*.sql · seed.sql        tests/e2e/   Playwright
types/          database.types.ts (generated)      docs/        prototype + ADRs
```

## Next.js 16 specifics

- `proxy.ts` replaced `middleware.ts` (Node runtime). `cookies()`, `headers()`, `params`,
  `searchParams` are async. Typed routes are OFF until launch hardening (re-enable once all routes exist).
- Read `node_modules/next/dist/docs/` before using an API you are not sure about.

## Git

- Work on `Rupangshu-Dev`; `main` is production. Conventional commit messages; explain the why.
- Never commit `.env*` except `.env.example`.
