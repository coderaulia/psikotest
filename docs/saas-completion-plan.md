# SaaS Completion Plan

This document defines the path from the current MVP into a full self-serve SaaS platform before deeper white-label expansion.

The priority is:
- complete the SaaS customer lifecycle first
- make it commercially usable and operationally manageable
- then extend the same core into white-label delivery

## Product Goal

A customer should be able to:
1. discover the product
2. sign up without webmaster involvement
3. create a workspace
4. configure the first assessment
5. preview the participant experience
6. complete payment or upgrade
7. invite participants
8. monitor completion
9. review results
10. export or release reports
11. manage the workspace team and billing state

## Current Completed Base

Already available:
- marketing site
- customer signup and login
- workspace onboarding
- assessment draft creation
- dummy checkout
- participant link generation
- participant invite list
- customer workspace settings
- workspace team and dummy teammate invites
- admin and reviewer workflow foundation

## Remaining SaaS Completion Phases

## Phase 1. Activation and workspace operations

Goal: make the self-serve workspace usable end to end.

### Build next
- real workspace billing state instead of trial-only assumptions
- plan/usage enforcement
- workspace plan summary page
- usage counters:
  - active assessments
  - participants used
  - team seats used
- customer profile completion state
- clearer activation status per assessment

### Core entities
- workspace subscription / plan
- usage counters
- activation state

### Done when
- a workspace can move from trial to upgraded state with visible limits and usage feedback

## Phase 2. Participant operations and delivery

Goal: make assessment delivery operationally strong.

### Build
- CSV participant import
- bulk invite actions
- resend invite actions
- invite status history
- copy/share link controls
- participant reminder flow
- completion tracking filters
- participant access expiry options

### Done when
- a customer can create an assessment and operate a real participant campaign without manual webmaster help

## Phase 3. Report delivery and customer reporting

Goal: make the workspace valuable after submissions are completed.

### Build
- customer-facing results dashboard with stronger summaries
- reviewed vs preliminary state visibility rules
- PDF report export
- CSV/XLSX export for research data
- released-report access logs
- customer report filters by date, assessment, status, and result mode

### Done when
- customers can retrieve and operationalize results without needing admin-side intervention for normal cases

## Phase 4. Team collaboration and governance

Goal: make the workspace safe for multi-user organizations.

### Build
- real teammate invitation emails
- teammate login activation flow
- seat limit enforcement
- role-based access in customer workspace
- activity and audit feed for workspace users
- suspension and recovery flow

### Done when
- a workspace owner can manage a real operating team with clear permissions and invite flow

## Phase 5. Billing and commercial readiness

Goal: turn the SaaS into a sellable subscription product.

### Build
- real billing provider integration
- plan upgrades and downgrades
- invoice history
- subscription status page
- failed-payment handling
- trial expiry handling
- plan-based feature gating

### Done when
- the product can run without manual billing operations for normal self-serve customers

## Cross-cutting requirements

These apply to every phase.

### Security
- workspace-scoped authorization
- safe public assessment delivery
- replay and tampering protection
- audit logging for critical actions

### Compliance
- consent storage
- result visibility policy enforcement
- review/release state enforcement
- privacy-aware participant handling

### UX
- good empty states
- clear activation states
- no dead-end flows
- visible upgrade and usage feedback

### Operations
- DB upgrade path for every feature
- deploy artifact refresh for API and DB bundles
- release notes for environment updates
- tests added with each feature slice

## Recommended Build Order

1. workspace subscription and usage model
2. customer billing/plan page
3. participant import and bulk invites
4. resend and reminder workflows
5. customer results and export layer
6. real teammate activation
7. production billing integration

## Suggested Schema Additions

Near-term likely additions:
- `workspace_subscriptions`
- `workspace_usage_counters`
- `workspace_activity_logs`
- `participant_invite_events`
- `customer_export_jobs`

## Suggested API Modules

Add or expand:
- `site-billing`
- `site-team`
- `site-participants`
- `site-results`
- `site-exports`

## Suggested Frontend Surfaces

Add or expand:
- workspace billing page
- plan and usage cards in workspace overview
- participant import page
- invite activity page
- customer results page
- export center
- teammate activation page

## Practical Rule

Do not move deeply into white-label-first work until the SaaS customer flow is commercially complete.

White-label should be built on top of a strong SaaS core, not instead of one.
