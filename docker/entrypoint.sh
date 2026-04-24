#!/bin/sh
set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
node node_modules/prisma/build/index.js migrate deploy

echo "→ Running seed…"
node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "(seed skipped or failed, continuing)"

echo "→ Starting Next.js…"
exec "$@"
