# White-label Commercial Flow

This document describes how white-label should be sold and provisioned while sharing the same core platform and API.

## Core Rule

White-label is not a separate assessment engine.

It uses:

- the same API
- the same scoring engine
- the same submission and result model
- the same tenant-aware workspace foundation

What changes is:

- branding
- domain strategy
- commercial packaging
- customer provisioning workflow

## Recommended Near-term Flow

Sales or inquiry
↓
Qualification
↓
Manual quote or package selection
↓
Workspace provisioning
↓
Branding setup
↓
Optional domain setup
↓
Feature activation
↓
Go-live

## Why White-label Should Not Be Self-serve First

The current platform still needs:

- stronger branding controls
- custom domain operations
- billing support for premium plans
- better tenant provisioning support

Until those pieces are mature, white-label should remain a managed offer.

## Commercial Packaging

### White-label

Suitable for:

- companies wanting their own branded assessment portal
- universities or labs wanting a branded research portal
- agencies offering assessment services under their own brand

### Enterprise white-label

Suitable for:

- dedicated infrastructure requirements
- dedicated database requirements
- advanced compliance or contractual controls

## Technical Model

The preferred long-term schema is:

- `workspace_users`
- `workspaces`
- `workspace_members`
- `workspace_domains`
- `workspace_branding`
- `workspace_settings`
- `workspace_subscriptions`
- `workspace_features`

The current SaaS model remains the short-term base, but it should evolve toward that normalized tenant structure.

## Provisioning Checklist

For each white-label workspace, operations should later configure:

- tenant slug or domain
- brand name
- logo and primary colors
- default legal text
- support contact
- enabled assessment modules
- billing plan
- reviewer/report workflow requirements

## Relationship To SaaS Billing

White-label still uses the same billing foundation, but:

- plan enablement is more manual
- branding/domain features are part of the commercial tier
- contracts may override the standard self-serve plans
