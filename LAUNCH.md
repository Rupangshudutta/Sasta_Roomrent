# Sasta Room — launch guide

Everything an operator needs to take `Rupangshu-Dev` to production and run day one.
Secrets are never written here or in chat: they go straight into GitHub and Netlify.

## 1. Environment matrix

| Variable                                 | Netlify                                | GitHub Actions                     | Purpose                                                                                |
| ---------------------------------------- | -------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                   | ✅ `https://sastaroomrent.netlify.app` | ✅                                 | Absolute URLs in emails, sitemap, auth redirects                                       |
| `NEXT_PUBLIC_SUPABASE_URL`               | ✅                                     | ✅                                 | Supabase project URL                                                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | ✅                                     | ✅                                 | Anon key; safe in the browser, RLS applies                                             |
| `SUPABASE_SECRET_KEY`                    | ✅ secret                              | —                                  | Service role, only in `lib/supabase/admin.ts` (webhook, payments, admin RPC fallbacks) |
| `SUPABASE_ACCESS_TOKEN`                  | —                                      | ✅ secret                          | `supabase link` in `db-migrate.yml`                                                    |
| `SUPABASE_DB_PASSWORD`                   | —                                      | ✅ secret                          | `supabase db push`                                                                     |
| `SUPABASE_PROJECT_REF`                   | —                                      | ✅ variable `zwnfcvpqxdnvdqrdihed` | Target project                                                                         |
| `PAYMENTS_ENABLED`                       | ✅ `false` until KYC                   | —                                  | Master switch for the booking-token flow                                               |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | ✅ secret                              | —                                  | Order creation + checkout signature                                                    |
| `RAZORPAY_WEBHOOK_SECRET`                | ✅ secret                              | —                                  | Webhook HMAC                                                                           |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`            | ✅                                     | —                                  | Same key id, used by Checkout.js                                                       |
| `RESEND_API_KEY`, `EMAIL_FROM`           | ✅ secret / value                      | —                                  | Transactional email (best-effort; app works without)                                   |
| `NOTIFY_EMAIL`                           | ✅                                     | —                                  | Where contact-form enquiries go (falls back to `platform_settings.support_email`)      |
| `SITE_URL`                               | —                                      | variable (optional)                | Overrides the smoke-test target                                                        |
| `NETLIFY_NEXT_SKEW_PROTECTION`           | ✅ `true` (set 2026-10-24)             | —                                  | Routes Server Actions from a tab opened before a deploy to the deploy that rendered it |

`/api/health` lists which capability is missing which variable by **name**, never value.

## 2. One-time setup checklist

1. **Supabase Auth → URL configuration**: Site URL `https://sastaroomrent.netlify.app`; redirect URLs
   `https://sastaroomrent.netlify.app/auth/confirm`, `https://sastaroomrent.netlify.app/auth/callback`,
   and `https://*--sastaroomrent.netlify.app/auth/**` for deploy previews.
   **Turn email confirmation off (product decision, 2026-10-24)**: Authentication → Sign In / Providers →
   Email → turn off "Confirm email". Sign-up then returns a session and `registerAction` sends the
   user straight to their dashboard; no email is sent. Trade-off: an address is never proven to belong
   to the person who typed it. If it is ever switched back on, Supabase's built-in sender only
   delivers to members of the project's team (a few per hour) and rolls the sign-up back when the
   email cannot be sent (log event `auth.register confirmation_email_failed`), so custom SMTP comes first.
   **Custom SMTP is still needed for password reset** to reach ordinary users: Authentication → Emails →
   SMTP Settings (e.g. Resend: host `smtp.resend.com`, port 465, user `resend`, password = API key,
   sender on your verified domain). Optional: point the templates at
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (recovery:
   `type=recovery&next=/reset-password`) so links also work on another device; `/auth/confirm`
   accepts both that and the default link format.
2. **Migrations**: add the three GitHub secrets above, then run the `db-migrate` workflow
   (Actions → Database migrate → Run workflow). It applies `supabase/migrations/*` and the seed.
3. **Admin account**: register normally with the admin's email, then run
   `scripts/db/promote-admin.sh <email>` against the production database (needs the DB password locally).
   Sign-up can never choose the admin role.
4. **Razorpay** (when ready): create test-mode keys; add a webhook pointing at
   `https://sastaroomrent.netlify.app/api/payments/webhook` with events `payment.captured`,
   `payment.failed`, `refund.processed`; paste the webhook secret into Netlify. Flip `PAYMENTS_ENABLED=true`
   and redeploy. Test with Razorpay's test cards, then swap to live keys after KYC.
5. **Email**: verify your sending domain in Resend, set `EMAIL_FROM="Sasta Room <no-reply@yourdomain>"`.
   Until then emails are skipped and logged as `email.skipped`.
6. **Netlify functions region**: the Supabase project runs in Tokyo (`ap-northeast-1`). Netlify
   functions default to the US, which adds a trans-Pacific round trip to every database query
   on every page. In Netlify → Project configuration → Build & deploy → Functions region, pick
   the region closest to Tokyo your plan offers, then redeploy. This is the single biggest
   page-speed lever.
