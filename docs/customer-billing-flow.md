# Customer Billing Flow

This document describes the current and target billing flow for customer workspaces.

## Current Stage

The platform currently uses dummy billing with real entitlement enforcement.

That means:

- workspaces can select a plan
- limits affect assessment, participant, and team operations
- checkout is simulated
- billing data structures are now being expanded for provider-backed billing later

## Customer Flow

Signup
↓
Workspace created
↓
Trial subscription initialized
↓
Create first assessment draft
↓
Preview the participant journey
↓
Open billing or assessment checkout
↓
Select plan and billing cycle
↓
Complete dummy checkout
↓
Activate sharing
↓
Monitor usage and upgrade pressure

## Billing Page Responsibilities

The workspace billing page should show:

- current plan
- plan description
- current usage
- upgrade pressure and diagnostics
- current billing period
- recent checkout attempts
- invoice history
- billing contact email

## Checkout Session Lifecycle

A checkout session may be:

- `open`
- `completed`
- `expired`
- `failed`

Dummy checkout uses the same internal contract as future provider-based checkout.

The checkout flow currently implemented is:
1. User clicks "Save workspace plan"
2. API creates a checkout session in an `open` state via `POST /api/site-billing/checkout-session`
3. Frontend simulates payment delay
4. Frontend triggers `PATCH /api/site-billing/subscription` which generates an invoice and completes the dummy flow by activating the selected plan.
This perfectly tracks the 2-step checkout requirement before any payment gateways are implemented.

## Invoice Lifecycle

Invoices may be:

- `draft`
- `open`
- `paid`
- `void`
- `uncollectible`

In the current phase, invoices may still be seeded or generated in dummy mode, but the UI and storage model should already match the later production flow.

## Upgrade Triggers

The app should route users to billing when:

- assessment capacity is exhausted
- participant capacity is exhausted
- team seats are exhausted
- a premium-only feature is requested later

## Customer Roles

- owner: can change subscription and billing settings
- admin: can view billing and operational usage
- operator/reviewer: should not change the subscription

## Future Provider Integration

When a real payment provider is added, this flow should remain the same from the workspace perspective.

Only the internal implementation changes:

- checkout session creation becomes provider-backed
- webhook events update invoice/subscription state
- payment failures update `past_due` or `suspended` status
- invoice history becomes provider-synced


