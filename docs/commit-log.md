# Commit Log

A running log of meaningful commits with deployment status.

---

## [2026-04-03] - Manual Payment Billing MVP (No Gateway)

### What Changed
- Replaced customer checkout flow with manual bank-transfer payment creation
- Added payment instruction payload (bank account, exact transfer amount, unique code, payment reference, expiry)
- Added customer proof submission endpoint for pending payments
- Added admin verification endpoints to approve/reject manual payments
- Enforced activation rule: workspace subscription is activated only when admin approves payment
- Added duplicate-pending guard: active pending payment is reused instead of creating duplicates
- Added migration for `manual_payments` table with indexes
- Added customer billing UI for manual-payment instructions + proof submission
- Added admin UI section for pending payment review with approve/reject actions
- Added placeholder “Coming Soon” options for DOKU and Midtrans in customer UI (no integration yet)

### Files Affected
- `workers/migrations/011_manual_payments.sql` - NEW manual payment table
- `workers/src/routes/site-billing.ts` - Manual payment customer endpoints
- `workers/src/routes/admin-billing.ts` - NEW admin verification endpoints
- `workers/src/lib/customer-workspace.ts` - Manual pricing source of truth
- `workers/src/index.ts` - Registered admin billing route
- `src/pages/customer/customer-billing-page.tsx` - Manual payment/proof UI
- `src/pages/admin/customers-page.tsx` - Admin payment review actions
- `src/services/customer-billing.ts` - Manual payment API client
- `src/services/admin-data.ts` - Admin verification API client
- `src/types/assessment.ts` - Manual payment types
- `docs/api-endpoints.md` - Added manual payment + admin verification endpoints
- `docs/project-status.md` - Updated feature and migration status

### Deployed
- ✅ D1 migration `011_manual_payments.sql` applied (local and remote)
- ✅ Workers deployed to production
- Frontend auto-deploy from `main`

### Verified
- ✅ Frontend build + typecheck
- ✅ Workers typecheck
- ✅ Manual payment table created remotely
- ✅ Customer and admin billing endpoints available in production

---

## [2026-04-03] - Progressive Delivery (Protected Multi-Group)

### What Changed
- Added progressive delivery branching to public participant endpoints while preserving full-delivery behavior
- Updated session start response to include protected delivery metadata (`protectedDelivery`, `groupSize`, `totalGroups`)
- Updated questions endpoint to return current-group slices for protected sessions
- Added `POST /api/public/submissions/:id/next-group` endpoint with "must-answer-current-group-first" enforcement
- Added per-submission token rate limit for next-group progression
- Updated participant test page to support section-by-section loading with "Save and continue" flow
- Ensured customer assessment setup toggle persists `protected_delivery_mode` to `test_sessions`

### Files Affected
- `workers/src/routes/public-sessions.ts` - Progressive delivery metadata, grouped questions, next-group endpoint
- `workers/src/routes/site-onboarding.ts` - Persist protected delivery mode on create/update
- `src/pages/participant/test-page.tsx` - Progressive delivery UI and state transitions
- `src/services/public-sessions.ts` - Next-group client call and question loading alignment
- `src/lib/participant-session.ts` - Persist protected delivery metadata
- `src/types/assessment.ts` - Progressive delivery response typings
- `src/pages/customer/customer-assessment-setup-page.tsx` - Helper text for protected delivery toggle
- `docs/project-status.md` - Added progressive delivery to features and E2E verification table
- `docs/assessment-engine.md` - Updated protected delivery model with live endpoints and group strategy
- `docs/api-endpoints.md` - Added next-group endpoint and progressive response documentation

### Deployed
- ✅ Workers deployed to production (latest progressive deployment: `e4dbe434-1301-412a-b479-80ccf91043b0`)
- Frontend auto-deploy from `main`

### Verified
- ✅ Remote D1 schema confirms `test_sessions.protected_delivery_mode`
- ✅ Remote D1 schema confirms `submissions.current_group` and `submissions.total_groups`
- ✅ Protected session start returns grouping metadata
- ✅ Protected questions endpoint returns group-sized slice (IQ: 10)
- ✅ Next-group blocks until current section is fully answered
- ✅ Next-group increments `current_group` in D1 and returns next section

---

## [2026-04-03] - Question Bank CSV Import and Export

