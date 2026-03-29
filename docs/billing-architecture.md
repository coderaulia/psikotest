# Billing Architecture

This document defines the billing foundation for the Vanaila Psikotest SaaS and the shared-core white-label platform.

## Principles

- Billing is scoped to a workspace, not to an individual login.
- Entitlements are enforced by the backend.
- The billing provider is an implementation detail behind the same internal subscription model.
- White-label uses the same billing engine and API, but with different commercial provisioning.

## Core Model

A workspace subscription controls:

- active or draft assessment capacity
- participant record capacity per billing period
- team seat capacity
- enabled feature bundles
- renewal and payment state

The current backend stores this state in `workspace_subscriptions` and related billing tables.

## Subscription States

The system supports these workspace subscription states:

- `trial`
- `active`
- `past_due`
- `suspended`

Operational cancellation is tracked through timestamps and `cancel_at_period_end`, instead of immediately deleting or downgrading the workspace.

## Billing Provider Model

The platform must remain provider-agnostic.

Current provider values:

- `dummy`
- `manual`
- `stripe`

This allows the app to ship with dummy checkout first, then move to a live provider without changing the workspace-facing contract.

## Billing Data Flow

Workspace signup
↓
Trial subscription initialized
↓
Usage tracked against workspace entitlements
↓
Dummy or provider checkout session created
↓
Provider/customer IDs stored on subscription
↓
Webhook or manual sync updates invoice/subscription state
↓
Workspace billing overview reflects the current operational state

## Usage Tracking

Usage is tracked in two layers:

- `workspace_usage_events`
  Fine-grained operational events such as participant additions, team growth, and assessment creation.
- `workspace_usage_snapshots`
  Current or period-based aggregate usage for billing overview and enforcement.

The app may still calculate live counts from operational tables, but snapshots are the long-term source for billing-cycle reporting.

## Billing Tables

### `workspace_subscriptions`

The canonical workspace subscription row.

Stores:

- plan code
- billing cycle
- limits
- provider identifiers
- billing contact email
- current period boundaries
- cancellation and dunning timestamps
- plan version

### `billing_checkout_sessions`

Tracks initiated checkout attempts for dummy billing and future provider redirects.

Use cases:

- checkout history
- stale/expired checkout cleanup
- plan selection audit
- upgrade conversion analysis

### `billing_invoices`

Tracks invoice metadata used by the customer billing page and billing operations.

Use cases:

- invoice history
- paid / open / void status
- downloadable invoice links later
- reconciliation with provider events

### `billing_webhook_events`

Stores raw billing provider webhook events and their processing state.

Use cases:

- idempotent webhook handling
- auditability
- failure retries
- support diagnostics

### `workspace_usage_events`

Stores usage increments tied to operational actions.

Examples:

- assessment created
- participant added
- team member invited
- result exported

### `workspace_usage_snapshots`

Stores summarized usage for a subscription period.

## Enforcement Layer

The backend must enforce:

- assessment creation limits
- participant record limits
- team seat limits
- feature flags where applicable

The frontend may warn or guide upgrades, but it is not the enforcement source.

## White-label Reuse

White-label workspaces still use the same billing model and API.

Differences are commercial and configuration-driven:

- white-label plans are provisioned manually first
- branding and domain settings are tenant-level features
- enterprise billing may later use dedicated provider/customer mapping

## Near-term Implementation Scope

This billing foundation phase adds:

- richer subscription fields
- checkout session table
- invoice table
- webhook event log
- usage event and snapshot tables
- provider-ready API responses

It does not yet add:

- real payment collection
- invoice PDFs
- payment method management
- automated subscription proration
