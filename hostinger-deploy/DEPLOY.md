# Hostinger Deployment Guide — Sasta Room Rent

> The primary, zero-ops deployment is Vercel (see `../LAUNCH.md`). Use this
> guide only if you specifically want to host on Hostinger's Node.js hosting.

## Overview
- **Frontend**: Angular 17 SPA → `public_html/`
- **Backend**: Node.js (Express) → Hostinger Node.js app, kept alive with PM2
- **Database**: MySQL (Hostinger) or TiDB Cloud (set `DB_SSL=true` for TiDB)

Photos are stored **inside the database** (`property_image_blobs`), so no
upload folder needs to be writable or backed up.

---

## Step 1: Database

1. hPanel → **Databases** → create `sasta_room` and a user with full rights.
2. Either import `backend/sql/schema.sql` in phpMyAdmin, **or** let the
   migration create the tables in Step 3 (recommended: it also creates the
   admin login and help articles).

## Step 2: Backend environment

Copy `backend/.env.example` to `backend/.env` and fill in at least:

```
NODE_ENV=production
DB_HOST=localhost          # Hostinger MySQL
DB_PORT=3306
DB_NAME=<db>
DB_USER=<user>
DB_PASSWORD=<password>
DB_SSL=false               # true for TiDB Cloud
JWT_SECRET=<long random string>
ADMIN_EMAIL=<your email>
ADMIN_PASSWORD=<min 8 chars>
PROD_FRONTEND_URL=https://sastaroomrent.com
```

## Step 3: Build, migrate, run the API

```bash
cd backend
npm ci
npm run build          # → backend/dist
npm run migrate        # creates tables + admin user, safe to re-run
npm install -g pm2
pm2 start ../hostinger-deploy/pm2.config.js
pm2 save && pm2 startup
```

Check: `curl http://localhost:3000/api/health` → `"success": true`.

## Step 4: Frontend

```bash
cd frontend
npm ci
npm run build          # → frontend/dist/sasta-room-frontend/browser/
```

Upload the contents of `frontend/dist/sasta-room-frontend/browser/` to
`public_html/`, plus `hostinger-deploy/.htaccess` (SPA fallback).

The app calls the API at the relative path `/api`, so the API must be reachable
on the same domain. In hPanel, add a reverse-proxy rule (or an `.htaccess`
`RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]`) that forwards
`/api/*` to the Node app.

## Step 5: Domain & SSL

hPanel → **Domains** → point `sastaroomrent.com` to `public_html/`, enable the
free SSL certificate and HTTPS redirect.

## Step 6: Verify

- `https://sastaroomrent.com` → app loads
- `https://sastaroomrent.com/api/health` → `{"success":true,...}`
- From the repo: `BASE_URL=https://sastaroomrent.com SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... node backend/scripts/smoke.mjs`
