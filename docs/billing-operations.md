# Billing Operations

This document is for operational maintenance and support handling.

## Operational Goals

- Keep workspace subscription state accurate
- Keep invoices and checkout history auditable
- Keep usage enforcement aligned with plan settings
- Support migration from dummy billing to a live provider

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `workspace_subscriptions` | Plan state, limits, billing cycle |
| `billing_checkout_sessions` | Checkout tracking (dummy + Stripe ready) |
| `billing_invoices` | Invoice history |
| `billing_webhook_events` | Provider webhook logs (future) |
| `workspace_usage_events` | Usage event stream |
| `workspace_usage_snapshots` | Current usage aggregates |

### Key Columns

**workspace_subscriptions:**
- `plan_code`: starter | growth | research
- `status`: trial | active | past_due | suspended
- `billing_cycle`: monthly | annual
- `assessment_limit`, `participant_limit`, `team_member_limit`
- `trial_ends_at`, `renews_at`, `current_period_start`, `current_period_end`

**workspace_usage_events:**
- `metric_key`: assessment_created | participant_added | team_member_added | result_exported
- `reference_type`, `reference_id`: Links to related entity

## What Support or Admins Need To Check

### Subscription State

```sql
SELECT id, customer_account_id, plan_code, status, billing_cycle,
       assessment_limit, participant_limit, team_member_limit,
       trial_ends_at, renews_at, current_period_end
FROM workspace_subscriptions
WHERE customer_account_id = ?;
```

### Checkout State

```sql
SELECT id, session_key, plan_code, billing_cycle, status,
       checkout_url, expires_at, completed_at
FROM billing_checkout_sessions
WHERE customer_account_id = ?
ORDER BY created_at DESC
LIMIT 10;
```

### Invoice History

```sql
SELECT id, invoice_number, status, currency_code,
       amount_total, issued_at, paid_at
FROM billing_invoices
WHERE customer_account_id = ?
ORDER BY created_at DESC
LIMIT 20;
```

### Usage Diagnostics

```sql
SELECT metric_key, COUNT(*) as count, MAX(occurred_at) as last_occurrence
FROM workspace_usage_events
WHERE customer_account_id = ?
  AND occurred_at >= datetime('now', '-30 days')
GROUP BY metric_key;
```

## D1 Migration Commands

### Check Remote Schema

```bash
# List all tables
wrangler d1 execute psikotest-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check table schema
wrangler d1 execute psikotest-db --remote --command "PRAGMA table_info(workspace_subscriptions);"

# Check specific migration applied
wrangler d1 execute psikotest-db --remote --command "SELECT * FROM workspace_subscriptions LIMIT 1;"
```

### Apply Migrations

```bash
# Apply migration locally (test first)
wrangler d1 execute psikotest-db --local --file="./migrations/008_new_migration.sql"

# Apply migration to remote (production)
wrangler d1 execute psikotest-db --remote --file="./migrations/008_new_migration.sql"

# Apply all migrations in order (for fresh database)
for file in workers/migrations/*.sql; do
  wrangler d1 execute psikotest-db --remote --file="$file"
done
```

### Verify Migration

```bash
# Check current database state
wrangler d1 execute psikotest-db --remote --command "SELECT sql FROM sqlite_master WHERE type='table' AND name='workspace_subscriptions';"

# Count rows in a table
wrangler d1 execute psikotest-db --remote --command "SELECT COUNT(*) FROM billing_invoices;"
```

## Current Plan Limits

| Plan | Assessments | Participants | Team Seats |
|------|-------------|--------------|------------|
| Starter | 3 | 100 | 1 |
| Growth | 15 | 1,000 | 5 |
| Research | 50 | 10,000 | 20 |

## Expected Support Actions

### Manually Activate Trial

```sql
UPDATE workspace_subscriptions
SET status = 'active',
    trial_ends_at = NULL
WHERE customer_account_id = ?;
```

### Extend Trial Period

```sql
UPDATE workspace_subscriptions
SET trial_ends_at = datetime('now', '+7 days')
WHERE customer_account_id = ?;
```

