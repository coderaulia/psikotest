# Deploy to Cloudflare Workers

This backend now mirrors the current customer SaaS API surface used by the main frontend.

## Current route groups

- `/api/auth`
- `/api/site-auth`
- `/api/site-billing`
- `/api/site-onboarding`
- `/api/site-results`
- `/api/site-workspace`
- `/api/dashboard`
- `/api/sessions`
- `/api/customers`
- `/api/public`

## Database setup

For a fresh D1 database, run all three migrations in order:

```bash
cd workers
npm install
npm run migrate:remote
```

For local development:

```bash
npm run migrate:local
```

The new `003_customer_saas_surface.sql` migration adds the missing customer-assessment, workspace billing, participant invite, and customer-safe results tables used by the current frontend.

## Deploy

```bash
wrangler deploy
```

## Important note

The `workers/` backend is now aligned with the current SaaS workspace flow:
- customer assessment creation and setup
- dummy checkout and subscription state
- participant import/invite/reminder flows
- workspace settings and team management
- customer-safe result list/detail/export
