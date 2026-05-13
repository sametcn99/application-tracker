# Cover Letters (Önyazılar) Feature

## TL;DR

> **Quick Summary**: Add a cover letter management system where users can save, reuse, and manage cover letter templates on a dedicated page, and select/write cover letters directly in the application form with a "save to my letters" checkbox.
> 
> **Deliverables**:
> - New `CoverLetter` Prisma model + migration
> - New `/cover-letters` page with CRUD operations (list, create, edit, delete)
> - Application form integration: dropdown for saved cover letters, markdown textarea, "save to my letters" checkbox
> - Replace `coverLetterVersion` field with `coverLetterContent` + `coverLetterId` on Application model
> - Navigation update (sidebar + mobile nav)
> - i18n keys for all new UI strings
> - Server actions for cover letter CRUD + application form updates
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (schema) → Task 5 (form integration) → Task 8 (QA)

---

## Context

### Original Request
User wants to add a cover letter (önyazı) management feature. When applying to jobs, cover letters are often requested. Users should be able to:
1. Save cover letters on a dedicated page
2. Select saved cover letters from a dropdown when creating/editing applications
3. Write new cover letters inline in the application form
4. Optionally save inline cover letters to their template library via a checkbox

⚠️ CRITICAL DISTINCTION: Resume (özgeçmiş/CV) and Cover Letter (önyazı/başvuru mektubu) are DIFFERENT things. This feature only deals with cover letters.

### Interview Summary
**Key Discussions**:
- Format: Markdown (consistent with existing `notes` field using react-markdown)
- Editable: When selecting from dropdown, content copies into form and is editable (template-like behavior)
- Data model: Replace `coverLetterVersion` with `coverLetterContent` (Text) + `coverLetterId` (optional FK)
- Test strategy: Tests After (implement first, then write tests)
- i18n: English only (en.json), following existing pattern
- No search/filter for MVP - alphabetical sort sufficient
- No pagination for cover letters list - simple findMany

**Research Findings**:
- Tech stack: Next.js 16 + App Router, React 19, Prisma 7 + PostgreSQL, Radix UI Themes, react-hook-form + Zod, next-intl, Server Actions, zustand
- CRUD pattern (Tags/Sources/Currencies): Server Component page → Client Component → Server Actions (FormData + revalidatePath)
- Application form: Section-based architecture with react-hook-form + Zod validation
- Navigation: `MAIN_NAV` and `MANAGE_NAV` arrays in `src/shared/navigation.ts`
- Existing `coverLetterVersion` is just a version label string (e.g., "v1", "custom") — not actual letter content
- Audit system tracks field changes via `ActivityEntry` model

### Metis Review
**Identified Gaps** (addressed):
- No explicit handling for what happens when a saved cover letter is deleted but still referenced by an application — Resolved: `coverLetterId` is optional, content is denormalized on Application, so deletion of a CoverLetter does NOT break existing applications
- No consideration for editing a cover letter template and whether it should update all applications that used it — Resolved: Content is COPIED to Application at save time, so editing a template does NOT retroactively change existing applications (this is correct template behavior)
- Missing consideration for the activity/audit log when coverLetterContent changes — Resolved: `coverLetterVersion` is already in the audit tracked fields list; will update to track `coverLetterContent` changes instead

---

## Work Objectives

### Core Objective
Enable users to manage reusable cover letter templates and use them in job applications with a seamless inline editing experience.

### Concrete Deliverables
- `CoverLetter` model in Prisma schema + migration
- `/cover-letters` page with list, create, edit, delete functionality
- Updated `ApplicationPackageSection` with dropdown + textarea + checkbox
- Updated application schema (replace `coverLetterVersion`, add `coverLetterContent`, `coverLetterId`)
- Updated server actions for create/update application
- Updated navigation (sidebar, mobile nav)
- Complete i18n keys in `messages/en.json`
- Unit tests for server actions and Zod schema

### Definition of Done
- [ ] `bun run db:migrate` succeeds without errors
- [ ] `/cover-letters` page loads, displays list, supports create/edit/delete
- [ ] Application form shows cover letter dropdown with saved letters
- [ ] Selecting a cover letter populates the textarea and makes it editable
- [ ] "Save to my letters" checkbox creates a CoverLetter record when checked
- [ ] Existing applications retain their data (migration is non-destructive)
- [ ] `bun run typecheck` passes with no errors
- [ ] `bun test` passes for all new and existing tests

### Must Have
- CoverLetter CRUD (create, read, update, delete)
- Dropdown in application form showing saved cover letters
- Inline cover letter editing in application form
- "Save to my letters" checkbox when writing new cover letter
- Cover letter content stored on Application as immutable copy
- `coverLetterId` FK on Application linking to the source template (optional)
- Markdown rendering for cover letter content display
- Data migration that preserves existing `coverLetterVersion` values

### Must NOT Have (Guardrails)
- NO AI-generated cover letters
- NO rich text editor (WYSIWYG) — markdown textarea only
- NO cover letter sharing between users
- NO PDF export functionality
- NO cover letter versioning/history within a single letter
- NO automatic cover letter generation from application data
- NO changes to the `resumeVersion` field — that stays as-is
- NO i18n beyond English (no Turkish translation in this PR)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest + playwright)
- **Automated tests**: YES (Tests After)
- **Framework**: vitest
- **If TDD**: N/A (Tests After)

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun test) — Import, call functions, verify behavior

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + scaffolding):
├── Task 1: Prisma schema & migration (New model + Application changes) [quick]
├── Task 2: CoverLetter Zod schema + server actions [quick]
├── Task 3: i18n keys for cover letters [quick]
└── Task 4: Navigation update (+ Cover Letters in sidebar) [quick]

