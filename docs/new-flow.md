# Target Product Flow

This document defines the intended end-to-end workflow for Vanaila Psikotest beyond the MVP.

Read this together with:

- `docs/compliance.md`
- `docs/development-phases.md`
- `docs/assessment-engine.md`

## Product Direction

The platform operates across two main delivery contexts:

- business and HR assessments
- academic or psychological research assessments

Both modes share the same assessment engine, but they differ in review rules, audience visibility, and release behavior.

## Core Assessment Workflow

The product models psychological assessment as a controlled service workflow, not only as a scoring engine.

Purpose clarification
↓
Assessment design
↓
Consent and privacy disclosure
↓
Participant validation
↓
Protected or standard test delivery
↓
Automated scoring
↓
Professional review when required
↓
Released report or approved summary
↓
Feedback, handoff, or export

## Customer and Researcher Onboarding Flow

The public commercial flow remains:

Landing Page
↓
Try Demo / Sign Up
↓
Create First Assessment
↓
Preview Experience / Demo Test
↓
Upgrade to Share

### Onboarding steps

#### Step 1

What type of assessment do you want to create?

- IQ Test
- DISC Personality
- Workload / Stress Test
- Custom Assessment

#### Step 2

Assessment Information

- Assessment Name
- Purpose
- Organization Name

#### Step 3

Configure Settings

- Time limit
- Number of participants
- Result visibility
- Protected delivery mode when needed

#### Step 4

Generate participant link

## Participant Flow

### Current baseline

Public link
↓
Consent page
↓
Identity page
↓
Instructions
↓
Assessment
↓
Submit
↓
Completion state

### Protected delivery flow

Protected sessions do not expose the full question set at once.

Public link
↓
Consent page
↓
Identity page
↓
Signed submission token issued
↓
Question window 1 loaded
↓
Answers saved with `answerSequence`
↓
Question window 2 loaded
↓
Repeat until final group
↓
Submit and score

### Required behavior

- consent is always shown before test start
- identity fields reflect assessment purpose and context
- submission tokens expire after 4 hours by default
- protected sessions load questions group by group
- answer saves must advance the monotonic `answerSequence`
- duplicate submit must be idempotent and return the existing scored result
- participants should not automatically receive final professional interpretation
- result visibility depends on session policy and review status

## Professional Review Flow

This flow applies when the session requires professional interpretation.

Participant submits assessment
↓
System generates preliminary score
↓
Result enters reviewer queue
↓
Reviewer interprets and edits draft report
↓
Reviewer approves report
↓
Report is released to allowed audiences

### Status model

- `scored_preliminary`
- `in_review`
- `reviewed`
- `released`

### Visibility principle

- preliminary score is operational data, not the final report
- reviewed output is professional interpretation still restricted to internal roles
- released output is the only version that should be treated as deliverable

## Result Distribution Flow

The platform supports these result policies:

- HR only
- participant summary
- full report with consent

### Rules

- do not release full psychological interpretation automatically
- participant visibility must follow consent, policy, and review status
- research studies may suppress participant-facing results entirely
- HR should not see draft reviewer notes before release
- customer workspace pages may show audience policy, but not internal reviewer draft content

## Research Flow

Custom research assessments remain structured and compliance-aware.

Researcher signs up
↓
Creates custom assessment
↓
Configures participant limit and visibility
↓
Shares participant link
↓
Collects responses
↓
Exports structured dataset

### Research-specific notes

- custom assessments may not need participant result delivery
- export structure should be suitable for statistical analysis
- privacy wording and contact person details must remain visible in the consent flow
- protected delivery can still be enabled for sensitive research instruments

## Reporting Flow

### Business or HR use

Assessment completed
↓
Preliminary score generated
↓
Reviewer validates interpretation
↓
Released report shared to HR or participant according to policy

### Research use

Responses collected
↓
Data cleaned and exported
↓
No professional interpretation is required unless the study defines it

## Workflow Update Rule

Whenever the implementation changes any of the following, this document should be updated:

- onboarding steps
- participant flow
- protected delivery behavior
- reviewer flow
- result release flow
- research export flow
