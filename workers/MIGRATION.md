# MySQL to D1 Migration Guide

The Workers backend now requires three migrations for parity with the main SaaS frontend:

1. `001_initial_schema.sql`
2. `002_add_missing_tables.sql`
3. `003_customer_saas_surface.sql`

## What migration 003 adds

- `customer_assessments`
- `customer_assessment_participants`
- `workspace_subscriptions`
- `billing_checkout_sessions`
- `billing_invoices`
- `billing_webhook_events`
- `workspace_usage_events`
- `workspace_usage_snapshots`
- `workspace_plan_features`
- invite tracking columns on `customer_workspace_members`

This is the minimum D1 shape required by the current customer workspace frontend.

## Existing D1 databases

If you already ran 001 and 002 on an older Worker database, apply only:

```bash
wrangler d1 execute psikotest-db --file=./migrations/003_customer_saas_surface.sql
```

## Fresh D1 databases

Use:

```bash
npm run migrate:remote
```
