# Application Tracker

A self-hosted, full-stack job application tracking system built with **Next.js 16 (App Router)**, **React 19**, **Radix Themes**, **Prisma 7 / PostgreSQL**, **Auth.js v5**, and **MinIO (S3-compatible)** storage. It is designed to run as a single `docker compose up` deployment for a single user (or a small private team) and to capture every meaningful detail of a job search — applications, companies, contacts, interviews, attachments, drafts, and a complete change-audit history.

> Status: actively developed. Schema is managed via `prisma db push` (no migration history yet). Single-locale (`en`) wired through `next-intl` with a JSON Schema-backed message catalog.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Repository Layout](#repository-layout)
5. [Quick Start (Docker Compose)](#quick-start-docker-compose)
6. [Local Development](#local-development)
7. [Environment Variables](#environment-variables)
8. [Database & Prisma Workflow](#database--prisma-workflow)
9. [Authentication](#authentication)
10. [File Storage (MinIO / S3)](#file-storage-minio--s3)
11. [Internationalization](#internationalization)
12. [Coding Standards & Tooling](#coding-standards--tooling)
13. [Domain Model](#domain-model)
14. [Server Actions & Data Layer](#server-actions--data-layer)
15. [Audit / Activity Log](#audit--activity-log)
16. [Common Operations](#common-operations)
17. [Troubleshooting](#troubleshooting)
18. [License](#license)

---

## Feature Overview

- **Applications** — full lifecycle tracking: position, company, salary range (min/max + target), currency with USD conversion, source / source type, referral, work mode, employment type, priority, status, outcome reason, contact information, work-authorization context, application package (resume / cover letter / portfolio), next-step scheduling, and free-form Markdown notes.
- **Companies** — first-class entity with ~50 fields organized into **Identity / Location / Online Presence / Business & Financials / Tech & Culture / Primary Contact / Personal Tracking / Notes**. Companies can be linked to applications and accumulate their own activity history.
- **Drafts** — auto-saved per-user drafts for both create and edit flows of applications, with stale detection against `baseApplicationUpdatedAt` and an unsaved-changes guard at the route level.
- **Attachments** — uploaded to MinIO (S3-compatible), size-capped via `UPLOAD_MAX_BYTES`, served through a server route that proxies signed/owned access.
- **Activity Feed** — every field change, status change, comment, attachment add/remove, and link/unlink event is recorded as a typed `ActivityEntry` (per application) or `CompanyActivityEntry` (per company), with old/new values stored as JSON-encoded strings for round-trip rendering.
- **Reference Data** — user-managed lists for Tags, Sources, and Currencies (the latter with manual or API-sourced USD rate).
- **Filtering & Sorting** — typed filter parser shared between server components and the URL, supporting status, priority, work mode, source type, company size, application method, relocation preference, sponsorship, next action, outcome reason, tag, full-text search, date range, sort field/order.
- **i18n** — every UI string flows through `next-intl` and is validated against [messages/messages.schema.json](messages/messages.schema.json).
- **Single-user auth** — credentials provider with bcrypt; the seed script provisions the admin user on first boot.

---

## Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (RSC + RCC)                        │
│  Radix Themes UI · React Hook Form · Zustand (UI) · next-intl      │
└──────────────▲────────────────────────────────────▲────────────────┘
               │ Server Actions / RSC fetch         │ Auth.js cookies
               │                                    │
┌──────────────┴────────────────────────────────────┴────────────────┐
│                Next.js 16 App Router (Node runtime)                │
│  /app/(app)/*  domain pages    /app/api/*  REST endpoints          │
│  src/shared/lib/*  data layer (Prisma)   src/shared/actions/*      │
│  Auth.js v5 (Credentials + Prisma adapter)                         │
└──────────▲──────────────────────▲──────────────────────▲───────────┘
           │ SQL                  │ S3                   │ Auth
   ┌───────┴───────┐      ┌───────┴────────┐      ┌──────┴──────┐
   │  PostgreSQL   │      │  MinIO (S3)    │      │  bcryptjs   │
   │  + Prisma 7   │      │  attachments   │      │             │
   └───────────────┘      └────────────────┘      └─────────────┘
```

- **Rendering** — predominantly **React Server Components**. Client islands are scoped to forms, dialogs, and interactive widgets and live next to the route under `components/`.
- **Mutations** — exclusively through **Server Actions** (`"use server"`), validated with **Zod 4** before they reach the data layer. Only the `/api/auth/*` and `/api/attachments/[id]` routes use the REST handler API.
- **Data layer** — `src/shared/lib/*` exports server-only helpers that wrap the Prisma client. Route-scoped action files (`src/app/(app)/<feature>/actions/*.ts`) parse input, call the data layer, and trigger `revalidatePath` on the affected paths.
- **Audit** — `src/shared/lib/audit.ts` and `src/shared/lib/company-audit.ts` diff the previous and next entity using a `TRACKED_FIELDS` allow-list, then emit one `*ActivityEntry` row per changed field with JSON-encoded old/new values.

---

## Tech Stack

| Layer            | Choice                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | Next.js **16.2.4** (App Router, RSC, Server Actions)                   |
| UI runtime       | React **19.2.4** + React DOM 19                                        |
| Component system | Radix Themes **3.3** + Radix Icons                                     |
| Forms            | React Hook Form **7** + `@hookform/resolvers` + Zod **4**              |
| Client state     | Zustand **5** (limited to UI/draft state)                              |
| i18n             | next-intl **4.9** (single locale, JSON-Schema validated catalog)       |
| ORM              | Prisma **7.7** with `@prisma/adapter-pg` over `pg.Pool`                |
| Database         | PostgreSQL **16** (alpine in compose)                                  |
| Auth             | Auth.js (NextAuth) **v5 beta** + Prisma Adapter + bcryptjs credentials |
| Storage          | MinIO (S3 API) via `@aws-sdk/client-s3` v3                             |
| Markdown         | react-markdown + remark-gfm                                            |
| Lint / format    | Biome **2.4** (tabs, double quotes — see `biome.json`)                 |
| Container build  | Multi-stage Dockerfile (Bun deps → Node 22 builder → Node 22 runner)   |

---

## Repository Layout

```text
src/
  auth.ts                       # Auth.js v5 configuration
  proxy.ts                      # (Optional) HTTP proxy plumbing
  app/
    layout.tsx                  # Root layout (themes, providers, intl)
    (app)/                      # Authenticated app shell
      page.tsx                  # Dashboard
      activity/                 # Global activity feed
      applications/             # CRUD + detail (tabs: details/activity/attachments)
      companies/                # CRUD + detail (overview/applications/activity)
      currencies/ sources/ tags/  # Reference-data managers
    api/
      attachments/[id]/route.ts # Authenticated attachment download
      auth/[...nextauth]/route.ts
    login/                      # Credentials login page
  i18n/                         # next-intl request config + types
  shared/
    actions/                    # Cross-feature server actions
    components/                 # AppShell, Header, Sidebar, dialogs
    constants/                  # Domain enums (status, work mode, …)
    lib/                        # Server-only data layer (Prisma)
    schemas/                    # Zod schemas reused across features
  types/next-auth.d.ts          # Module augmentation for Auth.js
prisma/
  schema.prisma                 # Single source of truth (db push)
  seed.ts                       # Idempotent seed (admin + reference data)
docker/
  entrypoint.sh                 # Runtime: db push → seed → next start
messages/
  en.json                       # Locale catalog
  messages.schema.json          # JSON Schema enforcing the catalog shape
docker-compose.yml              # postgres + minio + minio-init + app
Dockerfile                      # Multi-stage build
biome.json                      # Lint + format rules
```

---

## Quick Start (Docker Compose)

Prerequisites: Docker 24+ with the Compose plugin.

```bash
# 1. Set required secrets (or write to .env)
cp .env.example .env
# Edit .env and change at least AUTH_SECRET and ADMIN_PASSWORD

# 2. Build and start the full stack
docker compose up --build -d

# 3. Visit the app
open http://localhost:3000
```

On first boot the `app` container will:

1. Wait for `postgres` and `minio` health checks.
2. Run `prisma db push` against `DATABASE_URL` (see [docker/entrypoint.sh](docker/entrypoint.sh)).
3. Execute `prisma/seed.ts` to provision the admin user, default tags, sources, and currencies.
4. Start `next start` on port `3000`.

The MinIO console (`9001`) and S3 endpoint (`9000`) are intentionally **not published** — they are only reachable from inside the compose network. To inspect MinIO, add a `ports:` block to the `minio` service.

---

## Local Development

```bash
# 1. Bring up only the infra dependencies
docker compose up -d postgres minio minio-init

# 2. Install JS deps (Bun is what the Dockerfile uses, but npm/pnpm work too)
bun install              # or: npm install

# 3. Point Prisma + the app at the local containers
cat > .env.local <<'EOF'
DATABASE_URL="postgresql://appuser:apppassword@localhost:5432/appdb?schema=public"
AUTH_SECRET="dev-secret-change-me"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin"
ADMIN_NAME="Admin"
UPLOAD_MAX_BYTES="10485760"
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET="attachments"
S3_FORCE_PATH_STYLE="true"
EOF

# (publish the postgres/minio ports locally if you haven't:
#   docker compose run --service-ports … or add `ports:` blocks)

# 4. Sync schema, seed, run
npx prisma generate
npx prisma db push
bun run db:seed          # or: npm run db:seed
bun run dev              # or: npm run dev
```

### NPM scripts

| Script         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `dev`          | `next dev`                                         |
| `build`        | `next build`                                       |
| `start`        | `next start`                                       |
| `typecheck`    | `tsc --noEmit`                                     |
| `format`       | `biome format --write`                             |
| `lint`         | `biome lint --write --unsafe`                      |
| `check`        | `biome check --write --unsafe` (combined)          |
| `db:migrate`   | `prisma migrate dev` *(unused — see workflow)*     |
| `db:seed`      | `tsx prisma/seed.ts`                               |
| `db:studio`    | `prisma studio`                                    |
| `db:reset`     | `prisma migrate reset`                             |

---

## Environment Variables

| Variable                | Required | Default (compose)                                            | Notes                                                              |
| ----------------------- | :------: | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `DATABASE_URL`          | yes      | `postgresql://appuser:apppassword@postgres:5432/appdb?schema=public` | PostgreSQL DSN consumed by Prisma + `pg.Pool`.            |
| `AUTH_SECRET`           | yes      | `change-me-to-a-long-random-string`                          | 32+ byte hex / base64 secret for Auth.js JWT.                      |
| `AUTH_TRUST_HOST`       | yes (compose) | `true`                                                  | Required behind any reverse proxy / non-localhost host.            |
| `ADMIN_EMAIL`           | yes      | `admin@example.com`                                          | Seed creates this user if missing.                                 |
| `ADMIN_PASSWORD`        | yes      | `change-me`                                                  | Hashed with bcryptjs in the seed.                                  |
| `ADMIN_NAME`            | no       | `Admin`                                                      | Display name.                                                      |
| `UPLOAD_MAX_BYTES`      | no       | `10485760` (10 MiB)                                          | Per-file attachment size limit.                                    |
| `S3_ENDPOINT`           | yes      | `http://minio:9000`                                          | S3-compatible endpoint URL.                                        |
| `S3_REGION`             | yes      | `us-east-1`                                                  | Required by the AWS SDK; arbitrary for MinIO.                      |
| `S3_ACCESS_KEY_ID`      | yes      | `minioadmin`                                                 |                                                                    |
| `S3_SECRET_ACCESS_KEY`  | yes      | `minioadmin`                                                 |                                                                    |
| `S3_BUCKET`             | yes      | `attachments`                                                | Created on boot by the `minio-init` one-shot.                      |
| `S3_FORCE_PATH_STYLE`   | yes (MinIO) | `true`                                                    | Path-style addressing — required for MinIO.                        |

> Production: rotate `AUTH_SECRET`, `ADMIN_PASSWORD`, and the MinIO root credentials, and put the app behind TLS-terminating reverse proxy (e.g. Caddy / Traefik).

---

## Database & Prisma Workflow

This project intentionally uses **`prisma db push`** rather than `prisma migrate` so the schema can evolve quickly during early development.

### Local

```bash
# After editing prisma/schema.prisma
DATABASE_URL="postgresql://appuser:apppassword@localhost:5432/appdb?schema=public" \
  npx prisma db push
DATABASE_URL="postgresql://appuser:apppassword@localhost:5432/appdb?schema=public" \
  npx prisma generate
```

### Inside the running container

The deployed image is *built*, not bind-mounted, so the schema must be copied in before pushing:

```bash
docker cp prisma/schema.prisma application-tracker-app-1:/app/prisma/schema.prisma
docker compose exec -T app sh -lc \
  'node node_modules/prisma/build/index.js db push --url "$DATABASE_URL" \
   && node node_modules/prisma/build/index.js generate'
```

> Prisma 7's `db push` does **not** accept `--skip-generate`; run `generate` separately when needed.

### Seeding

`prisma/seed.ts` is invoked automatically by [docker/entrypoint.sh](docker/entrypoint.sh) on every container start. It is idempotent: it upserts the admin user, default tags, sources, and currency options.

---

## Authentication

- Provider: **Credentials** (email + password) via Auth.js v5 (`next-auth@5.0.0-beta`).
- Adapter: `@auth/prisma-adapter` over the same Prisma client.
- Hashing: `bcryptjs` (12 rounds in the seed; check `src/auth.ts` for the runtime cost).
- Session strategy: JWT (cookie). `AUTH_TRUST_HOST=true` is required behind any proxy.
- Module augmentation: [src/types/next-auth.d.ts](src/types/next-auth.d.ts) widens the `Session.user` type.

The login page lives at [src/app/login/page.tsx](src/app/login/page.tsx) and the protected shell is rooted at [src/app/(app)/layout.tsx](src/app/(app)/layout.tsx).

---

## File Storage (MinIO / S3)

- Bucket bootstrap: the `minio-init` one-shot in [docker-compose.yml](docker-compose.yml) runs `mc mb local/attachments` and sets it to anonymous `download` so download URLs work without per-object signing.
- Client wrapper: [src/shared/lib/s3.ts](src/shared/lib/s3.ts) constructs the AWS SDK v3 client from `S3_*` env vars.
- Uploads / downloads: handled in [src/shared/actions/attachments.ts](src/shared/actions/attachments.ts) and [src/app/api/attachments/[id]/route.ts](src/app/api/attachments/%5Bid%5D/route.ts), gated by the authenticated session.
- Hard limit: `UPLOAD_MAX_BYTES` (default 10 MiB).

For a real S3 bucket simply point the `S3_*` env vars elsewhere and set `S3_FORCE_PATH_STYLE=false`.

---

## Internationalization

- Catalog: [messages/en.json](messages/en.json), validated against [messages/messages.schema.json](messages/messages.schema.json).
- Wiring: [src/i18n/request.ts](src/i18n/request.ts) is the `next-intl` request config; client components consume `useTranslations(namespace)` and server components consume `getTranslations(namespace)`.
- Conventions:
  - Every user-visible string lives in the catalog. No literal English in components.
  - Validation errors returned from server actions are i18n keys (e.g. `validation.required`); the form layer translates them via `t(key)`.
  - Enum-style values reuse top-level namespaces such as `status.*`, `priority.*`, `companyType.*`, `fundingStage.*`, etc.

Adding a locale: copy `messages/en.json` to e.g. `messages/tr.json`, translate values, and extend the `next-intl` config in `src/i18n/request.ts`. The schema enforces shape parity automatically.

---

## Coding Standards & Tooling

- **Formatter / linter**: [Biome 2.4](https://biomejs.dev/). Rules in [biome.json](biome.json) — **tabs** for indentation, **double quotes** for strings.
- **Type safety**: strict TypeScript (`tsc --noEmit` is the gate).
- **Module boundaries**:
  - `src/shared/lib/*` — `import "server-only"` (or implicit through Prisma usage). Never import into client components.
  - `src/shared/actions/*` and `src/app/**/actions/*` — `"use server"` files exporting server actions. Always validate input with Zod before calling the data layer.
  - Client components live next to the route they belong to under `components/`.
- **Form pattern** — for an example of the canonical full-width multi-card form layout (cards → grid → `Field` helper → `Select` / `TextField.Root` / `TextArea`), see [src/shared/components/ApplicationForm.tsx](src/shared/components/ApplicationForm.tsx) and [src/app/(app)/companies/components/CompanyForm.tsx](src/app/(app)/companies/components/CompanyForm.tsx).
- **Revalidation** — every successful mutation calls `revalidatePath` on each affected route segment. Detail pages use `revalidatePath('/applications/[id]/edit', 'page')` style so dynamic segments are invalidated correctly.

Run before committing:

```bash
bun run check        # biome check --write --unsafe
bun run typecheck    # tsc --noEmit
```

---

## Domain Model

Defined in [prisma/schema.prisma](prisma/schema.prisma).

- **User** — authenticated principal (single user expected). Owns `ApplicationDraft`s.
- **Application** — central entity. Indexed on `status`, `priority`, `companySize`, `applicationMethod`, `appliedAt`, `companyId`.
- **Company** — rich profile (~50 fields) grouped into Identity / Location / Online Presence / Business / Tech & Culture / Contact / Personal Tracking / Notes. `normalizedName` is unique to deduplicate variants.
- **Tag**, **SourceOption**, **CurrencyOption** — user-managed reference data.
- **ApplicationTag** — many-to-many join.
- **Attachment** — S3-backed file metadata.
- **ActivityEntry** — append-only audit per application; `type ∈ {CREATED, FIELD_CHANGE, STATUS_CHANGE, COMMENT, ATTACHMENT_ADDED, ATTACHMENT_REMOVED}`.
- **CompanyActivityEntry** — append-only audit per company; `type ∈ {CREATED, FIELD_CHANGE, NOTE_ADDED, BOOTSTRAPPED_FROM_APPLICATION, LINKED_APPLICATION, UNLINKED_APPLICATION}`.
- **Comment** — Markdown comments on an application.
- **ApplicationDraft** — per-user JSON draft (`payload`) with `mode ∈ {CREATE, EDIT}`, `schemaVersion`, and `baseApplicationUpdatedAt` for stale detection.

Enums are stored as `String` columns and validated centrally in zod (`src/shared/schemas/*` and route-local `actions/*.ts`) — this keeps migrations cheap and makes string-based filtering trivial.

---

## Server Actions & Data Layer

```text
client component ──▶ server action ──▶ data layer (Prisma) ──▶ PostgreSQL
                  │              │
                  │              └─▶ audit (diff + write *ActivityEntry)
                  │
                  └─▶ revalidatePath(...)
```

Pattern (illustrated by [src/app/(app)/companies/actions/companies.ts](src/app/(app)/companies/actions/companies.ts)):

1. Mark the file `"use server"`.
2. Define a zod schema with reusable helpers (`optionalUrl`, `optionalStr(max)`, `optionalEnum([...])`, `optionalInt(min,max)`, `optionalFloat(min,max)`).
3. `safeParse` the input; on failure return `{ ok: false, error: "invalid_data", fieldErrors }` — **field errors are i18n keys**.
4. Call into `src/shared/lib/<entity>.ts` for the actual Prisma work.
5. On success, call `revalidate(id?)` (a small helper that invalidates all relevant routes), then `redirect` or return `{ ok: true, id }`.

The data layer (`src/shared/lib/*`) owns:

- Input mapping (`toCompanyData`, `toApplicationData`) — converts loose form input into Prisma data, normalizing `""` → `null` and coercing numerics.
- Domain logic — name normalization, draft hydration, currency conversion, etc.
- Audit emission — wraps writes in a transaction that calls `diffApplication` / `diffCompany` and inserts one row per changed field.

---

## Audit / Activity Log

Both `Application` and `Company` have a parallel auditing system:

- A `TRACKED_FIELDS` allow-list (e.g. exported from [src/shared/lib/company-audit.ts](src/shared/lib/company-audit.ts)) defines which columns participate.
- On update, `diff*` produces a list of `{ field, oldValue, newValue }` triples where the values are JSON-encoded so booleans, numbers, and nulls round-trip cleanly.
- `write*ActivityEntries` inserts one `*ActivityEntry` row per changed field within the same transaction as the entity update.
- The activity tab decodes the JSON values and renders human-readable diffs (with i18n labels via `fields.*`).

Other auditable events (status change, comment, attachment add/remove, link/unlink) are written explicitly by their respective server actions.

---

## Common Operations

```bash
# Tail app logs
docker compose logs -f app

# Open a shell inside the running app
docker compose exec app sh

# Manual schema push from your laptop into the container
docker cp prisma/schema.prisma application-tracker-app-1:/app/prisma/schema.prisma
docker compose exec -T app sh -lc \
  'node node_modules/prisma/build/index.js db push --url "$DATABASE_URL" \
   && node node_modules/prisma/build/index.js generate'

# Re-run the seed
docker compose exec app sh -lc \
  'node node_modules/tsx/dist/cli.mjs prisma/seed.ts'

# Open Prisma Studio against the local Postgres (publish 5432 first)
DATABASE_URL="postgresql://appuser:apppassword@localhost:5432/appdb?schema=public" \
  npx prisma studio

# Reset everything (destroys data + volumes)
docker compose down -v
```

---

## Troubleshooting

| Symptom                                                    | Likely cause / fix                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `prisma db push: unknown or unexpected option --skip-generate` | Prisma 7 removed that flag — omit it and run `prisma generate` separately.            |
| Login fails with valid credentials                         | `AUTH_SECRET` mismatch between sessions or `AUTH_TRUST_HOST=true` missing behind a proxy.  |
| Attachment upload returns 413                              | `UPLOAD_MAX_BYTES` is below the file size, or your reverse proxy enforces a smaller limit. |
| MinIO bucket missing                                       | Restart `minio-init` (`docker compose up -d --force-recreate minio-init`).                 |
| RSC fails with “PrismaClient unable to run in this browser environment” | A `src/shared/lib/*` helper was imported into a client component — remove the import. |
| Schema changes not visible inside the container            | The image is built, not mounted. Use the `docker cp` + `db push` recipe above.             |
| Form field shows raw key like `validation.required`        | Missing entry in [messages/en.json](messages/en.json); add it under the right namespace.   |

---

## License

This project is currently distributed without an explicit license. Until one is added, all rights are reserved by the repository owner. If you intend to use, fork, or self-host this project, please open an issue to discuss licensing.
