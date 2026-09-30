# 🚀 Sasta Room — Launch Checklist

This is the shortest path from this repository to a live site with a working
owner → admin → customer loop. Everything below has been verified end-to-end
against a real MySQL database by the API smoke test
(`backend/scripts/smoke.mjs`, 44 checks) and by a Playwright test that drives
the real Angular build through the same loop in Chromium (`e2e/ui-flow.mjs`).

---

## 0. Do this first: rotate the leaked credentials (5 minutes)

`backend/.env` was committed to this **public** repository, so the TiDB
password and JWT secret in git history are public. The file is no longer
tracked, but the old values must be treated as compromised.

1. **TiDB Cloud** → your cluster → *Connect* → *Reset password* (or create a
   new SQL user and delete `Ta9NR1DeSSNRNyM.root`).
2. Generate a new JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. Never paste these into any file inside the repo; they go into Vercel and
   GitHub Secrets (below).

---

## 1. Deploy on Vercel (10 minutes, one project)

The repo is set up as **one Vercel project**: the Angular app is served as
static files and the Express API runs as a serverless function at `/api/*`.
Same domain, no CORS, one set of environment variables.

1. Go to <https://vercel.com/new> → *Import Git Repository* → pick
   `Rupangshudutta/Sasta_Roomrent`.
2. **Root Directory**: leave as the repository root (do *not* pick
   `frontend` or `backend`). Framework preset: *Other*. Build settings are
   read from `vercel.json`; do not override them.
3. **Environment Variables** (Production):

   | Name | Value |
   |------|-------|
   | `NODE_ENV` | `production` (safe: the install step always includes build tooling) |
   | `DB_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
   | `DB_PORT` | `4000` |
   | `DB_NAME` | `sasta_room` |
   | `DB_USER` | your (new) TiDB user |
   | `DB_PASSWORD` | your (new) TiDB password |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | the new random string |
   | `ADMIN_EMAIL` | the email you will log in with as admin |
   | `ADMIN_PASSWORD` | at least 8 characters |
   | `NOTIFY_EMAIL` | where new-lead emails should go (defaults to `ADMIN_EMAIL`) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | *optional* — see §4 |

4. Click **Deploy**. The build compiles the API, runs the database migration
   (creates tables, help articles and your admin login), then builds the
   Angular app. First build takes ~3–4 minutes.
5. Open the deployment URL, e.g. `https://sasta-roomrent.vercel.app`:
   - `/api/health` must return `"success": true` with `"db": {"ok": true}`
     and `"missingConfig": []`.
   - Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → Admin Panel.

Every push to `main` now redeploys automatically. Pushes to other branches
get preview URLs.

> If the site shows `"db": {"ok": false}`, the DB credentials are wrong or
> TiDB is rejecting the connection. Fix the variables and *Redeploy*.

---

## 2. Wire up GitHub so the repo can look after itself (5 minutes)

Three workflows live in `.github/workflows/`:

| Workflow | When | What it does |
|----------|------|--------------|
| **CI** | every push / PR | builds both apps, boots a MySQL, runs migration twice, runs the API smoke test and the Playwright browser flow |
| **Database migrate (production)** | manual | runs the migration against the real database; can also seed 6 demo listings or clean up smoke-test data |
| **Smoke test (live site)** | manual + after each successful Vercel production deploy | runs the 44-check API loop against the live URL |

Set these in GitHub → *Settings* → *Secrets and variables* → *Actions*:

- **Secrets**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD` (same values as Vercel).
- **Variable**: `SITE_URL` = your Vercel URL (e.g. `https://sasta-roomrent.vercel.app`).

Then run **Database migrate (production)** once from the *Actions* tab
(tick *seed_demo* if you want the homepage to show six sample rooms on day
one), and **Smoke test (live site)** to prove the whole loop on production.

> The smoke test leaves three `smoke+…@sastaroom.local` accounts behind.
> Run *Database migrate* with *cleanup_smoke* ticked to remove them.