### What Changed
- Added CSV export endpoint for admin question bank (`GET /api/question-bank/questions/export`)
- Added CSV import endpoint with validation (`POST /api/question-bank/questions/import`)
  with `dryRun` preview and `replaceAll` support
- Added CSV import template endpoint (`GET /api/question-bank/questions/import/template`)
- Added admin UI controls for Export CSV, Import CSV modal workflow, dry-run preview, and template download
- Added Workers-safe CSV parser and import validation utility for quoted CSV parsing and row-level errors

### Files Affected
- `workers/src/routes/question-bank.ts` - Added export/import/template endpoints
- `workers/src/lib/question-bank-csv.ts` - NEW - CSV parser + validation helpers
- `src/pages/admin/question-bank-page.tsx` - Added CSV import/export UI
- `src/services/admin-data.ts` - Added CSV import/export API client helpers
- `src/services/admin-api.ts` - Added structured error payload propagation for row-level import errors
- `docs/question-bank-schema.md` - Updated flat CSV contract and endpoint behavior
- `docs/api-endpoints.md` - Added question-bank CSV endpoints
- `docs/project-status.md` - Marked question import/export as working

### Deployed
- ✅ Workers deployed to production (three progressive deploy checkpoints during implementation)
- Frontend auto-deploy from `main`

### Verified
- ✅ Frontend typecheck (`npm run typecheck`)
- ✅ Workers typecheck (`npm run typecheck` in `workers/`)
- ✅ Endpoint reachability checks on production
- ✅ Category distribution check via D1:
  - custom: 5
  - disc: 48
  - iq: 45
  - workload: 34

---

## [2026-04-03] - Question Bank Schema Contract Alignment

### What Changed
- Completed schema audit for question bank against production D1 (`questions`, `question_options`)
- Confirmed admin frontend and API already use the same normalized contract (`question_code`, `prompt`, `dimension_key`, `option_order`, etc.)
- Added canonical schema + API + CSV mapping contract document for downstream work
- Removed stale "frontend/backend schema mismatch" debt item from project status

### Files Affected
- `docs/question-bank-schema.md` - NEW - Canonical contract for question bank and CSV mapping
- `docs/project-status.md` - Removed outdated question bank mismatch debt entry

### Deployed
- No deployment required (documentation-only update)

### Verified
- ✅ Remote PRAGMA confirms active schema columns
- ✅ `src/pages/admin/question-bank-page.tsx` payload fields align with `workers/src/routes/question-bank.ts`
- ✅ `GET /api/question-bank/questions/:id` includes nested options for edit flow

---

## [2026-04-03] - Participant Question Loading and Submit Flow Fix

### What Changed
- Fixed participant test page to always load questions from submission questions endpoint, including full delivery mode
- Added Bearer `Authorization` header support in frontend submission requests for compatibility with submission-auth middleware
- Improved participant test page error handling and loading guards to avoid silent empty question state
- Re-verified production participant API flow against live D1 schema (session start, load questions, save answers, submit)

### Files Affected
- `src/pages/participant/test-page.tsx` - Use question window data for full/progressive flows
- `src/services/public-sessions.ts` - Send `Authorization: Bearer <token>` for submission routes

### Deployed
- Frontend auto-deploy from `main`
- No new Workers deploy required for this frontend mapping fix

### Verified
- ✅ Production D1 schema reconfirmed (`questions`, `question_options`, `test_sessions`, `submissions`)
- ✅ `GET /api/public/submissions/:id/questions` returns populated question payloads
- ✅ `npm run typecheck`
- ✅ `npm test -- test-page.test.tsx consent-page.test.tsx completed-page.test.tsx`

---

## [2026-04-02] - B2C Landing Split

### What Changed
- Replaced `/` with a B2C-first landing page focused on immediate test starts
- Moved the existing SaaS marketing landing to `/saas`
- Added hardcoded public-session routing for DISC, IQ, and workload CTAs
- Positioned free snapshot vs full report without changing backend result behavior
- Preserved existing participant, SaaS, and white-label flows

### Files Affected
- `src/pages/public/landing-page.tsx` - NEW - B2C landing page
- `src/pages/saas-landing-page.tsx` - NEW - SaaS landing export
- `src/app/router.tsx` - Added `/saas` route and new `/` landing
- `src/layouts/marketing-layout.tsx` - Updated shared marketing navigation
- `src/pages/landing-page.test.tsx` - Updated landing coverage for new root path
- `docs/project-status.md` - Updated public route map

