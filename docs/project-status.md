# Project Status

Updated: 2026-04-08

## Done
- Core auth flow (admin/customer login, JWT session checks).
- Participant flow routing (`/t/:token`) from consent to completion.
- Public landing split (`/` for B2C, `/saas` for SaaS).
- Question bank CRUD endpoints and admin page foundation.
- Scoring pipeline connected to submission flow (IQ, DISC, Workload).
- Manual payment MVP foundation with admin verification path.

## In Progress
- Question content integrity hardening for production imports.
- CSV validation quality gates (row-level errors, strict contract behavior).
- Scoring metadata consistency (`reverse`, `weight`, dimension mapping).
- Documentation cleanup for lean handoff-focused operations.

## Next
- Finalize validated question import UX feedback states in admin UI.
- Add safe CSV export/import guidance for non-technical operators.
- Expand automated tests for participant scoring regressions.
- Add email delivery integration for invite/reminder workflow.
- Prepare payment gateway transition plan (from manual verification).

## Risks / Watchlist
- Real validated psychometric item sets are still content-dependent.
- Local migration history does not fully mirror current remote schema lineage.
- Some docs still reference legacy milestones and need consolidation.
