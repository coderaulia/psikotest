# Pricing and Entitlements

This document defines the product-facing plan model for the SaaS platform.

## Public SaaS Plans

### Starter

Suitable for teams validating the first assessment workflow.

Includes:

- low assessment capacity
- low participant capacity
- small team seat count
- core assessment delivery

### Growth

Suitable for active organizations running multiple assessments.

Includes:

- higher assessment capacity
- larger participant capacity
- more team seats
- stronger operational support for ongoing HR workflows

### Research

Suitable for academic and psychology research workspaces.

Includes:

- larger participant capacity
- custom assessments
- research-oriented export readiness
- wider operational capacity for ongoing data collection

## Non-public Plans

### White-label

Provisioned through sales or manual onboarding.

Includes:

- branding controls
- tenant-specific presentation
- feature configuration per workspace
- future custom domain support

### Enterprise

Reserved for advanced operational or compliance requirements.

May include:

- dedicated environment
- dedicated database
- advanced security or access restrictions
- special data retention or reporting requirements

## Entitlement Categories

The app enforces plan entitlements across these categories:

- active or draft assessments
- participant records
- team seats
- feature bundle availability
- result/report delivery capabilities

## Current Plan Rules

The current implementation actively enforces:

- assessment capacity
- participant capacity
- team seat capacity

The following still depend on future work:

- feature-level commercial gating beyond current limits
- metered usage over strict billing cycles
- self-serve white-label conversion
- enterprise contract-specific overrides

## Upgrade Guidance

Upgrade guidance is surfaced when usage is:

- approaching the current plan limit
- nearly full
- at the current limit

The product must explain:

- what is constrained
- why the action is blocked or at risk
- which plan is recommended next

## Billing Cycle Model

Supported billing cycles:

- monthly
- annual

The subscription stores period start and period end values so future invoice generation and usage snapshots can align to real billing windows.

## Commercial Notes

- Trial workspaces can set up and validate the experience before wide distribution.
- Paid workspaces can fully activate participant sharing.
- White-label should remain a sales-assisted offer until branding, domain, and support operations are mature.