### Deployed
- Frontend pending deployment

### Verified
- ✅ `npm run check`
- ✅ `npm test -- landing-page.test.tsx`
- Pending production smoke test on `/`, `/saas`, and the three `/t/:token` entries

---

## [2026-04-02] — Assessment Creation test_type_id FK Fix

### What Changed
- Fixed NOT NULL constraint failure on test_sessions.test_type_id
- Added test_type string → test_type_id resolution before INSERT
- Added proper error handling with 400 response for invalid test types
- Updated both CREATE and PATCH assessment endpoints

### Root Cause
The test_sessions table has test_type_id INTEGER NOT NULL (FK to test_types)
but the code was only inserting test_type TEXT string. The test_type_id
column requires a resolved foreign key reference.

### Files Affected
- `workers/src/routes/site-onboarding.ts` - Added test_type_id resolution

### Deployed
- ✅ Workers deployed to production

---

## [2026-04-02] — Assessment Creation 500 Fix

### What Changed
- Fixed 500 Internal Server Error on POST /api/site-onboarding/assessments
- Removed non-existent columns from test_sessions INSERT statement
- Columns removed: participant_count, completed_count, created_by
- These columns were never part of the test_sessions schema

### Root Cause
The INSERT statement referenced columns that don't exist in test_sessions:
- `participant_count` - not a column (count queried via participants table)
- `completed_count` - not a column (count queried via submissions table)
- `created_by` - not a column (only `created_by_admin_id` exists for admin-created sessions)

### Files Affected
- `workers/src/routes/site-onboarding.ts` - Fixed INSERT columns

### Deployed
- ✅ Workers deployed to production

---

## [2026-04-02] — Rate Limiting & Security Headers

### What Changed
- Implemented D1-backed rate limiting middleware for auth and submission endpoints
- Added security response headers to all API responses
- Rate limits:
  - Admin login: 5 req/15 min per IP
  - Customer login: 10 req/15 min per IP
  - Customer signup: 5 req/hour per IP
  - Forgot password: 3 req/15 min per IP
  - Reset password: 5 req/15 min per IP
  - Test start: 3 req/5 min per IP
  - Answer saves: 60 req/5 min per submission token
  - Test submit: 3 req/5 min per submission token
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- CORS already properly configured (no wildcards)

### Files Affected
- `workers/src/middleware/rate-limit.ts` - NEW - Rate limiting middleware
- `workers/src/middleware/security-headers.ts` - NEW - Security headers middleware
- `workers/src/index.ts` - Added security headers middleware
- `workers/src/routes/auth.ts` - Added rate limits to login, forgot-password
- `workers/src/routes/site-auth.ts` - Added rate limits to login, signup, forgot-password, reset-password
- `workers/src/routes/public-sessions.ts` - Added rate limits to start, answers, submit
- `workers/migrations/008_rate_limiting.sql` - NEW - Rate limit counter table

### Migration Applied
- ✅ `008_rate_limiting.sql` (local and remote)

### Deployed
- ✅ Workers deployed to production

### Verified in Production
- ✅ Rate limiting returns 429 with Retry-After header when exceeded
- ✅ Security headers present in responses
- ✅ X-RateLimit-Limit, X-RateLimit-Remaining headers set

---

## [2026-04-02] — Scoring & Report Export

### What Changed
- Implemented professional scoring algorithms for IQ, DISC, and Workload tests
- Seeded 85 demonstration questions (37 IQ, 24 DISC, 24 Workload)
- Fixed public-sessions to use correct `questions` and `question_options` tables
- Added scoring results to `result_summaries` table dimension breakdowns
- Created print-optimized report pages for admin and customer portals
- Added CSS bar visualizations for dimension scores (print-safe)
- Added PDF endpoint stubs for future automation

