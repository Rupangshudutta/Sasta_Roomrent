#!/usr/bin/env bash
# Fails when the client bundle (.next/static) contains strings that indicate a
# misconfiguration or a leaked secret:
#   - a localhost API/site URL baked into production assets
#   - a Supabase secret key value (sb_secret_<key>), Razorpay live secret, or Resend key
# Library code mentions prefixes like "sb_secret_" in warnings, so patterns match values,
# not bare prefixes.
set -euo pipefail

dir="${1:-.next/static}"
patterns=(
  'localhost:3000'
  '127\.0\.0\.1:3000'
  'sb_secret_[A-Za-z0-9_-]{20,}'
  'rzp_live_[A-Za-z0-9]{10,}'
  're_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}'
  'SUPABASE_SECRET_KEY='
)

status=0
for pattern in "${patterns[@]}"; do
  if matches=$(grep -rIlE --include='*.js' --include='*.css' -e "$pattern" "$dir" 2>/dev/null) && [[ -n "$matches" ]]; then
    echo "::error::Forbidden pattern '$pattern' found in client bundle:"
    echo "$matches"
    status=1
  fi
done

if [[ $status -eq 0 ]]; then
  echo "✓ client bundle scan clean ($dir)"
fi
exit $status
