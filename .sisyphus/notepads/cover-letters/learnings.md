# Learnings — cover-letters

## [2026-05-13] Session Start

### Tech Stack
- Next.js 16 App Router, React 19, TypeScript
- Prisma 7 + PostgreSQL
- Radix UI Themes (component library)
- react-hook-form + Zod validation
- next-intl i18n (messages/en.json only)
- Server Actions (NOT API routes) for mutations
- zustand for client state

### CRUD Pattern (canonical: Tags/Sources)
- Server Component page → fetches data → passes to Client Component as props
- Client Component (TagManager, SourceManager) → calls server actions
- Server Actions: `"use server"`, FormData, Zod parse, prisma call, revalidatePath
- ActionResult type: `{ ok: true; data: T } | { ok: false; error: string }`
- Delete: always uses ConfirmationDialog

### Application Form Architecture
- Section-based: GeneralSection, ApplicationPackageSection, etc.
- Each section receives `form: FormApi` (UseFormReturn<ApplicationFormInput>)
- Hooks: useApplicationFormState, useApplicationSubmit, useApplicationDraft
- Types in `src/app/(app)/applications/components/ApplicationForm/types.ts`
- Zod schema in `src/shared/schemas/application.ts`

### Navigation
- MAIN_NAV + MANAGE_NAV arrays in `src/shared/navigation.ts`
- Sidebar.tsx dynamically renders from these arrays
- Cover letters goes in MANAGE_NAV (management feature, like tags/sources)

### i18n
- Only `messages/en.json` — no Turkish
- `messages/messages.schema.json` must also be updated
- Use `useTranslations("coverLetters")` in client components
- Use `getTranslations("coverLetters")` in server components

### Audit System
- `src/shared/lib/audit.ts` has TRACKED_FIELDS array
- `coverLetterVersion` is in there — must replace with `coverLetterContent`
- diffApplication() auto-handles all tracked fields

### Key File Locations
- Schema: `prisma/schema.prisma`
- Application Zod schema: `src/shared/schemas/application.ts`
- Application lib: `src/shared/lib/applications.ts`
- Application actions: `src/shared/actions/applications.ts`
- Audit: `src/shared/lib/audit.ts`
- Navigation: `src/shared/navigation.ts`
- i18n: `messages/en.json`
- Application form section: `src/app/(app)/applications/components/ApplicationForm/sections/ApplicationPackageSection.tsx`
- Application details: `src/app/(app)/applications/[id]/components/ApplicationDetails.tsx`