### Files Affected
- `workers/src/lib/scoring/index.ts` - NEW - IQ, DISC, Workload scoring algorithms
- `workers/src/routes/public-sessions.ts` - Fixed table queries, integrated scoring
- `workers/src/routes/results.ts` - Added GET /:id/pdf stub
- `workers/src/routes/site-results.ts` - Added GET /:id/pdf stub
- `workers/seeds/seed_iq_questions.sql` - NEW - IQ questions (Indonesian)
- `workers/seeds/seed_disc_questions.sql` - NEW - DISC questions (Indonesian)
- `workers/seeds/seed_workload_questions.sql` - NEW - Workload questions (Indonesian)
- `src/pages/admin/report-export-page.tsx` - Enhanced with dimension bars, print CSS
- `src/pages/customer/customer-report-export-page.tsx` - NEW - Customer print report
- `src/app/router.tsx` - Added customer export route

### Seeds Applied
- ✅ IQ questions (37 total: 10 pattern, 10 numerical, 10 verbal, 7 spatial)
- ✅ DISC questions (24 total: 6 per dimension D/I/S/C)
- ✅ Workload questions (24 total: 4 per NASA-TLX dimension)

### Deployed
- ✅ Workers deployed to production
- ✅ Seeds applied to remote database
- Frontend pending deployment

### Verified in Production
- ✅ Questions seeded correctly (verified via D1 query)
- ✅ Scoring module returns proper result structures
- Pending: E2E test of report download flow

---

## [2026-04-01] — Password Reset Flow

### What Changed
- Added admin password reset endpoints (`/api/auth/forgot-password`, `/api/auth/reset-password`)
- Added customer password reset endpoints (`/api/site-auth/forgot-password`, `/api/site-auth/reset-password`)
- Added reset password page for customers
- Added forgot password flow to customer login

### Files Affected
- `workers/src/routes/auth.ts` - Admin reset endpoints
- `workers/src/routes/site-auth.ts` - Customer reset endpoints
- `workers/migrations/005_password_resets.sql` - Password reset tokens table
- `src/pages/customer/customer-login-page.tsx` - Forgot password UI
- `src/pages/customer/customer-signup-page.tsx` - Reset password redirect

### Migration Applied
- ✅ `005_password_resets.sql`

### Deployed
- ✅ Workers deployed to production
- ✅ Frontend deployed

### Verified in Production
- ✅ Admin forgot password works
- ✅ Customer forgot password works
- ✅ Password reset token validation works

---

## [2026-04-01] — Question Bank Management

### What Changed
- Added question bank routes (`/api/question-bank/questions`)
- Created frontend question bank management page
- Added CRUD endpoints for questions

### Files Affected
- `workers/src/routes/question-bank.ts` - New routes
- `workers/src/index.ts` - Route registration
- `workers/migrations/006_add_question_bank.sql` - Question bank table
- `src/pages/admin/question-bank-page.tsx` - Management UI
- `src/services/admin-data.ts` - API service functions

### Migration Applied
- ✅ `006_add_question_bank.sql`

### Deployed
- ✅ Workers deployed
- ✅ Frontend deployed

### Verified in Production
- ✅ Question list loads
- ✅ Create question works
- ✅ Edit question works

---

## [2026-04-01] — Settings App Settings Table

### What Changed
- Added `app_settings` table for platform configuration
- Made settings route defensive (returns defaults if table missing)

### Files Affected
- `workers/migrations/007_add_app_settings.sql`
- `workers/src/routes/settings.ts` - Defensive queries

### Migration Applied
- ✅ `007_add_app_settings.sql`

### Deployed
- ✅ Workers deployed

### Verified in Production
- ✅ Settings page loads without error

---

## [2026-04-01] — API Fixes Batch

### What Changed
- Fixed column name `s.test_session_id` → `s.session_id` in results.ts
- Added `/api/dashboard/summary` endpoint for frontend
- Added `/api/results/:id/review-status` endpoint (frontend compatibility)
- Fixed participants `totalSubmissions` count query
- Fixed customers session count join

### Files Affected
- `workers/src/routes/results.ts` - Column fix, new endpoint
- `workers/src/routes/dashboard.ts` - Summary endpoint
- `workers/src/routes/participants.ts` - Count fix
- `workers/src/routes/customers.ts` - Join fix

### Migration Applied
- None (code fixes only)

### Deployed
- ✅ Workers deployed

### Verified in Production
- ✅ Results page loads
- ✅ Dashboard loads
- ✅ Participants list loads
- ✅ Customers list loads

---

## [2026-04-01] — Defensive Routes

### What Changed
- Made question-bank routes return empty array on error
- Made settings routes return defaults on missing table

