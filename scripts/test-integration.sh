#!/bin/sh
set -eu

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  echo "TEST_DATABASE_URL is required."
  exit 1
fi

export DATABASE_URL="$TEST_DATABASE_URL"

db_name=$(printf '%s' "$DATABASE_URL" | sed -n 's#.*/\([^/?]*\).*#\1#p')
if [ "$db_name" != "go-ton-integration" ]; then
  echo "Integration tests require database go-ton-integration (got ${db_name})."
  exit 1
fi

cleanup() {
  npx prisma migrate reset --force --skip-seed >/dev/null 2>&1 || true
}

trap cleanup EXIT

npx prisma migrate reset --force
npx prisma generate
vitest run --config vitest.config.ts tests/integration
