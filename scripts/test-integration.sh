#!/bin/sh
set -eu

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  echo "TEST_DATABASE_URL is required."
  exit 1
fi

export DATABASE_URL="$TEST_DATABASE_URL"

cleanup() {
  schema=$(printf '%s' "$DATABASE_URL" | sed -n 's/.*schema=\\([^&]*\\).*/\\1/p')
  if [ -z "$schema" ]; then
    schema="public"
  fi
  printf 'DROP SCHEMA IF EXISTS \"%s\" CASCADE; CREATE SCHEMA \"%s\";\\n' "$schema" "$schema" \
    | npx prisma db execute --stdin >/dev/null 2>&1 || true
}

trap cleanup EXIT

npx prisma migrate reset --force
npx prisma generate
vitest run --config vitest.config.ts tests/integration
