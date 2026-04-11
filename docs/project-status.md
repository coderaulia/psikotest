# Project Status

Updated: 2026-04-11

## Done
- Core auth flow (admin/customer login, JWT session checks).
- Participant flow routing (`/t/:token`) from consent to completion.
- Public landing split (`/` for B2C, `/saas` for SaaS).
- Question bank CRUD endpoints and admin page foundation.
- Scoring pipeline connected to submission flow (IQ, DISC, Workload).
- Manual payment MVP foundation with admin verification path.
- Workspace settings fully wired (all 5 new fields, Growth-plan gating).
- Completed page: custom `completionPageMessage` and 5s countdown redirect via `postSubmitRedirectUrl`.
- TypeScript clean — 0 errors across all frontend modules.

## Next
- Customer-facing report export page (`/workspace/results/:id/export`).
- Reviewer queue UI: assignment dropdown + scope filter.
- Admin billing: manual payment approve/reject workflow.
- Stricter `distributionPolicy` enforcement on result delivery endpoints.
- Email delivery integration for invite/reminder workflow.
- Server-generated PDF reports.

## Risks / Watchlist
- Real validated psychometric item sets are still content-dependent.
- Local migration history does not fully mirror current remote schema lineage.
