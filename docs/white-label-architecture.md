# White-label Architecture

This document describes the architectural direction for the white-label product built on top of the shared SaaS platform.

## Shared-core Model

White-label should use the same codebase and API as the core SaaS platform.

That means:

- one shared assessment engine
- one shared scoring system
- one shared result and reviewer workflow
- tenant-aware branding and routing layered on top

## Current Short-term Model

The current SaaS tenant model is based on customer accounts and workspace-owned assessments.

This is sufficient for MVP and early white-label pilots, but it should evolve into a more normalized tenant model over time.

## Long-term Tenant Schema Direction

The preferred long-term structure is:

- `workspace_users`
- `workspaces`
- `workspace_members`
- `workspace_domains`
- `workspace_branding`
- `workspace_settings`
- `workspace_subscriptions`
- `workspace_features`

All operational data should ultimately be scoped through the workspace boundary.

## Domain Strategy

Near-term:

- SaaS uses the main Vanaila domain
- white-label may use subdomains or manually provisioned domains later

Long-term:

- host-based tenant resolution
- custom domain mapping per workspace
- workspace-specific branding and legal copy

## Commercial Relationship

White-label remains part of the same platform, but it is packaged differently:

- branding features enabled
- optional domain setup
- likely manual provisioning first
- potentially separate enterprise infrastructure later
