# Request an Exam — design

Date: 2026-09-18
Status: approved (UI mockup reviewed 2026-09-18; storage backend switched to GitHub Issues the same day because the Firebase project is on the Spark plan and Cloud Storage requires Blaze)

## Goal

Give users a prominent way to contribute exam material. A user opens a pre-filled GitHub issue, drops the source files of the exam they want (PDF dumps, JSON, screenshots, …) into it, and the site owner converts them into a question bank under `public/data`.

## Entry points (all open the issue form in a new tab)

- **Dashboard**: a full-width accent card directly under the page title — "Can't find your exam? Request it!" with a primary button "Request an Exam".
- **Dashboard → All Available Exams**: a dashed "+ Request an Exam" tile at the end of the grid.
- **Sidebar → General**: "Request an Exam" item. `NavGroup` renders `http(s)` urls as plain anchors with `target="_blank"` instead of router links.

## Issue form

`.github/ISSUE_TEMPLATE/exam-request.yml` (bilingual labels, label `exam-request`, title prefix `[Exam request] `):

1. **Files** (textarea, required) — users drag & drop files; GitHub attaches them (≤ 25 MB each; PDF, DOCX, TXT, MD, JSON, ZIP, images).
2. **Exam name or code** (optional)
3. **Contact** (optional) — prefilled from the signed-in account e-mail via the `contact` query parameter.
4. **Notes** (optional)

URL builder `src/lib/exam-request-url.ts`: `buildExamRequestIssueUrl({ contact? })` → `https://github.com/newbdez33/question-crushing-king/issues/new?template=exam-request.yml[&contact=…]`.

## Not doing

- In-app upload (needs Firebase Storage → Blaze, or another storage provider).
- Storing request metadata in the Realtime Database; the issue is the record.
- Owner notifications beyond GitHub's own issue notifications.

## Testing

- Vitest: URL builder (template param, contact prefill/omission); `NavGroup` renders external urls as new-tab anchors; dashboard renders the CTA + tile with the issue URL and prefilled contact.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`.
