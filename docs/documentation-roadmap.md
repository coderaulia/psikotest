# Documentation Roadmap

This document defines the documentation structure that should support the next stages of Psikotest as both a real SaaS platform and a white-label web application.

It is a planning reference, not a finished technical spec.

## Purpose

The docs should make it easy to:
- understand the current product and architecture quickly
- extend the app without rediscovering decisions
- onboard future developers
- support deployment, support, and maintenance
- separate SaaS concerns from white-label concerns
- keep compliance and security decisions visible during development

## Documentation Groups

## 1. Product and Workflow Docs

### Keep and maintain
- `new-flow.md`
- `compliance.md`
- `development-phases.md`

### Add next
- `customer-journey.md`
  End-to-end customer journey from landing page to signup, onboarding, activation, upgrade, and retention.
- `participant-journey.md`
  Participant flow from consent to completion and result visibility.
- `reviewer-workflow.md`
  Reviewer and psychologist flow for draft review, release, and report delivery.
- `white-label-offering.md`
  White-label positioning, packaging, onboarding, and operating model.

Update when:
- page flows change
- new roles are introduced
- release logic changes
- white-label scope changes

## 2. Architecture Docs

### Current core docs
- `architecture-overview.md`
  High-level system architecture with frontend, API, database, deploy artifacts, and hosting topology.
- `auth-and-access.md`
  Roles, permissions, session model, token model, reviewer access, and future SSO direction.
- `assessment-engine.md`
  How question content, scoring logic, submissions, results, and release states work.

### Add next
- `tenant-model.md`
  Multi-tenant model for SaaS workspaces, white-label tenants, ownership, and branding boundaries.
- `report-lifecycle.md`
  Preliminary score, review, approval, release, and distribution workflow.

Update when:
- schema or API contracts change
- tenant model changes
- auth model changes
- scoring or report-state logic changes

## 3. Frontend Docs

### Add
- `frontend-structure.md`
  Route map, layouts, shared UI patterns, feature boundaries, and lazy-loading strategy.
- `design-system-usage.md`
  Tailwind, shadcn/ui usage rules, typography, spacing, motion, and page hierarchy guidelines.
- `copy-and-localization.md`
  Translation structure, EN/ID strategy, wording ownership, and future i18n scaling.

Update when:
- routes change
- shared components or layout patterns change
- language architecture changes
- visual system rules change

## 4. Backend Docs

### Add
- `api-reference.md`
  Route groups, auth requirements, input/output expectations, and public vs protected endpoints.
- `database-evolution.md`
  Migration strategy, install bundles, upgrade bundles, and schema change policy.
- `background-jobs-and-email.md`
  Future async jobs, notifications, report delivery, retries, and queue strategy.

Update when:
- new endpoints are introduced
- migration packaging changes
- email or async processing is added

## 5. Security and Compliance Docs

### Add
- `security-model.md`
  Threat model, rate limiting, token handling, CORS policy, headers, test security, and operational risks.
- `data-governance.md`
  PII handling, retention, deletion, audit logs, consent storage, and result access policies.
- `incident-response.md`
  What to do if login is abused, data leaks, deployment breaks, or reports are released incorrectly.

Update when:
- security controls change
- hosting or auth model changes
- compliance or retention requirements change

## 6. SaaS and White-label Business Docs

### Add
- `pricing-and-plans.md`
  SaaS plan model, feature gates, participant limits, and upgrade logic.
- `workspace-lifecycle.md`
  Trial, activation, paid workspace, suspension, archival, and account recovery.
- `white-label-architecture.md`
  Branding settings, custom domain strategy, tenant isolation, and deployment model.
- `implementation-packages.md`
  SaaS self-serve vs managed setup vs dedicated white-label implementation.

Update when:
- billing logic changes
- white-label scope changes
- customer tiers or packaging changes

## 7. QA and Release Docs

### Add
- `testing-strategy.md`
  Unit, integration, frontend, E2E, and manual regression coverage expectations.
- `release-checklist.md`
  Required checks before frontend deploy, API upload, and database changes.
- `known-risks-and-gaps.md`
  Open technical debt, MVP limitations, and deferred items.

Update when:
- test coverage strategy changes
- deployment process changes
- new major risks are identified

## 8. Operations Docs

### Add
- `operations-runbook.md`
  Monitoring, backups, restore steps, deploy order, rollback order, and live issue handling.
- `hostinger-environment-map.md`
  Domain mapping, frontend/app/API separation, environment variables, and artifact locations.
- `support-playbook.md`
  Common support issues and how to diagnose them.

Update when:
- deployment method changes
- new environments are introduced
- support patterns become repetitive enough to standardize

## Suggested Creation Order

### Immediate priority
1. `report-lifecycle.md`
2. `testing-strategy.md`
3. `release-checklist.md`
4. `tenant-model.md`
5. `security-model.md`
6. `pricing-and-plans.md`

### Next priority
1. `white-label-architecture.md`
2. `operations-runbook.md`
3. `workspace-lifecycle.md`
4. `frontend-structure.md`
5. `copy-and-localization.md`

### Later
1. `data-governance.md`
2. `background-jobs-and-email.md`
3. `implementation-packages.md`
4. `support-playbook.md`
5. `incident-response.md`

## File Ownership Recommendation

- Product flow docs: product owner / lead engineer
- Architecture docs: lead engineer
- Security and compliance docs: lead engineer plus reviewer
- Deployment and operations docs: whoever owns releases
- Content and localization docs: product owner or content maintainer

## Practical Rule

For every major feature added, update at least:
- the relevant workflow doc
- the relevant architecture doc
- the relevant test or release doc

If a feature changes user-visible behavior and deployment behavior, it is not done until both code and docs are updated.
