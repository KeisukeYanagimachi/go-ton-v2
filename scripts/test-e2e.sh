#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

base_url="${E2E_BASE_URL:-http://app:3000}"
db_url="${DATABASE_URL%/}"
db_name="${db_url##*/}"
db_name="${db_name%%\\?*}"
if [ "$db_name" != "go-ton-e2e" ]; then
  echo "E2E tests require database go-ton-e2e (got ${db_name})."
  exit 1
fi

cleanup() {
  npx prisma migrate reset --force --skip-seed >/dev/null 2>&1 || true
}

trap cleanup EXIT

npm ci --force
npx prisma migrate reset --force
npx prisma generate
npx prisma db seed
curl -sS "${base_url}/candidate-login" >/dev/null
curl -sS "${base_url}/staff-dev-login" >/dev/null
curl -sS "${base_url}/start" >/dev/null
curl -sS "${base_url}/exam" >/dev/null
curl -sS "${base_url}/attempts" >/dev/null
curl -sS "${base_url}/staff/tickets/reissue" >/dev/null
npx playwright test
