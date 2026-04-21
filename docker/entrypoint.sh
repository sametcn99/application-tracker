#!/bin/sh
set -e

echo "→ Applying database schema (prisma db push)…"
node node_modules/prisma/build/index.js db push --url "$DATABASE_URL" --accept-data-loss

echo "→ Running seed…"
node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "(seed skipped or failed, continuing)"

echo "→ Starting Next.js…"
exec "$@"