Wave 2 (After Wave 1 - core pages + form integration):
├── Task 5: Cover letters management page (list, create, edit, delete) [unspecified-high]
├── Task 6: ApplicationPackageSection redesign (dropdown + textarea + checkbox) [visual-engineering]
└── Task 7: Application server actions update (handle coverLetterContent, coverLetterId, save-to-letters) [unspecified-high]

Wave 3 (After Wave 2 - integration + tests):
├── Task 8: Application details view cover letter display [quick]
├── Task 9: Audit log integration for coverLetterContent [quick]
└── Task 10: Unit tests (vitest) [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 5, Task 6, Task 7 → Task 8, Task 9, Task 10 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | -         | 5, 6, 7, 8, 9 |
| 2    | -         | 5, 6, 7 |
| 3    | -         | 5, 6 |
| 4    | -         | 5 |
| 5    | 1, 2, 3, 4 | 8, 10 |
| 6    | 1, 3       | 8 |
| 7    | 1, 2       | 8, 9, 10 |
| 8    | 6, 7       | 10 |
| 9    | 7          | 10 |
| 10   | 5, 7, 8, 9 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1 `quick`, T2 `quick`, T3 `quick`, T4 `quick`
- **Wave 2**: 3 tasks — T5 `unspecified-high`, T6 `visual-engineering`, T7 `unspecified-high`
- **Wave 3**: 3 tasks — T8 `quick`, T9 `quick`, T10 `unspecified-high`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [ ] 1. **Prisma Schema & Migration**

  **What to do**:
  - Add `CoverLetter` model to `prisma/schema.prisma` with fields: `id` (cuid), `userId` (FK to User), `title` (String, max 200), `content` (String, @db.Text), `createdAt`, `updatedAt`, and relation `applications Application[]`
  - Add `CoverLetter` relation to `User` model: `coverLetters CoverLetter[]`
  - On `Application` model: remove `coverLetterVersion String?` field, add `coverLetterContent String? @db.Text`, add `coverLetterId String?` with relation `coverLetter CoverLetter? @relation(fields: [coverLetterId], references: [id], onDelete: SetNull)`
  - Add index `@@index([userId, updatedAt])` on CoverLetter
  - Add index `@@index([coverLetterId])` on Application
  - Run `bun run db:migrate` to create the migration
  - Verify migration succeeds

  **Must NOT do**:
  - Do NOT touch the `resumeVersion` field — it stays as-is
  - Do NOT add any cascade delete on Application→CoverLetter (use SetNull)
  - Do NOT add cover letter versioning/history tables

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema changes are well-defined, follow existing pattern, straightforward single-file edit + migration command
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5, 6, 7, 8, 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `prisma/schema.prisma:26-30` — User model showing relation pattern (e.g., `applicationDrafts ApplicationDraft[]`)
  - `prisma/schema.prisma:54-56` — Application model fields showing current `coverLetterVersion` to replace
  - `prisma/schema.prisma:178-185` — Tag model as canonical CRUD model example (simple id, name, color, relations)
  - `prisma/schema.prisma:187-191` — SourceOption model as another simple CRUD reference

  **API/Type References**:
  - `src/shared/schemas/application.ts:121` — Current `coverLetterVersion` field in Zod schema to replace
  - `src/shared/lib/audit.ts:28` — Audit tracked fields list where `coverLetterVersion` needs updating

  **External References**:
  - Prisma schema docs for @db.Text: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string

  **WHY Each Reference Matters**:
  - User model pattern (line 26-30): Shows exactly how to add a new relation (`coverLetters CoverLetter[]`) following the same style as existing relations
  - Application model (line 54-56): The `coverLetterVersion` field is what we're replacing — must remove this and add the new fields in the same location
  - Tag/SourceOption models: Same simplicity level as our new CoverLetter model — follow this pattern for id, timestamps, and relations

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Schema migration succeeds
    Tool: Bash
    Preconditions: PostgreSQL running, .env configured
    Steps:
      1. Run `bun run db:migrate --name add_cover_letters`
      2. Check exit code is 0
      3. Run `bunx prisma generate` to ensure client is updated
    Expected Result: Migration succeeds without errors, Prisma client generated
    Failure Indicators: Exit code non-zero, SQL errors in output
    Evidence: .sisyphus/evidence/task-1-migration-success.txt

  Scenario: CoverLetter model accessible from Prisma client
    Tool: Bash
    Preconditions: Migration completed
    Steps:
      1. Run `bunx prisma studio --port 5555 &` (background)
      2. Verify CoverLetter table appears in schema
    Expected Result: CoverLetter model exists with id, userId, title, content, createdAt, updatedAt fields
    Failure Indicators: Model not found, missing fields
    Evidence: .sisyphus/evidence/task-1-prisma-schema-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(schema): add CoverLetter model and update Application model`
  - Files: `prisma/schema.prisma`, migration file
  - Pre-commit: `bunx prisma generate && bun run typecheck`

- [ ] 2. **CoverLetter Zod Schema + Server Actions**

  **What to do**:
  - Create `src/shared/schemas/cover-letter.ts` with Zod schema:
    - `title`: z.string().min(1).max(200)
    - `content`: z.string().min(1).max(50000) — allow long markdown content
  - Create `src/shared/lib/cover-letters.ts` with functions:
    - `listCoverLetters(userId: string)` — findMany ordered by updatedAt desc
    - `getCoverLetter(id: string, userId: string)` — findUnique with ownership check
    - `createCoverLetter(userId: string, data: CoverLetterFormInput)` — create
    - `updateCoverLetter(id: string, userId: string, data: CoverLetterFormInput)` — update with ownership check
    - `deleteCoverLetter(id: string, userId: string)` — delete with ownership check
  - Create `src/app/(app)/cover-letters/actions/cover-letters.ts` with server actions:
    - `createCoverLetterAction(formData: FormData)` — validate with Zod, call createCoverLetter, revalidatePath("/cover-letters")
    - `updateCoverLetterAction(id: string, formData: FormData)` — validate, update, revalidatePath
    - `deleteCoverLetterAction(id: string)` — delete, revalidatePath
  - Export types: `CoverLetterFormInput`, `CoverLetterActionResult`

  **Must NOT do**:
  - Do NOT create API routes (use Server Actions pattern)
  - Do NOT add pagination (simple findMany is enough for MVP)
  - Do NOT add search/filter (alphabetical sort sufficient)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Follows exact same pattern as Sources/Tags — clear 1:1 mapping to existing code
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/app/(app)/sources/actions/sources.ts` — Canonical server action pattern (FormData, Zod validation, revalidatePath, ActionResult type)
  - `src/app/(app)/tags/actions/tags.ts` — Simpler server action pattern (create, delete)
  - `src/shared/lib/reference-data.ts` — Data fetching pattern with `cache()`, findMany, orderBy

  **API/Type References**:
  - `src/shared/schemas/application.ts:15-20` — Zod helper patterns (optionalStr, etc.)
  - `prisma/schema.prisma:14-24` — User model for userId relation pattern

  **WHY Each Reference Matters**:
  - sources.ts: The EXACT pattern for server actions — FormData, Zod parse, prisma call, revalidatePath. Copy this structure.
  - tags.ts: Simpler variant of the same pattern for create/delete actions
  - application.ts schema: Shows how to define validation helpers and reuse them across schemas

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zod schema validates correctly
    Tool: Bash
    Preconditions: Schema files created
    Steps:
      1. Run `bun run typecheck` to verify no type errors
      2. Verify coverLetterSchema.parse({ title: "My Letter", content: "Dear..." }) succeeds
      3. Verify coverLetterSchema.parse({ title: "", content: "" }) fails with validation errors
    Expected Result: Typecheck passes, schema validates correctly
    Failure Indicators: Type errors, schema not validating empty strings
    Evidence: .sisyphus/evidence/task-2-schema-verify.txt

  Scenario: Server actions reject invalid input
    Tool: Bash
    Preconditions: Actions created
    Steps:
      1. Import and call createCoverLetterAction with empty title
      2. Verify it returns { ok: false, error: "..." }
    Expected Result: Invalid data rejected with error, no prisma call made
    Failure Indicators: Action creates record with empty data
    Evidence: .sisyphus/evidence/task-2-action-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(actions): add cover letter server actions and validation schema`
  - Files: `src/shared/schemas/cover-letter.ts`, `src/shared/lib/cover-letters.ts`, `src/app/(app)/cover-letters/actions/cover-letters.ts`
  - Pre-commit: `bun run typecheck`

- [ ] 3. **i18n Keys for Cover Letters**

  **What to do**:
  - Add `coverLetters` section to `messages/en.json` with all necessary keys:
    - `title`, `subtitle`, `name`, `namePlaceholder`, `content`, `contentPlaceholder`, `addButton`, `editButton`, `deleteButton`, `deleteConfirm`, `save`, `createTitle`, `editTitle`, `emptyState`
    - `savedToLetters` (for the checkbox label: "Save to my cover letters")
    - `selectExisting` (dropdown placeholder: "Select a saved cover letter")
    - `noSavedLetters` (empty state for dropdown)
  - Update `messages.schema.json` to include the new keys
  - Add nav key: `nav.coverLetters` = "Cover Letters"

  **Must NOT do**:
  - Do NOT add Turkish translations (only English for now)
  - Do NOT modify existing application form keys (those stay as-is, we add new ones alongside)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple JSON edits, well-defined structure, follows existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `messages/en.json:1-60` — Structure showing common, nav, auth, login sections
  - `messages/en.json` (search for `tags` and `sources`) — Existing CRUD page i18n pattern to follow

  **WHY Each Reference Matters**:
  - en.json structure: Shows exact nesting pattern for new section
  - tags/sources sections: The canonical pattern for CRUD page translations — follow exactly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: i18n keys are valid JSON and accessible
    Tool: Bash
    Preconditions: en.json updated
    Steps:
      1. Run `bun run i18n:check` to validate message files
      2. Verify exit code is 0
    Expected Result: i18n validation passes, no missing keys
    Failure Indicators: Missing key errors, invalid JSON
    Evidence: .sisyphus/evidence/task-3-i18n-verify.txt

  Scenario: Cover letters keys used in component resolve correctly
    Tool: Bash
    Preconditions: Keys added
    Steps:
      1. Import and use `useTranslations("coverLetters")` in a test component
      2. Verify `t("title")` returns "Cover Letters"
    Expected Result: Translation resolves to correct English string
    Failure Indicators: Key not found error, fallback display
    Evidence: .sisyphus/evidence/task-3-translation-resolve.txt
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `feat(i18n): add cover letters translation keys`
  - Files: `messages/en.json`, `messages/schema.json`
  - Pre-commit: `bun run i18n:check`

- [ ] 4. **Navigation Update for Cover Letters**

  **What to do**:
  - Add cover letters entry to `MANAGE_NAV` in `src/shared/navigation.ts`:
    ```typescript
    { href: "/cover-letters", labelKey: "coverLetters", icon: LetterIcon }
    ```
  - Import `LetterIcon` (or `FileTextIcon` or similar) from `@radix-ui/react-icons`
  - No changes needed to `Sidebar.tsx` — it dynamically renders from MAIN_NAV/MANAGE_NAV arrays

  **Must NOT do**:
  - Do NOT add to MAIN_NAV (cover letters is a management feature, like tags/sources)
  - Do NOT create custom icons — use existing Radix icons

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file edit, adding one nav item to existing array
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/shared/navigation.ts:1-27` — Complete navigation configuration with imports and array structure
  - `src/shared/navigation.ts:20-25` — MANAGE_NAV array showing exactly where to add new entry (after currencies, before settings)

  **WHY Each Reference Matters**:
  - navigation.ts: The ONLY file that needs changing for nav — shows the exact pattern for icon import and array entry format

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Cover Letters link appears in sidebar navigation
    Tool: Bash
    Preconditions: Navigation updated, app running
    Steps:
      1. Run `bun run dev`
      2. Open browser, login, check sidebar Management section
      3. Verify "Cover Letters" link appears between Currencies and Settings
    Expected Result: Link visible, icon displayed, navigates to /cover-letters
    Failure Indicators: Link missing, icon broken, wrong position
    Evidence: .sisyphus/evidence/task-4-nav-link.png
  ```

  **Commit**: YES (groups with Task 3 if same PR)
  - Message: `feat(nav): add cover letters to navigation`
  - Files: `src/shared/navigation.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 5. **Cover Letters Management Page (CRUD)**

  **What to do**:
  - Create `src/app/(app)/cover-letters/page.tsx` (Server Component):
    - Fetch cover letters for current user with `prisma.coverLetter.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })`
    - Render heading + subtitle using i18n keys
    - Pass data to `CoverLetterManager` client component
  - Create `src/app/(app)/cover-letters/components/CoverLetterManager.tsx` (Client Component):
    - Display list of cover letters with title, preview (truncated content), updatedAt
    - Create form: TextField for title, TextArea for content (with markdown preview)
    - Edit: Click on a letter to edit title and content
    - Delete: ConfirmationDialog before delete
    - Follow the TagManager/SourceManager pattern for the UI
  - Create `src/app/(app)/cover-letters/[id]/edit/page.tsx` (edit page)
  - Create `src/app/(app)/cover-letters/new/page.tsx` (create page)

  **Must NOT do**:
  - Do NOT add search/filter (MVP doesn't need it)
  - Do NOT add pagination (list will be small)
  - Do NOT use a rich text editor (use Radix TextArea + optional markdown preview)
  - Do NOT share cover letters between users

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file creation following existing patterns, requires coordination across page/components/actions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 10
  - **Blocked By**: Tasks 1, 2, 3, 4

  **References**:

  **Pattern References**:
  - `src/app/(app)/sources/page.tsx` — Server Component page pattern: fetch data, render heading + subtitle, pass to client component
  - `src/app/(app)/sources/components/SourceManager.tsx` — Client Component CRUD pattern: list items, add form, delete button, ConfirmationDialog, server actions
  - `src/app/(app)/tags/page.tsx` — Simpler CRUD page pattern
  - `src/app/(app)/tags/components/TagManager.tsx` — Client component with create form and list

  **API/Type References**:
  - `src/app/(app)/cover-letters/actions/cover-letters.ts` — Server actions created in Task 2
  - `src/shared/schemas/cover-letter.ts` — Zod schema created in Task 2
  - `src/shared/lib/cover-letters.ts` — Data access functions created in Task 2

  **WHY Each Reference Matters**:
  - sources/page.tsx: The EXACT page structure to follow — async server component, data fetching, passing props to client component
  - SourceManager.tsx: Most relevant CRUD component — shows form, list, server action calls, optimistic updates, useTransition pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Cover letters page loads and displays empty state
    Tool: Playwright
    Preconditions: Logged in, no cover letters exist
    Steps:
      1. Navigate to /cover-letters
      2. Verify page title "Cover Letters" is visible
      3. Verify empty state message is shown
      4. Verify create form is visible
    Expected Result: Page loads, empty state visible, create form visible
    Failure Indicators: 404 error, missing heading, no form
    Evidence: .sisyphus/evidence/task-5-empty-state.png

  Scenario: Create a new cover letter
    Tool: Playwright
    Preconditions: Logged in, on /cover-letters page
    Steps:
      1. Fill title field with "Software Engineer Cover Letter"
      2. Fill content field with "Dear Hiring Manager,\n\nI am writing to express my interest..."
      3. Click "Create" button
      4. Verify new letter appears in the list
      5. Verify title and truncated preview are visible
    Expected Result: Cover letter created, appears in list with title and preview
    Failure Indicators: Create fails, letter not in list, error shown
    Evidence: .sisyphus/evidence/task-5-create-letter.png

  Scenario: Edit an existing cover letter
    Tool: Playwright
    Preconditions: Logged in, has at least one cover letter
    Steps:
      1. Click edit button on first cover letter
      2. Change title to "Updated Title"
      3. Change content to "Updated content"
      4. Click "Save"
      5. Verify updated values appear in list
    Expected Result: Cover letter updated with new title and content
    Failure Indicators: Changes not saved, error shown
    Evidence: .sisyphus/evidence/task-5-edit-letter.png

  Scenario: Delete a cover letter with confirmation
    Tool: Playwright
    Preconditions: Logged in, has at least one cover letter
    Steps:
      1. Click delete button on first cover letter
      2. Verify confirmation dialog appears
      3. Click "Delete" in confirmation dialog
      4. Verify letter removed from list
    Expected Result: Cover letter deleted, no longer in list
    Failure Indicators: Letter still visible after delete, no confirmation shown
    Evidence: .sisyphus/evidence/task-5-delete-letter.png
  ```

  **Commit**: YES
  - Message: `feat(cover-letters): add cover letters management page`
  - Files: `src/app/(app)/cover-letters/`
  - Pre-commit: `bun run typecheck && bun run check`

- [ ] 6. **Application Form: Cover Letter Integration (Dropdown + Textarea + Checkbox)**

  **What to do**:
  - Modify `ApplicationPackageSection.tsx` to include:
    1. **Cover letter dropdown**: Select from saved cover letters (fetched via server component, passed as props)
    2. **Cover letter textarea**: Large textarea for markdown content, auto-populated when dropdown selection changes
    3. **"Save to my cover letters" checkbox**: Visible when content is entered and NOT from dropdown (or always visible with smart default)
    4. **Title field for saving**: Shown when checkbox is checked, for naming the new template
  - When dropdown selection changes → populate textarea with selected letter's content (editable after population)
  - When "save to my letters" is checked → title field appears
  - On form submit → if checkbox checked, also call createCoverLetterAction before/after application creation
  - Replace `coverLetterVersion` field with new fields in form schema
  - Add `coverLetterContent` and `coverLetterId` to `applicationFormSchema`
  - Remove `coverLetterVersion` from the schema
  - Add `saveToLetters` boolean and `coverLetterTitle` string to the form schema (form-only, not persisted on Application)
  - Update `useApplicationFormState` hook to handle cover letter dropdown state
  - Update `useApplicationSubmit` hook to handle saving cover letter if checkbox is checked
  - In the new application page, fetch cover letters for the user and pass as props
  - Edit page needs same treatment

  **Must NOT do**:
  - Do NOT change `resumeVersion` field — it stays as-is
  - Do NOT make the dropdown selection mandatory — users can write without selecting
  - Do NOT auto-save to cover letters — only when checkbox is explicitly checked
  - Do NOT use WYSIWYG editor — plain textarea with markdown preview only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI component with dropdown, conditional fields, and checkbox interaction — requires UI/UX attention
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `src/app/(app)/applications/components/ApplicationForm/sections/ApplicationPackageSection.tsx` — Current section with coverLetterVersion TextField that we're replacing
  - `src/app/(app)/applications/components/ApplicationForm/index.tsx` — Main form component showing how sections receive form props and data flow
  - `src/app/(app)/applications/components/ApplicationForm/types.ts` — Form prop types (add CoverLetterOption type here)
  - `src/app/(app)/applications/components/ApplicationForm/hooks/useApplicationFormState.ts` — Hook managing form state, add cover letter state here
  - `src/app/(app)/applications/components/ApplicationForm/hooks/useApplicationSubmit.ts` — Submit hook — add cover letter save logic here

  **API/Type References**:
  - `src/shared/schemas/application.ts:121` — Current `coverLetterVersion` field to replace with new fields
  - `src/shared/actions/applications.ts` — Server actions for create/update — add cover letter creation logic
  - `src/shared/lib/applications.ts:249` — Where coverLetterVersion is mapped — change to coverLetterContent and coverLetterId

  **WHY Each Reference Matters**:
  - ApplicationPackageSection.tsx: The EXACT file being modified — current 53-line section that needs to become the dropdown+textarea+checkbox section
  - types.ts: Need to add CoverLetterOption type alongside existing Tag and CompanyOption types
  - useApplicationFormState.ts: Where to add cover letter list loading and dropdown state management
  - useApplicationSubmit.ts: Where to add "save to letters" logic before/after application submit

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Cover letter dropdown shows saved letters
    Tool: Playwright
    Preconditions: Logged in, has 2+ saved cover letters
    Steps:
      1. Navigate to /applications/new
      2. Scroll to "Application Package" section
      3. Click cover letter dropdown
      4. Verify saved cover letters appear as options
    Expected Result: Dropdown shows all saved cover letters by title
    Failure Indicators: Dropdown empty, no options visible
    Evidence: .sisyphus/evidence/task-6-dropdown-options.png

  Scenario: Selecting cover letter populates textarea
    Tool: Playwright
    Preconditions: Logged in, has saved cover letters
    Steps:
      1. Navigate to /applications/new
      2. Select a cover letter from dropdown
      3. Verify textarea is populated with the letter's content
      4. Verify content is editable (can modify text)
    Expected Result: Textarea filled with selected content, editable
    Failure Indicators: Textarea empty, content not editable
    Evidence: .sisyphus/evidence/task-6-select-letter.png

  Scenario: Writing new cover letter shows save checkbox
    Tool: Playwright
    Preconditions: Logged in, on new application form
    Steps:
      1. Navigate to /applications/new
      2. Leave dropdown at "Select a saved cover letter" (no selection)
      3. Type content into the cover letter textarea
      4. Verify "Save to my cover letters" checkbox appears
      5. Check the checkbox
      6. Verify title field appears for naming the template
    Expected Result: Checkbox visible when content entered, title field appears on check
    Failure Indicators: Checkbox always visible, title field missing
    Evidence: .sisyphus/evidence/task-6-save-checkbox.png

  Scenario: Submit with save-to-letters checked
    Tool: Playwright
    Preconditions: Logged in, on new application form
    Steps:
      1. Fill required fields (company, position, etc.)
      2. Type cover letter content
      3. Check "Save to my cover letters" checkbox
      4. Enter title "My Saved Letter"
      5. Submit the form
      6. Navigate to /cover-letters — verify "My Saved Letter" appears
      7. Navigate to application detail page — verify cover letter content shown
    Expected Result: Application created with content AND letter saved in cover letters page
    Failure Indicators: Letter not saved, application missing content
    Evidence: .sisyphus/evidence/task-6-submit-with-save.png

  Scenario: Submit with save-to-letters unchecked
    Tool: Playwright
    Preconditions: Logged in, on new application form
    Steps:
      1. Fill required fields
      2. Type cover letter content
      3. Leave "Save to my cover letters" unchecked
      4. Submit form
      5. Navigate to /cover-letters — verify no new letter saved
      6. Verify application has the cover letter content
    Expected Result: Application has content, but no new template in cover letters
    Failure Indicators: Letter saved anyway, application missing content
    Evidence: .sisyphus/evidence/task-6-submit-without-save.png
  ```

  **Commit**: YES
  - Message: `feat(form): integrate cover letters into application form`
  - Files: `src/app/(app)/applications/components/ApplicationForm/`, `src/app/(app)/applications/new/page.tsx`, `src/app/(app)/applications/[id]/edit/page.tsx`
  - Pre-commit: `bun run typecheck`

- [ ] 7. **Application Server Actions: Cover Letter Fields Update**

  **What to do**:
  - Remove `coverLetterVersion` mapping from `src/shared/lib/applications.ts` (line ~249)
  - Add `coverLetterContent` and `coverLetterId` to the application create/update logic
  - Update `applicationFormSchema` in `src/shared/schemas/application.ts`:
    - Remove `coverLetterVersion` field
    - Add `coverLetterContent: optionalStr(50000)` (allow long markdown)
    - Add `coverLetterId: z.string().optional()` (FK to saved letter)
    - Add `saveToLetters: z.boolean().optional().default(false)` (form-only field)
    - Add `coverLetterTitle: optionalStr(200)` (form-only, required if saveToLetters is true)
  - Add `superRefine` validation: if `saveToLetters` is true, `coverLetterTitle` must be non-empty
  - Update `createApplicationAction` and `updateApplicationAction`:
    - After creating/updating application, if `saveToLetters` is true AND `coverLetterContent` is non-empty:
      - Create a CoverLetter record with `coverLetterTitle` as title and `coverLetterContent` as content
      - Optionally update the Application's `coverLetterId` with the newly created CoverLetter's id
  - Update `src/shared/lib/audit.ts` tracked fields list: replace `coverLetterVersion` with `coverLetterContent`
  - Update `ApplicationDetails.tsx` component type and rendering to use `coverLetterContent` instead of `coverLetterVersion`

  **Must NOT do**:
  - Do NOT remove `resumeVersion` handling — that's unrelated
  - Do NOT add cover letter versioning/history
  - Do NOT change the activity entry types (just update the field name)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple files touched, Zod schema changes, server action logic, audit integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/shared/lib/applications.ts:249` — Where `coverLetterVersion` is mapped in createApplication — change to `coverLetterContent` and `coverLetterId`
  - `src/shared/actions/applications.ts:27-45` — createApplicationAction pattern for validation + creation
  - `src/shared/actions/applications.ts:47-70` — updateApplicationAction pattern

  **API/Type References**:
  - `src/shared/schemas/application.ts:121` — Current `coverLetterVersion: optionalStr(100)` field to replace
  - `src/shared/lib/audit.ts:28` — Tracked fields array where `coverLetterVersion` needs replacing with `coverLetterContent`
  - `src/app/(app)/applications/[id]/components/ApplicationDetails.tsx:40` — Type definition referencing `coverLetterVersion`

  **WHY Each Reference Matters**:
  - applications.ts (lib): The data mapping where Prisma creates the application record — must change field names
  - applications.ts (actions): The server actions where we need to add cover letter creation logic
  - application.ts (schema): The Zod form validation — remove old field, add new ones

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Application creation with cover letter content succeeds
    Tool: Bash (via test runner)
    Preconditions: Database migrated, all code changes applied
    Steps:
      1. Run `bun run typecheck` — verify no type errors
      2. Test createApplication with coverLetterContent="Dear..." in test
      3. Verify application record has coverLetterContent populated
    Expected Result: Application saved with cover letter content, coverLetterId null
    Failure Indicators: Type errors, missing field, save failure
    Evidence: .sisyphus/evidence/task-7-create-with-content.txt

  Scenario: Save-to-letters creates CoverLetter record
    Tool: Bash (via test runner)
    Preconditions: Database migrated
    Steps:
      1. Test createApplicationAction with saveToLetters=true, coverLetterTitle="Test Letter"
      2. Verify CoverLetter record created with matching title and content
      3. Verify Application.coverLetterId references the created CoverLetter
    Expected Result: Both Application (with content) and CoverLetter (as template) created
    Failure Indicators: CoverLetter not created, coverLetterId not linked
    Evidence: .sisyphus/evidence/task-7-save-to-letters.txt

  Scenario: coverLetterVersion removed from schema and audit
    Tool: Bash
    Preconditions: All code changes applied
    Steps:
      1. Run `grep -r "coverLetterVersion" src/`
      2. Verify no references remain in source code
      3. Run `bun run typecheck`
    Expected Result: No references to coverLetterVersion in source code, typecheck passes
    Failure Indicators: Stale references found, type errors
    Evidence: .sisyphus/evidence/task-7-cleanup-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(actions): update application actions for cover letter fields`
  - Files: `src/shared/schemas/application.ts`, `src/shared/lib/applications.ts`, `src/shared/actions/applications.ts`, `src/shared/lib/audit.ts`, `src/app/(app)/applications/[id]/components/ApplicationDetails.tsx`
  - Pre-commit: `bun run typecheck`

- [ ] 8. **Application Details: Cover Letter Content Display**

  **What to do**:
  - Update `ApplicationDetails.tsx` to display `coverLetterContent` as rendered markdown (using `react-markdown` + `remark-gfm`, already installed)
  - Remove display of `coverLetterVersion` (if still present in the detail view)
  - Add a section/card for "Cover Letter" that shows:
    - The rendered markdown content
    - If `coverLetterId` exists, show a link/icon indicating the template source
    - If content is empty, show nothing (don't show empty section)
  - Follow the existing Notes section rendering pattern (which also uses markdown)

  **Must NOT do**:
  - Do NOT add edit-from-details functionality (editing goes through the edit form)
  - Do NOT create a separate cover letter page view (this is just inline display)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small UI change following existing markdown rendering pattern, single component file
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10 — but depends on Tasks 6, 7)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 6, 7

  **References**:

  **Pattern References**:
  - `src/app/(app)/applications/[id]/components/ApplicationDetails.tsx` — Current details component where coverLetterVersion is displayed — replace with coverLetterContent rendering
  - Search for the existing markdown rendering in the same file (Notes section pattern)

  **WHY Each Reference Matters**:
  - ApplicationDetails.tsx: The EXACT file to modify — shows how Notes renders markdown, we follow that pattern for cover letter

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Cover letter content renders as markdown on details page
    Tool: Playwright
    Preconditions: Application exists with coverLetterContent containing markdown
    Steps:
      1. Navigate to /applications/{id}
      2. Find the "Cover Letter" section
      3. Verify markdown is rendered (bold, lists, etc.)
    Expected Result: Cover letter content displayed as rendered markdown
    Failure Indicators: Raw markdown shown, section missing
    Evidence: .sisyphus/evidence/task-8-markdown-render.png

  Scenario: No broken section when cover letter is empty
    Tool: Playwright
    Preconditions: Application exists with null coverLetterContent
    Steps:
      1. Navigate to /applications/{id}
      2. Verify no broken/empty "Cover Letter" section
      3. Verify clean layout without empty section
    Expected Result: No empty cover letter section displayed
    Failure Indicators: Empty section visible, broken layout
    Evidence: .sisyphus/evidence/task-8-empty-state.png
  ```

  **Commit**: YES
  - Message: `feat(details): display cover letter content on application details page`
  - Files: `src/app/(app)/applications/[id]/components/ApplicationDetails.tsx`
  - Pre-commit: `bun run typecheck`

- [ ] 9. **Audit Log: Track Cover Letter Content Changes**

  **What to do**:
  - In `src/shared/lib/audit.ts`, update the tracked fields array:
    - Remove `"coverLetterVersion"` from the array
    - Add `"coverLetterContent"` to the array
    - Add `"coverLetterId"` to the array (to track template association changes)
  - Verify that when an application's `coverLetterContent` changes, an ActivityEntry with type `FIELD_CHANGE` is created
  - The existing `diffApplication` function should automatically handle this since it compares old vs new values for all tracked fields

  **Must NOT do**:
  - Do NOT add a new ActivityEntry type — reuse `FIELD_CHANGE`
  - Do NOT change how activity entries are displayed

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple array edit in a single file, existing pattern handles all logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `src/shared/lib/audit.ts:28` — The tracked fields array where field names are listed for audit diffing

  **WHY Each Reference Matters**:
  - audit.ts: The EXACT line to modify — just swap field names in the array

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Changing coverLetterContent creates audit log entry
    Tool: Bash (via test runner)
    Preconditions: Application exists with existing coverLetterContent
    Steps:
      1. Update an application's coverLetterContent to a new value
      2. Query ActivityEntry for that application where field = "coverLetterContent"
      3. Verify entry exists with old value and new value
    Expected Result: ActivityEntry with type FIELD_CHANGE, field=coverLetterContent, oldValue, newValue
    Failure Indicators: No activity entry created, wrong field name
    Evidence: .sisyphus/evidence/task-9-audit-entry.txt

  Scenario: coverLetterVersion removed from tracked fields
    Tool: Bash
    Preconditions: Code changes applied
    Steps:
      1. Run `grep "coverLetterVersion" src/shared/lib/audit.ts`
      2. Verify it returns no results
    Expected Result: "coverLetterVersion" not found in audit.ts
    Failure Indicators: Old field name still present
    Evidence: .sisyphus/evidence/task-9-cleanup-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(audit): track coverLetterContent changes in activity log`
  - Files: `src/shared/lib/audit.ts`
  - Pre-commit: `bun run typecheck`

- [ ] 10. **Unit Tests for Cover Letter Feature**

  **What to do**:
  - Create test files following existing test patterns:
  - `test/cover-letters/actions.test.ts`:
    - Test createCoverLetterAction with valid data → returns ok
    - Test createCoverLetterAction with empty title → returns error
    - Test createCoverLetterAction with empty content → returns error
    - Test updateCoverLetterAction → updates title/content
    - Test updateCoverLetterAction with wrong user → returns error (ownership)
    - Test deleteCoverLetterAction → removes letter
  - `test/cover-letters/schema.test.ts`:
    - Test coverLetterSchema with valid data → success
    - Test coverLetterSchema with missing title → error
    - Test coverLetterSchema with content > 50000 chars → error
    - Test coverLetterSchema with title > 200 chars → error
  - `test/applications/cover-letter-integration.test.ts`:
    - Test createApplicationAction with coverLetterContent → saves content
    - Test createApplicationAction with saveToLetters=true → creates CoverLetter record
    - Test createApplicationAction with saveToLetters=true but no title → validation error
    - Test updateApplicationAction with coverLetterContent → updates content

  **Must NOT do**:
  - Do NOT write E2E tests (those are covered by Playwright QA scenarios)
  - Do NOT test Prisma directly (test through server actions)
  - Do NOT add test infrastructure from scratch (use existing vitest setup)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files, need to understand existing test patterns and mock setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 5, 7, 8, 9

  **References**:

  **Pattern References**:
  - `test/` directory — Existing test files for test structure, mock patterns, and vitest config
  - `vitest.config.ts` — Test configuration

  **API/Type References**:
  - `src/app/(app)/cover-letters/actions/cover-letters.ts` — Server actions to test (created in Task 2)
  - `src/shared/schemas/cover-letter.ts` — Zod schema to test (created in Task 2)
  - `src/shared/actions/applications.ts` — Application actions with cover letter fields (updated in Task 7)

  **WHY Each Reference Matters**:
  - test/ directory: Shows existing test patterns and conventions to follow
  - Server actions: The exact functions we need to test
  - Schema: The exact validation rules we need to verify

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All cover letter unit tests pass
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. Run `bun test test/cover-letters/`
      2. Verify all tests pass (0 failures)
    Expected Result: All cover letter tests pass with 0 failures
    Failure Indicators: Tests fail, type errors in test files
    Evidence: .sisyphus/evidence/task-10-unit-tests.txt

  Scenario: Full test suite passes with no regressions
    Tool: Bash
    Preconditions: All code changes applied
    Steps:
      1. Run `bun test`
      2. Verify no regressions in existing tests
    Expected Result: All existing + new tests pass
    Failure Indicators: Existing tests broken by schema changes
    Evidence: .sisyphus/evidence/task-10-full-suite.txt
  ```

  **Commit**: YES
  - Message: `test(cover-letters): add unit tests for cover letter actions and application integration`
  - Files: `test/cover-letters/`, `test/applications/cover-letter-integration.test.ts`
  - Pre-commit: `bun test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run typecheck` + `bun run check` + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration: create cover letter → use in application form → verify on details page → edit → verify update → delete → verify application still shows old content. Test edge cases: empty cover letter, very long content, special characters. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(schema): add CoverLetter model and update Application model` - prisma/schema.prisma, `bun run db:migrate`
- **2**: `feat(actions): add cover letter server actions and validation schema` - src/app/(app)/cover-letters/actions/, src/shared/schemas/cover-letter.ts, src/shared/lib/cover-letters.ts
- **3**: `feat(i18n): add cover letters translation keys` - messages/en.json
- **4**: `feat(nav): add cover letters to navigation` - src/shared/navigation.ts, src/shared/components/Sidebar.tsx, src/app/(app)/layout.tsx
- **5**: `feat(cover-letters): add cover letters management page` - src/app/(app)/cover-letters/
- **6**: `feat(form): integrate cover letters into application form` - src/app/(app)/applications/components/ApplicationForm/sections/ApplicationPackageSection.tsx, related form files
- **7**: `feat(actions): update application actions for cover letter fields` - src/shared/actions/applications.ts, src/shared/lib/applications.ts, src/shared/schemas/application.ts
- **8**: `feat(details): display cover letter content on application details page` - src/app/(app)/applications/[id]/components/ApplicationDetails.tsx
- **9**: `feat(audit): track coverLetterContent changes in activity log` - src/shared/lib/audit.ts
- **10**: `test(cover-letters): add unit tests for cover letter actions and application integration` - test/

---

## Success Criteria

### Verification Commands
```bash
bun run db:migrate        # Expected: migration applied successfully
bun run typecheck         # Expected: no type errors
bun run check             # Expected: biome lint + format passes
bun test                  # Expected: all tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Cover letters page accessible from sidebar navigation
- [ ] Cover letters can be created, edited, and deleted
- [ ] Application form shows cover letter dropdown with saved letters
- [ ] Cover letter content is editable after selection from dropdown
- [ ] "Save to my letters" checkbox creates a CoverLetter record
- [ ] Application details page shows cover letter content rendered as markdown
- [ ] Audit log tracks coverLetterContent field changes