### Files Affected
- `workers/src/routes/question-bank.ts` - Try-catch wrapper
- `workers/src/routes/settings.ts` - Try-catch wrapper

### Migration Applied
- None

### Deployed
- ✅ Workers deployed

### Verified in Production
- ✅ API returns 200 instead of 500 when tables missing

---

## [2026-03-31] — Public Sessions Scoring

### What Changed
- Implemented question fetching from database
- Added basic scoring algorithms (IQ, DISC, Workload)
- Created result records on submission
- Updated submission status workflow

### Files Affected
- `workers/src/routes/public-sessions.ts` - Complete scoring implementation

### Migration Applied
- None (used existing tables)

### Deployed
- ✅ Workers deployed

### Verified in Production
- ✅ Test submission creates result
- ✅ Questions load from database
- ✅ Scores calculated

---

## [2026-03-31] — Customer SaaS Flow

### What Changed
- Aligned Workers API with customer SaaS workspace features
- Added customer assessment management endpoints
- Added participant invite/remind functionality
- Added workspace team management

### Files Affected
- `workers/src/routes/site-onboarding.ts` - Assessment management
- `workers/src/routes/site-workspace.ts` - Team management
- `workers/src/routes/site-billing.ts` - Billing overview
- `workers/src/routes/site-results.ts` - Customer results

### Migration Applied
- ✅ `003_customer_saas_surface.sql`

### Deployed
- ✅ Workers deployed
- ✅ Frontend deployed

### Verified in Production
- ✅ Customer signup flow works
- ✅ Assessment creation works
- ✅ Participant invite works

---

## [2026-03-30] — MySQL to D1 Migration

### What Changed
- Removed old MySQL backend (apps/api/)
- Cleaned up leaked credentials from old config
- Removed stale documentation references

### Files Affected
- Removed: `apps/api/` directory
- Removed: Old MySQL config files
- Updated: `README.md`
- Updated: Various docs

### Migration Applied
- D1 already migrated

### Deployed
- ✅ Workers only deployment

### Verified in Production
- ✅ No MySQL references in code
- ✅ All D1 queries work

---

## [2026-03-30] — Admin API Endpoints

### What Changed
- Added missing admin API endpoints to Workers
- Implemented test sessions management
- Implemented results management
- Implemented question bank (initial)

### Files Affected
- `workers/src/routes/dashboard.ts`
- `workers/src/routes/test-sessions.ts`
- `workers/src/routes/results.ts`
- `workers/src/routes/reports.ts`
- `workers/src/routes/settings.ts`

### Migration Applied
- ✅ `004_admin_api_support.sql`

### Deployed
- ✅ Workers deployed

### Verified in Production
- ✅ Admin dashboard loads
- ✅ Test sessions management works
- ✅ Results review works

---

## Commit Statistics (Last 30 Days)

| Category | Count |
|----------|-------|
| Features | 15 |
| Fixes | 12 |
| Docs | 8 |
| Refactor | 3 |
| Tests | 0 |

---

## Deployment Checklist

Before each deployment:
- [ ] All migrations applied locally
- [ ] All migrations applied to remote D1
- [ ] Workers deployed: `wrangler deploy`
- [ ] Frontend deployed: auto from main branch
- [ ] Health check passes: `GET /api/health`
- [ ] Login flow works (admin + customer)
- [ ] Test submission flow works

---

## Rollback Procedure

If deployment fails:

1. **Quick rollback (Wokers):**
   ```bash
   # Find last working version
   wrangler deployments list
   
   # Rollback
   wrangler rollback --version <version_id>
   ```

2. **Database rollback (if needed):**
   ```sql
   -- Manual SQL to revert changes
   -- Each migration should have a corresponding rollback
   -- Store in: workers/rollback/<number>_rollback_<name>.sql
   ```

3. **Frontend rollback:**
   ```bash
   # Cloudflare Pages - rollback via dashboard
   # Or revert git commit and re-deploy
   git revert <commit_hash>
   git push origin main
   ```

---

## Future Commits Log

*This section will be updated after each feature sprint.*

**Format:**
```
## [YYYY-MM-DD] — [feature/fix name]

### What Changed
- Bullet list of changes

### Files Affected
- List affected files

### Migration Applied
- Migration names or "None"

### Deployed
- Workers: yes/no
- Frontend: yes/no

### Verified in Production
- Test results
```
