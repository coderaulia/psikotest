# Documentation Index

This folder holds the product, engineering, deployment, and maintenance references for the Psikotest platform.

## Current Core Docs

### Product and Workflow
- [new-flow.md](./new-flow.md)
  Current product workflow for customer, participant, reviewer, and report-release journeys.
- [compliance.md](./compliance.md)
  Compliance and ethical requirements mapped to product and engineering rules.

### Billing and Commercial
- [billing-architecture.md](./billing-architecture.md)
  Billing foundation, provider-agnostic schema, and workspace-level subscription model.
- [pricing-and-entitlements.md](./pricing-and-entitlements.md)
  Plan model and commercial entitlement categories.
- [customer-billing-flow.md](./customer-billing-flow.md)
  Customer-facing billing, checkout, invoice, and upgrade flow.
- [billing-operations.md](./billing-operations.md)
  Operational reference for subscription support, checkout history, and invoice handling.
- [white-label-commercial-flow.md](./white-label-commercial-flow.md)
  Sales-assisted white-label packaging and provisioning model.

### Content and Maintenance
- [content-editing-guide.md](./content-editing-guide.md)
  File map for editing wording across header, footer, and app content.
- [language-maintenance-guide.md](./language-maintenance-guide.md)
  Guidance for maintaining English and Bahasa Indonesia UI copy.

### Architecture and Deployment
- [architecture-overview.md](./architecture-overview.md)
  High-level system and hosting architecture.
- [auth-and-access.md](./auth-and-access.md)
  Roles, auth boundaries, and session model.
- [assessment-engine.md](./assessment-engine.md)
  Shared assessment engine, scoring, submissions, and result lifecycle.
- [database-installation.md](./database-installation.md)
  Fresh install and upgrade database packaging notes.
- [hostinger-web-deploy.md](./hostinger-web-deploy.md)
  Frontend deployment reference.
- [hostinger-api-deploy.md](./hostinger-api-deploy.md)
  API deployment reference.

## Suggested Reading Order
1. `new-flow.md`
2. `compliance.md`
3. `billing-architecture.md`
4. `customer-billing-flow.md`
5. `architecture-overview.md`
6. `auth-and-access.md`
7. `assessment-engine.md`
8. deployment and maintenance guides as needed

## Update Rules
- Update `new-flow.md` when workflow or page flow changes.
- Update `compliance.md` when privacy, consent, reviewer, or result-distribution rules change.
- Update billing docs whenever pricing logic, subscription flow, invoices, or provider integration changes.
- Update `content-editing-guide.md` and `language-maintenance-guide.md` when wording locations or translation patterns change.
- Update architecture docs when auth, workspace settings, scoring, hosting, or tenant structure changes.
- Update deployment docs whenever build, hosting, or packaging steps change.
