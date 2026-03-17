# Content Editing Guide

This guide shows where to edit wording in the frontend so you can maintain copy without hunting through the whole repo.

## Core rule

There are two kinds of wording in this app:

1. Static UI copy in the frontend source
2. Dynamic assessment content coming from the API or database

Edit the right source depending on which kind of text you want to change.

## Language system

The EN/ID toggle is implemented in these files:

- `src/lib/language.tsx`
- `src/components/common/language-toggle.tsx`
- `src/main.tsx`

If you want to change how language preference is stored or how the toggle works, start there.

## Header and footer copy

Public site header, footer, and top navigation wording:

- `src/layouts/marketing-layout.tsx`

Customer workspace shell wording:

- `src/components/common/customer-shell.tsx`

Admin workspace shell wording:

- `src/components/common/admin-shell.tsx`

Participant layout wrapper and language toggle placement:

- `src/layouts/participant-layout.tsx`

## Public marketing pages

Homepage:

- `src/pages/landing-page.tsx`

Manual page:

- `src/pages/manual-page.tsx`

White-label page:

- `src/pages/white-label-page.tsx`

404 page:

- `src/pages/not-found-page.tsx`

## Customer pages

Customer signup:

- `src/pages/customer/customer-signup-page.tsx`

Customer login:

- `src/pages/customer/customer-login-page.tsx`

Customer workspace overview:

- `src/pages/customer/customer-workspace-page.tsx`

Customer onboarding flow:

- `src/pages/customer/customer-onboarding-page.tsx`

Customer assessment detail:

- `src/pages/customer/customer-assessment-detail-page.tsx`

## Participant pages

Consent page:

- `src/pages/participant/consent-page.tsx`

Identity page:

- `src/pages/participant/identity-page.tsx`

Instructions page:

- `src/pages/participant/instructions-page.tsx`

Test page:

- `src/pages/participant/test-page.tsx`

Completion page:

- `src/pages/participant/completed-page.tsx`

## Admin pages

Admin login:

- `src/pages/admin/admin-login-page.tsx`

Dashboard:

- `src/pages/admin/dashboard-page.tsx`

Participants:

- `src/pages/admin/participants-page.tsx`

Test sessions:

- `src/pages/admin/test-sessions-page.tsx`
- `src/pages/admin/test-session-detail-page.tsx`

Question bank:

- `src/pages/admin/question-bank-page.tsx`

Results:

- `src/pages/admin/results-page.tsx`
- `src/pages/admin/result-detail-page.tsx`
- `src/pages/admin/reviewer-queue-page.tsx`

Reports:

- `src/pages/admin/reports-page.tsx`

Settings:

- `src/pages/admin/settings-page.tsx`

## Database-driven wording

These texts are not primarily controlled by the frontend files above:

- assessment questions
- option labels
- consent statements loaded from sessions
- privacy statements loaded from sessions
- contact person strings loaded from sessions
- seeded demo assessment content

Those come from the backend/database side.

Main sources:

- `apps/api/src/database/migrations/001_init_schema.sql`
- `deploy/install/03_seed_assessment_questions.sql`
- `deploy/install/04_seed_demo_sessions.sql`
- admin question/session management screens in the app itself

## Recommended editing workflow

1. Identify whether the text is static UI copy or database content.
2. Open the file listed above for that section.
3. If the file already has local `copy` objects for `en` and `id`, edit both languages together.
4. Run:
   - `npm run typecheck`
   - `npm run build`
5. If the wording affects user flows, also run:
   - `npm run test:frontend`

## Future cleanup recommendation

For long-term maintenance, move more page copy into shared translation modules instead of keeping text inline in many page files. The current guide is intended to make editing practical immediately, even before a full copy centralization pass is finished.