### Override Plan Limits

```sql
UPDATE workspace_subscriptions
SET assessment_limit = 100,
    participant_limit = 5000,
    team_member_limit = 10
WHERE customer_account_id = ?;
```

### Reset Usage Snapshot

```sql
DELETE FROM workspace_usage_snapshots WHERE customer_account_id = ?;

-- Trigger recalculation via API call to:
-- GET /api/site-billing/overview
```

### Cancel Subscription

```sql
UPDATE workspace_subscriptions
SET cancel_at_period_end = 1,
    canceled_at = datetime('now')
WHERE customer_account_id = ?;
```

## Deployment Notes

### Migration Workflow

1. **Create migration file:**
   ```bash
   # Create new migration
   touch workers/migrations/008_new_feature.sql
   ```

2. **Write migration SQL:**
   ```sql
   -- 008_new_feature.sql
   ALTER TABLE workspace_subscriptions ADD COLUMN new_field TEXT;
   CREATE INDEX IF NOT EXISTS idx_new ON workspace_subscriptions(new_field);
   ```

3. **Test locally:**
   ```bash
   wrangler d1 execute psikotest-db --local --file="./migrations/008_new_feature.sql"
   ```

4. **Verify locally:**
   ```bash
   wrangler d1 execute psikotest-db --local --command "PRAGMA table_info(workspace_subscriptions);"
   ```

5. **Deploy to production:**
   ```bash
   wrangler d1 execute psikotest-db --remote --file="./migrations/008_new_feature.sql"
   ```

6. **Verify in production:**
   ```bash
   wrangler d1 execute psikotest-db --remote --command "PRAGMA table_info(workspace_subscriptions);"
   ```

7. **Commit migration:**
   ```bash
   git add workers/migrations/008_new_feature.sql
   git commit -m "feat: add new_field to workspace_subscriptions"
   ```

### Zero-Downtime Deployments

- **Safe changes:** Adding columns, creating indexes, adding tables
- **Risky changes:** Dropping columns, renaming tables, changing data types
- **Recommendation:** Always use additive migrations; never drop columns in production

## Stripe Integration (Future)

When moving from dummy billing to Stripe:

1. Add environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

2. Create Stripe products and prices matching plan codes

3. Update `billing_provider` column from 'dummy' to 'stripe'

4. Implement webhook handler:
   ```
   POST /api/site-billing/webhooks/stripe
   ```

5. Replace dummy checkout with Stripe Checkout

6. Keep dummy data for audit trail

## Risk Notes

- **Never** enforce limits only in the UI
- **Never** assume provider webhook delivery is reliable without event logging
- **Never** hard-delete billing history needed for audits
- **Always** test migrations locally before remote
- **Always** verify row counts after migration
- **Always** backup D1 before risky operations (export to SQL)

## Monitoring Queries

### Daily Health Check

```sql
-- Active subscriptions
SELECT COUNT(*) FROM workspace_subscriptions WHERE status = 'active';

-- Trials expiring soon
SELECT COUNT(*) FROM workspace_subscriptions
WHERE status = 'trial'
  AND trial_ends_at <= datetime('now', '+3 days');

-- Recent checkouts
SELECT COUNT(*) FROM billing_checkout_sessions
WHERE created_at >= datetime('now', '-24 hours');

-- Recent invoices
SELECT COUNT(*) FROM billing_invoices
WHERE created_at >= datetime('now', '-7 days');
```

### Usage Patterns

```sql
-- Top users by assessment count
SELECT customer_account_id, COUNT(*) as count
FROM customer_assessments
GROUP BY customer_account_id
ORDER BY count DESC
LIMIT 10;

-- Active usage this month
SELECT customer_account_id,
       SUM(CASE WHEN metric_key = 'assessment_created' THEN 1 ELSE 0 END) as assessments,
       SUM(CASE WHEN metric_key = 'participant_added' THEN 1 ELSE 0 END) as participants
FROM workspace_usage_events
WHERE occurred_at >= datetime('now', '-30 days')
GROUP BY customer_account_id;
```