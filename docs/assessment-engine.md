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
- audience visibility policy
- protected or standard delivery mode

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
- submission token currently expires after 4 hours by default

### In progress

- answers are stored against `submissions` and `answers`
- write access is limited to active in-progress submissions
- protected sessions fetch question groups through a dedicated window endpoint
- each protected save must send the next `answerSequence`
- replayed or out-of-order answer sequences are rejected

### Finalize

- submit action locks the response
- scoring runs on the server
- result and summary records are written
- duplicate submit returns the existing scored result instead of overwriting it

## Protected delivery model

Protected delivery is intended for more sensitive assessments where the system should avoid sending the full item bank to the browser.

When enabled:

- the public session definition returns delivery metadata but no full question list
- the client requests each question group using the signed submission token
- saved answers are written per group
- the current answer sequence is tracked in the submission record

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
- review and release metadata

### Breakdown rows

`result_summaries` stores per-dimension or per-category breakdowns for:

- charts
- report cards
- research exports
- reviewer summaries

## Reviewer workflow

The engine supports professional review states:

- `scored_preliminary`
- `in_review`
- `reviewed`
- `released`

This is the bridge between:

- automated machine scoring
- reviewer-authored interpretation
- controlled final report release

## Visibility policy model

The engine supports these visibility controls through session settings:

- `distributionPolicy`
- `participantResultAccess`
- `hrResultAccess`
- `protectedDeliveryMode`

These settings drive:

- participant completion-page visibility
- admin result-list indicators
- customer workspace visibility badges
- future release and export controls

## Customer workspace defaults

Customer workspace settings provide organization-level defaults for future assessments, including:

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

- stronger anti-copy posture for protected tests
- stricter result distribution enforcement for customer and HR delivery
- export and report handoff services
- richer custom instrument configuration for research use cases
