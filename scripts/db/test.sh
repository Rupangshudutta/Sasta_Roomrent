#!/usr/bin/env bash
# Applies the Supabase shim (plain Postgres only), all migrations, the seed, and the
# SQL test suite in supabase/tests against a throwaway database.
#
# Usage:
#   scripts/db/test.sh                      # uses $DATABASE_URL or a local superuser connection
#   DATABASE_URL=postgres://... scripts/db/test.sh
#   SKIP_SHIM=1 scripts/db/test.sh          # when the target is a real Supabase database
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB_NAME="${TEST_DB_NAME:-sasta_room_test}"
ADMIN_URL="${DATABASE_URL:-postgresql://postgres@localhost:5432/postgres}"
BASE_URL="${ADMIN_URL%/*}"
TEST_URL="${BASE_URL}/${DB_NAME}"

PSQL=(psql -v ON_ERROR_STOP=1 -X -q -t -o /dev/null)

echo "▶ recreating ${DB_NAME}"
"${PSQL[@]}" "$ADMIN_URL" -c "drop database if exists ${DB_NAME} with (force);" >/dev/null
"${PSQL[@]}" "$ADMIN_URL" -c "create database ${DB_NAME};" >/dev/null

if [[ -z "${SKIP_SHIM:-}" ]]; then
  echo "▶ applying supabase shim"
  "${PSQL[@]}" "$TEST_URL" -f "$ROOT/scripts/db/supabase-shim.sql"
fi

for file in "$ROOT"/supabase/migrations/*.sql; do
  echo "▶ migration $(basename "$file")"
  "${PSQL[@]}" "$TEST_URL" -f "$file"
done

echo "▶ seed"
"${PSQL[@]}" "$TEST_URL" -f "$ROOT/supabase/seed.sql"

status=0
for file in "$ROOT"/supabase/tests/*.sql; do
  echo "▶ test $(basename "$file")"
  if ! "${PSQL[@]}" "$TEST_URL" -f "$file"; then
    status=1
    echo "✗ FAILED: $(basename "$file")"
  fi
done

if [[ $status -eq 0 ]]; then
  echo "✓ all database tests passed"
fi
exit $status
