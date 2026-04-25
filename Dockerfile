# syntax=docker/dockerfile:1.7

############################
# 1. Dependencies
############################
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

############################
# 2. Builder
############################
FROM node:alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client then build Next.js
RUN npx --no-install prisma generate
RUN npm run build

############################
# 3. Runtime
############################
FROM node:alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl bash curl
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + seed + full node_modules (needed for prisma CLI + tsx + bcryptjs)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/shared/lib/database-url.ts ./src/shared/lib/database-url.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