---

## 3. Custom domain (optional, 10 minutes + DNS wait)

Vercel project → *Settings* → *Domains* → add `sastaroomrent.com` and
`www.sastaroomrent.com`. Vercel shows the DNS records to add at your
registrar (typically an `A` record to `76.76.21.21` and a `CNAME` for `www`
to `cname.vercel-dns.com`). HTTPS is automatic. Nothing in the code needs to
change: the app uses relative `/api` URLs.

---

## 4. Email notifications (optional but recommended before day 1)

Without SMTP the site works fully, but you must open the Admin Panel to see
new booking requests and contact messages. With SMTP:

- owners get an email for every booking request (with the tenant's phone),
- tenants get an email when the owner accepts (with the owner's phone),
- `NOTIFY_EMAIL` gets every contact-form message and booking request.

Gmail: enable 2-step verification → create an *App password* → set
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@gmail.com`,
`SMTP_PASS=<app password>`, `SMTP_FROM=you@gmail.com`. Redeploy.

---

## 5. Day-1 playbook: getting the first customer

The product loop that now works end to end:

```
Owner registers → lists a room (photos resize automatically)
      ↓
Admin (you) approves it in the Admin Panel  ← check this at least twice a day
      ↓
Tenant registers → "Reserve This Room" → sends request (owner sees tenant's phone/email)
      ↓
Owner clicks Accept in Owner Dashboard → tenant sees owner's phone/email
      ↓
They talk, visit, and close the deal directly. No payment is taken on the site.
```

1. **Stock the shelf.** An empty homepage converts nobody. Either run the
   migration workflow with *seed_demo* (six sample rooms, marked as owned by
   `demo-owner@sastaroom.local`; delete them from the Admin Panel once real
   rooms exist) or, better, sit with 3–5 real owners and list their rooms
   yourself from an owner account.
2. **Be the admin.** Open `/dashboard/admin` morning and evening; approve
   listings and read contact messages. Everything a customer sends lands
   there even if email is not configured.
3. **Share the link** in local student / job-seeker WhatsApp groups and
   Facebook groups for the cities you have rooms in. The listing pages
   have proper titles and descriptions for sharing.
4. **When the first request arrives**, call the tenant *and* the owner.
   Confirm the request from the owner's account if the owner is slow.

---

## 6. What is deliberately not in v1 (and what to do instead)

| Missing | Workaround for now | Notes |
|---------|--------------------|-------|
| Online payment (Razorpay) | Rent/deposit paid directly to owner after visit | Schema already has a `payments` table |
| Password reset | Admin can re-run the migration with a new `ADMIN_PASSWORD`; for users, contact form | Needs SMTP first |
| Email verification / OTP | Manual vetting by admin | |
| Editing a listing after submit | Owner contacts admin | `PUT /api/properties/:id` exists, no UI yet |
| Reviews UI | API exists (`/api/reviews`), no frontend | |
| Google Maps | Address text only | |

Photos are stored in the database (each resized to ≤1600px, ~150–400 KB).
TiDB Serverless free tier is 5 GiB, comfortably thousands of photos. Move to
S3/Cloudinary by replacing `backend/src/services/image.service.ts` when
needed.

---

## 7. Running locally

```bash
# database: any MySQL 8 / MariaDB; TiDB Cloud also works (DB_SSL=true)
cd backend && cp .env.example .env   # fill in DB_*, JWT_SECRET, ADMIN_*
npm ci && npm run build && npm run migrate && npm start     # API on :3000

cd ../frontend && npm ci && npm start                        # app on :4200

# full end-to-end check against the local API
BASE_URL=http://localhost:3000 SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run smoke --prefix backend
```

Useful commands (in `backend/`): `npm run seed:demo`, `npm run cleanup:smoke`.

Hostinger instead of Vercel: see `hostinger-deploy/DEPLOY.md`.
