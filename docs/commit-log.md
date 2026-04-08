# Commit Log

Updated: 2026-04-08

## Recent
- `1a9f64a` feat(question-bank): validated content contract + scoring-safe import metadata.
- `e820ce3` feat(billing): manual payment flow + admin verification.
- `4fd0c4a` feat(participant): progressive delivery and grouped question flow.

## Highlights
- Question bank now supports stricter CSV contract and metadata-safe scoring inputs.
- Billing moved to operational manual verification flow while gateway integration is pending.
- Participant flow supports both full and protected delivery modes.

## Operational Notes
- Remote D1 schema is currently the source of truth for migration-sensitive changes.
- Legacy/local migration chain has historical mismatch and should be normalized in a dedicated maintenance task.
- Documentation is being reduced to execution-focused references only.

## Follow-up Commits Needed
- Frontend import UX polish for validated CSV feedback states.
- Migration-history cleanup task to align local and remote reproducibly.
- Automated test coverage pass for scoring and import edge cases.
