# Commit Log

Updated: 2026-04-11

## Recent
- `HEAD` fix: TS type errors in workspace settings page; remove stale MySQL copy; wire `completionPageMessage` and `postSubmitRedirectUrl` through session delivery and completed page with 5s countdown redirect.
- `1a9f64a` feat(question-bank): validated content contract + scoring-safe import metadata.
- `e820ce3` feat(billing): manual payment flow + admin verification.
- `4fd0c4a` feat(participant): progressive delivery and grouped question flow.

## Highlights
- Workspace settings fully wired end-to-end. Five new fields (completion message, redirect URL, notify flags, notification email) persist and return correctly. Growth-plan gate enforced on redirect URL.
- Completed page now reads `completionPageMessage` (overrides generic copy) and auto-redirects to `postSubmitRedirectUrl` after 5 seconds when set.
- TypeScript clean — 0 errors after restore + targeted patch strategy.

## Operational Notes
- Remote D1 schema is currently the source of truth for migration-sensitive changes.
- Legacy/local migration chain has historical mismatch and should be normalized in a dedicated maintenance task.

## Follow-up Commits Needed
- Customer-facing report export page.
- Reviewer queue assignment UI.
- Admin manual payment approve/reject.
