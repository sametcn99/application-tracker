# End-to-end tests

By default `bun run test:e2e` manages its own infrastructure with Testcontainers.
It starts PostgreSQL and MinIO in Docker, runs Prisma schema sync and seed,
builds the app, and then starts the standalone Next.js server.

Requirements:

- Docker daemon available to the current user
- Playwright browser installed (`bun x playwright install --with-deps chromium`)

The managed bootstrap uses `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
(defaults: `admin@example.com` / `change-me`) for the login setup project.

Run locally:

```sh
bun x playwright install --with-deps chromium
bun run test:e2e
```

To debug interactively: `bun run test:e2e:ui`.

Useful overrides:

- `E2E_SKIP_BUILD=1` skips `next build` and reuses the existing standalone build.
- `E2E_NO_WEB_SERVER=1` disables the managed bootstrap if you want to provide your own app server and infrastructure.

The auth state is captured by `auth.setup.ts` and reused across all chromium specs.
