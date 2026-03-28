# Compliance Implementation Notes

This document maps ethical and compliance expectations into product and engineering requirements for Vanaila Psikotest.

Read this together with:

- `docs/new-flow.md`
- `docs/development-phases.md`
- `docs/auth-and-access.md`

## Compliance Basis

Indonesia has strict ethical guidelines for psychological services. HIMPSI standards and the general handling expectations for sensitive personal data should influence how the product is built.

The platform should treat psychological assessment as a protected service workflow, not as a generic form builder.

## Core Compliance Areas

### 1. Test validity and reliability

Psychological tests used for professional decisions should be scientifically grounded and used within the right context.

Implications for the product:

- validated instruments must be distinguished from custom research instruments
- result interpretation must be context-aware
- test purpose should be captured before administration
- the system should not imply clinical or professional validity for dummy or unvalidated content

### 2. Competence requirement

Certain psychological services require qualified professional oversight.

Implications for the product:

- the system must distinguish:
  - self-assessment mode
  - professional review mode
  - research data collection mode
- professional interpretation should require reviewer or psychologist workflow
- preliminary machine scoring must not be framed as the final professional conclusion

### 3. Confidentiality of data

Psychological data is sensitive personal data.

Implications for the product:

- access to participant data and results must be role-controlled
- result visibility must be policy-driven
- audit logging should record review, release, and report access actions
- data retention and export actions should be trackable

### 4. Protection of test materials

Psychological test materials should not be casually exposed or redistributed.

Implications for the product:

- question banks must remain admin-only
- participant delivery should minimize full item exposure
- protected sessions should support progressive item delivery
- stale or replayed answer payloads must be rejected
- anti-copy posture should be considered for professional tests

### 5. Interpretation responsibility

Interpretation must be done responsibly and within the operator's competence.

Implications for the product:

- automated interpretation must be labeled as indicative or preliminary
- professional interpretation requires reviewer validation
- released reports should clearly identify whether they are summary-only or professionally reviewed
- customer-facing views must never expose internal reviewer draft notes

## Product Requirements Derived from Compliance

### Consent

Mandatory before test start.

Required content:

- purpose of assessment
- estimated duration
- privacy statement
- voluntary participation wording
- contact person

### Role model

The long-term role model should include:

- `super_admin`
- `admin`
- `psychologist_reviewer`
- `hr_user`
- `participant`
- `customer_owner` or equivalent workspace owner

### Result release

Only released reports should be treated as final deliverables.

Operational states:

- preliminary
- in review
- reviewed
- released

### Result visibility

Supported policy directions:

- HR only
- participant summary
- full report with consent

### Research mode

Research assessments should support:

- structured questionnaire collection
- participant limits
- privacy-focused consent flow
- dataset export without implying professional interpretation

## Phase Mapping

### Phase 1

Implements:

- reviewer-specific workflow
- preliminary versus reviewed report separation
- review and release audit trail

### Phase 2

Implements:

- stronger question security
- progressive delivery for protected tests
- replay and duplicate-submit protection
- result distribution enforcement

### Phase 3

Implements:

- export and handoff controls
- delivery logging
- final report operationalization

## Current Implementation Notes

The current codebase now supports:

- signed participant submission tokens with a 4-hour default expiry
- protected sessions that deliver question groups progressively
- monotonically increasing `answerSequence` checks for protected saves
- idempotent duplicate submit behavior for already scored submissions
- visibility-aware admin and customer result surfaces

## Remaining Gaps To Close

- reviewer-specific permissions can still be deepened for future role expansion
- anti-copy posture is still UX-level, not enterprise-grade browser control
- final report export and delivery workflows are still deferred
- external edge protection is still needed for high-scale abuse and DDoS resilience

## Documentation Rule

Any change to consent handling, protected delivery, reviewer flow, result visibility, or export policy should update this document before release.
