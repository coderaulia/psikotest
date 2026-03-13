# Target Product Flow

This document defines the intended end-to-end workflow for Vanaila Psikotest after the MVP.

It should be read together with:

- `docs/compliance.md`
- `docs/development-phases.md`

## Product Direction

The platform has two major operating modes:

- business and HR assessments
- academic or psychological research assessments

Both modes share the same core assessment pipeline, but professional interpretation, result visibility, and release rules can differ.

## Core Assessment Workflow

The product should model psychological assessment as a process, not only as a scoring engine.

### Target flow

Purpose clarification
↓
Assessment design
↓
Consent and privacy disclosure
↓
Participant validation
↓
Test administration
↓
Automated scoring
↓
Professional review when required
↓
Released report or summary
↓
Feedback and recommendation

## Customer and Researcher Onboarding Flow

The public business flow stays:

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

### Required future behavior

- consent is always shown before test start
- identity fields reflect assessment purpose and context
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
- reviewed output is professional interpretation
- released output is the only version that should be treated as deliverable

## Result Distribution Flow

The platform should support these result policies:

- HR only
- participant summary
- full report with consent

### Rules

- do not release full psychological interpretation automatically
- participant visibility must follow consent and session policy
- research studies may choose to suppress participant-facing results entirely
- HR should not see draft reviewer notes before release

## Research Flow

Custom research assessments should remain structured and compliance-aware.

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
- privacy wording and contact person details must remain visible in consent flow

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
- reviewer flow
- result release flow
- research export flow