7. **Netlify**: production currently builds `Rupangshu-Dev` (checked 2026-10-23); `main` still holds
   the legacy app, so release it (section 3) before switching production to `main`. Build command and
   headers (HSTS, CSP, frame-ancestors) come from `netlify.toml`. The scheduled function
   `netlify/functions/keep-database-awake.mts` reads Supabase daily on the production deploy so the
   free-tier project is not paused for inactivity; delete it after moving to a paid plan.
8. **Cloudflare** (optional, custom domain): proxy on, SSL "Full (strict)", respect origin cache headers,
   add a page rule to bypass cache for `/api/*`, `/dashboard*`, `/owner*`, `/admin*`.

### Current state of the live database (2026-10-02)

- Migrations 0001-0018 applied and recorded in `supabase_migrations.schema_migrations`, so
  `db-migrate.yml` will only apply newer files.
- Admin account: `admin@sastaroomrent.netlify.app` (password handed over privately; change it
  after first sign-in from the admin profile). This mailbox does not receive mail, so add your
  own address as a second admin before relying on password reset.
- 56 sample listings with photos: see `supabase/demo/README.md`, removable with
  `scripts/db/remove-demo-data.sql`.
- 2026-10-22 18:07 → 2026-10-23 11:15 UTC: the free-tier project was paused for inactivity and every
  sign-in and sign-up failed until it was restored by hand. Nothing kept it busy: `smoke.yml` is not
  on the default branch (`main`), and GitHub only runs schedules from there. The keep-alive function
  (step 7) covers this now.
- 2026-10-23: the first form sign-up (a tenant) was created, but the built-in sender's confirmation
  email never arrived. 2026-10-24: decided to turn email confirmation off (step 1); that account was
  confirmed by hand. Accounts created while confirmation is on stay unconfirmed until confirmed the same way
  (`update auth.users set email_confirmed_at = now() where id = …`).
- Migration 0019 (owner experience from sign-up) applied 2026-10-23.

## 3. Release procedure

```
# on Rupangshu-Dev with CI green
git fetch origin && git checkout main && git merge --ff-only origin/Rupangshu-Dev && git push origin main
```

Netlify builds the production branch (step 7); the `Production smoke` workflow (Actions → run manually, or every 6 hours) probes
health, search, sitemap and security headers. A failing health check returns 503 and names the capability.

## 4. Rollback

- **Application**: Netlify → Deploys → pick the previous production deploy → "Publish deploy". Instant.
- **Database**: migrations are forward-only. Write a new migration that reverses the change; never edit an
  applied file. Data-destructive migrations must ship with the reversing migration prepared in the same PR.
- **Payments**: set `PAYMENTS_ENABLED=false` and redeploy. Existing `created` orders simply expire at Razorpay.

## 5. Day-one playbook

| Signal                                                                                       | Where                                              | Action                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status: degraded` from `/api/health`                                                        | smoke workflow / uptime monitor                    | Check the named capability's env var in Netlify, redeploy                                                                                              |
| `rate_limit.exceeded` log spikes                                                             | Netlify function logs (JSON lines, filter `event`) | Normal under attack; raise limits in `lib/security/rate-limit.ts` only if real users are hit                                                           |
| `payments.webhook invalid signature`                                                         | function logs                                      | Webhook secret mismatch between Razorpay and Netlify                                                                                                   |
| `email.failed`                                                                               | function logs                                      | Resend key/domain issue; user requests are unaffected                                                                                                  |
| `auth.register confirmation_email_failed`                                                    | function logs                                      | "Confirm email" is on and the email could not be sent, so no account was created: turn it off or set up custom SMTP (step 1)                           |
| `auth.login failed` / `auth.register failed` with `status` 0 or ≥ 500, or `keepalive.failed` | function logs                                      | Supabase is unreachable: check the project is not paused (Dashboard → Restore project) and status.supabase.com                                         |
| `auth.login profile_missing`                                                                 | function logs                                      | An auth user has no `profiles` row; check `handle_new_user()` and the profiles grants                                                                  |
| `Failed to find Server Action "…"` (POST 404, `UnrecognizedActionError` in the browser)      | function logs                                      | A tab opened before a deploy posted an action id the new build does not have; check `NETLIFY_NEXT_SKEW_PROTECTION=true` is still set, the user reloads |
| Listing stuck in `pending`                                                                   | `/admin/listings`                                  | Admin approves/rejects; owner is notified and emailed                                                                                                  |
| User locked out                                                                              | `/admin/users`                                     | Reactivate via the row action (audited)                                                                                                                |

Housekeeping: call `select public.purge_rate_limits();` weekly (Supabase cron or a scheduled workflow) to drop
stale counters.

## 6. Security posture (summary)

- Authorization in Postgres: RLS on every table, column-level update grants, SECURITY DEFINER RPCs that
  re-check `is_admin()`. Tested in `supabase/tests/*.sql` on every CI run.
- Service-role key only in `lib/supabase/admin.ts` behind `server-only`; CI scans the client bundle for secret values.
- Rate limits (Postgres fixed window, hashed IP or user id) on register, login, password reset, contact,
  booking requests and payment orders.
- Security headers via Netlify: HSTS preload, CSP (self + Razorpay), `frame-ancestors 'none'`, nosniff.
- Razorpay: checkout and webhook signatures verified with constant-time comparison; webhook idempotent on event id.
