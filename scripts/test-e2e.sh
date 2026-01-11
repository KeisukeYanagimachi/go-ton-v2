#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

base_url="${E2E_BASE_URL:-http://app:3000}"

cleanup() {
  schema=$(printf '%s' "$DATABASE_URL" | sed -n 's/.*schema=\\([^&]*\\).*/\\1/p')
  if [ -z "$schema" ]; then
    schema="public"
  fi
  printf 'DROP SCHEMA IF EXISTS \"%s\" CASCADE; CREATE SCHEMA \"%s\";\\n' "$schema" "$schema" \
    | npx prisma db execute --stdin >/dev/null 2>&1 || true
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
