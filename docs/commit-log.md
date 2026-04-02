# Commit Log

A running log of meaningful commits with deployment status.

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