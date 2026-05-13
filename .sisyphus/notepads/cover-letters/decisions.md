# Decisions — cover-letters

## [2026-05-13] Architecture Decisions

### Data Model: Denormalized Content

- Application stores coverLetterContent directly (immutable copy)
- coverLetterId is optional FK — tracks which template was used
- Deleting a CoverLetter does NOT break existing applications (SetNull)
- Editing a template does NOT retroactively change existing applications

### Field Replacement

- REMOVE: `coverLetterVersion String?` from Application model
- ADD: `coverLetterContent String? @db.Text` on Application
- ADD: `coverLetterId String?` on Application (optional FK to CoverLetter)
- Migration is non-destructive (coverLetterVersion was just a label, not content)

### Form-Only Fields (not persisted on Application)

- `saveToLetters: boolean` — checkbox state
- `coverLetterTitle: string` — title for saving to library (required if saveToLetters=true)

### Cover Letter Content Format

- Markdown (consistent with notes field)
- react-markdown + remark-gfm for rendering (already installed)

### No Pagination / No Search

- Simple findMany with alphabetical sort for MVP
- Cover letter lists are expected to be small

### Ownership

- All CoverLetter operations check userId ownership
- Users cannot access other users' cover letters
