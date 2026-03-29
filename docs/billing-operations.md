# Billing Operations

This document is for operational maintenance and support handling.

## Operational Goals

- keep workspace subscription state accurate
- keep invoices and checkout history auditable
- keep usage enforcement aligned with plan settings
- support migration from dummy billing to a live provider

## What Support or Admins Need To Check

### Subscription state

Check:

- plan code
- billing cycle
- status
- trial end
- current period start and end
- cancellation flags
- provider IDs

### Checkout state

Check:

- whether a checkout session is still open
- whether it expired or failed
- whether a dummy or provider checkout completed

### Invoice state

Check:

- invoice status
- amount total
- due date
- paid date
- invoice link fields

### Usage state

Check:

- workspace usage diagnostics
- recent usage events
- current usage snapshot
- whether a workspace is blocked because of actual limits or stale snapshot data

## Expected Support Actions

- manually move a workspace from trial to active when needed
- manually reconcile dummy checkout results during testing
- review webhook event logs for provider sync failures later
- verify invoice state before restoring a suspended workspace

## Recommended Admin Tools Later

The internal admin side should later expose:

- billing event log
- invoice list by workspace
- checkout session list by workspace
- subscription override actions
- white-label plan provisioning

## Deployment Notes

Whenever billing schema changes:

1. update `001_init_schema.sql`
2. add a new migration
3. update `scripts/package-db-deploy.ps1`
4. rebuild the database bundle
5. update customer/admin flow docs if the UI behavior changed

## Risk Notes

- Never enforce limits only in the UI.
- Never assume provider webhook delivery is reliable without event logging.
- Never hard-delete billing history needed for audits.
