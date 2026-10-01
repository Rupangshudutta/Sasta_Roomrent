#!/usr/bin/env bash
# Promotes an existing, registered account to admin. Sign-up can never create an
# admin, so this is the only bootstrap path (run once per admin).
#
#   DATABASE_URL='postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres' \
#     scripts/db/promote-admin.sh founder@example.com
set -euo pipefail

email="${1:-}"
if [[ -z "$email" ]]; then
  echo "usage: $0 <email-of-registered-user>" >&2
  exit 2
fi
: "${DATABASE_URL:?DATABASE_URL is required}"

psql -v ON_ERROR_STOP=1 -X -q "$DATABASE_URL" -v email="$email" <<'SQL'
with target as (
  select id from public.profiles where email = :'email'::extensions.citext
)
update public.profiles p
   set role = 'admin'
  from target
 where p.id = target.id
returning p.id, p.email, p.role;
SQL

echo "If a row was printed above, $email is now an admin. If not, the user has not registered (or confirmed) yet."
