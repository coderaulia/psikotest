# Psikotest Development Phases

This document turns the product roadmap into an implementation plan for the next three delivery phases.

It should be used together with:

- `docs/new-flow.md`
- `docs/compliance.md`

## Current SaaS Build Status

The current product already covers:

- public landing page, manual, white-label positioning, signup, and login
- customer onboarding and first-assessment creation
- customer workspace overview with draft activation and participant links
- workspace billing with dummy plan updates and enforced usage limits
- participant invite, reminder, and list management
- teammate roster, invite activation, and workspace roles
- workspace activity feed and customer-safe result views
- admin dashboard, reviewer queue, reports, question bank, and settings
- participant consent-first assessment flow with protected progressive delivery
- automated scoring for IQ, DISC, workload, and custom research tests
- API and frontend smoke/integration coverage

The main remaining work is centered on:

- replacing dummy billing with a real provider
- deeper white-label and tenant controls
- export and delivery handoff
- enterprise compliance and security depth

## Phase 1: Professional Report Workflow

### Goal

Separate automated scoring from professional interpretation and final release.

### Business outcome

- organizations can use the platform operationally without treating machine scoring as a final psychological report
- reviewers or psychologists can work inside a dedicated queue
- released reports become explicit, auditable artifacts

### Product scope

- add reviewer-specific workflow beyond admin-only handling
- distinguish preliminary score from reviewed interpretation
- support release state and release ownership
- ensure participant and customer views respect report status

### Target states

- `scored_preliminary`
- `in_review`
- `reviewed`
- `released`

### Backend work

- add reviewer role support:
  - `psychologist_reviewer`
  - optional `hr_user` for later role separation
- extend result model with:
  - reviewer assignment
  - review status
  - reviewed narrative
  - recommendations
  - limitations
  - release metadata
- add audit events for:
  - automatic scoring completed
  - reviewer assigned
  - review started
  - review updated
  - report approved
  - report released
- add API endpoints for:
  - reviewer queue
  - reviewer result detail
  - save review draft
  - approve review
  - release report

### Frontend work

- reviewer dashboard with pending and active review queues
- result detail page with:
  - system score summary
  - reviewer notes
  - interpretation editor
  - approval and release actions
- updated admin, customer, and participant result pages with clear status badges:
  - preliminary
  - in review
  - reviewed
  - released
- participant result page updated so it never presents a preliminary machine result as the final professional report

### Data model changes

- extend `results` with:
  - `review_status`
  - `reviewer_admin_id` or dedicated reviewer user relation
  - `review_started_at`
  - `reviewed_at`
  - `released_at`
  - `released_by_admin_id`
- add `result_reviews` table if richer versioning is needed
- add structured release policy fields to `result_summaries` or `results.result_payload_json`

### Tests

- only reviewer role can approve or release a report
- preliminary report does not appear as final interpretation in participant flow
- release action updates visibility correctly for customer and participant views
- audit log records each state transition

### Definition of done

- every submission can move from automated scoring to reviewed release through a permissioned workflow
- the UI clearly distinguishes machine output from professional output

## Phase 2: Test Security and Result Distribution

### Goal

Reduce exposure of sensitive test content and formalize who can see which version of a result.

### Business outcome

- HR, participant, and researcher visibility become controlled per assessment
- test materials are better protected in normal operation
- compliance posture is stronger for professional and research use

### Product scope

- stronger anti-copy and anti-exposure delivery model for protected tests
- result distribution controls:
  - `hr_only`
  - `participant_summary`
  - `full_report_with_consent`
- support custom or research modes where participants do not automatically see results

### Backend work

- add assessment-level distribution policy fields
- add enforcement checks to result endpoints
- tighten session access:
  - signed tokens
  - token expiry
  - replay protection
  - duplicate-submit protection
- support progressive item delivery for protected tests:
  - one question or one group at a time
  - minimal client-side question exposure

### Frontend work

- session settings UI for:
  - result visibility
  - participant result mode
  - reviewer required mode
  - protected delivery mode
- participant flow updated for progressive delivery where needed
- customer and admin result pages adapt to visibility rules
- participant completion page adapts to allowed result scope:
  - no result
  - summary only
  - released report

### Data model changes

- extend `test_sessions` compliance or metadata with:
  - `distribution_policy`
  - `protected_delivery_mode`
  - `participant_result_access`
  - `hr_result_access`
- optional access-log table for report opens and downloads

### Tests

- participant cannot fetch HR-only result content
- HR cannot access unreleased reviewer draft
- submission replay or duplicate submit fails safely
- protected sessions do not expose the entire question bank in one fetch

### Definition of done

- visibility rules are enforced server-side
- protected tests deliver content with reduced exposure compared to the current full-client fetch model

## Phase 3: Export and Report Handoff

### Goal

Turn reviewed reports into operational deliverables for organizations, researchers, and professional reviewers.

### Business outcome

- released reports can be exported cleanly
- organizations can hand off reports to HR or participants
- research users can export structured datasets

### Product scope

- PDF export for released reports
- CSV or spreadsheet export for research and custom assessments
- email handoff for report delivery and release notification
- export and delivery audit trail

### Backend work

- report export service:
  - participant summary PDF
  - professional report PDF
  - CSV or XLSX dataset export
- delivery service:
  - email report links
  - email release notifications
- export log and delivery log storage

### Frontend work

- export actions on result detail and reports pages
- bulk export from reports screen
- delivery history display
- branded template settings:
  - organization name
  - reviewer signature block
  - disclaimer footer

### Data model changes

- `report_exports`
- `report_deliveries`
- template or branding settings on organization or customer workspace

### Tests

- only released reports can be exported
- exported format matches distribution policy
- dataset exports respect research privacy settings
- delivery attempts are logged

### Definition of done

- customers can generate and hand off final outputs without manual offline report assembly

## SaaS Foundation Next Steps

The next SaaS-specific work after the current slice should be:

1. real billing provider integration
2. subscription status changes beyond trial and active
3. invoice and renewal history
4. stronger white-label tenant controls
5. export, delivery, and handoff workflows

## Recommended Build Sequence

1. Phase 1 schema and permissions
2. Phase 1 reviewer UI and release workflow
3. Phase 2 result distribution policies
4. Phase 2 protected delivery and security hardening
5. Phase 3 PDF and dataset export
6. Phase 3 email handoff and delivery logs
7. replace dummy billing with a real commercial flow once the operational SaaS behavior is stable

## Test Strategy Across Phases

### Unit tests

- role and permission guards
- review status transitions
- visibility policy evaluation
- export eligibility rules

### API integration tests

- reviewer queue and approval flow
- protected session question delivery
- result access under each distribution policy
- export endpoint authorization and audit logging
- workspace billing/usage enforcement and customer role access

### Frontend tests

- reviewer result editor behavior
- participant completion page under each result mode
- customer visibility controls in settings and session detail
- customer billing/participant/team limits and upgrade prompts

### End-to-end flow tests

- customer signup -> create assessment -> activate sharing
- participant consent -> test -> submit -> completion
- reviewer opens preliminary result -> reviews -> releases
- customer or HR opens released report

## Documentation Update Rule

Each phase should update the following before release:

- `docs/new-flow.md` for workflow changes
- `docs/compliance.md` for compliance mapping
- deployment notes if new services or environment variables are introduced

