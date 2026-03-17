# Assessment Engine

This project uses a shared assessment engine instead of building separate database tables for every test family.

## Supported assessment types
- IQ
- DISC
- Workload / stress
- Custom psychological research assessments

## Core model

### Question content
Questions are stored in:
- `questions`
- `question_options`

This allows the engine to support:
- single choice
- forced choice
- likert scale

### Delivery container
An assessment is delivered through a `test_session`.

A session defines:
- test type
- instructions
- tokenized access
- time limit
- operational settings
- draft or active state

### Participant record
A participant is stored separately from the submission itself.

This makes it possible to:
- reuse participant identity across sessions
- store demographic and workforce data
- keep raw answers and final results as separate concerns

## Submission lifecycle

### Start
- participant opens tokenized session
- consents
- submits identity
- receives a signed submission access token

### In progress
- answers are stored against `submissions` and `answers`
- write access is limited to active in-progress submissions

### Finalize
- submit action locks the response
- scoring runs on the server
- result and summary records are written

## Scoring architecture

Scoring logic is modular by test type:
- IQ scoring
- DISC scoring
- workload scoring
- custom questionnaire scoring

Question content remains separate from scoring behavior.

That separation is important because:
- content can change without rewriting persistence
- new tests can be added with a new scorer and question configuration
- raw answers remain available for later analysis or export

## Result model

### Stored result
`results` stores:
- total score
- band or interpretation key
- DISC profile values where relevant
- a JSON result payload snapshot

### Breakdown rows
`result_summaries` stores per-dimension or per-category breakdowns for:
- charts
- report cards
- research exports
- reviewer summaries

## Reviewer workflow

The engine now supports professional review states:
- `scored_preliminary`
- `in_review`
- `reviewed`
- `released`

This is the bridge between:
- automated machine scoring
- reviewer-authored interpretation
- controlled final report release

## Customer workspace defaults

Customer workspace settings now provide organization-level defaults for future assessments, including:
- brand name and tagline
- support email and contact person
- default purpose, administration mode, and result visibility
- default consent and privacy statements

These defaults are injected into newly created customer assessments.

## Why this matters for white-label

The shared engine makes white-label practical because the product can change:
- branding
- copy
- participant communication
- report delivery rules

without rebuilding the scoring and storage core for every customer.

## Next engine evolution

Planned next steps:
- progressive protected delivery for sensitive tests
- stronger result distribution policy enforcement
- export and report handoff services
- richer custom instrument configuration for research use cases
