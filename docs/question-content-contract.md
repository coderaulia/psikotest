# Question Content Contract

Canonical contract for importing and scoring assessment question content safely.

## Scope

This contract governs:
- Admin CSV import/export for question bank content
- Question metadata required by scoring (`reverse`, `weight`, `dimension`)
- Backward-compatible scoring behavior for existing demo items

This contract does not certify item validity. It defines data shape and integrity rules only.

## Canonical Fields

### `questions`

| Field | Required | Description |
|---|---|---|
| `test_type` | Yes | `iq` \| `disc` \| `workload` \| `custom` |
| `question_code` | Yes | Stable code, unique within test type |
| `question_type` | Yes | `single_choice` \| `forced_choice` \| `likert` |
| `question_order` | Yes | Positive integer order |
| `prompt` | Yes | Item prompt text |
| `dimension_key` | Required for `iq/disc/workload` | Dimension/subscale key used by scorer |
| `category_key` | Optional | Optional sub-grouping key |
| `scoring_key` | Optional | Optional explicit scorer routing key |
| `is_reverse_scored` | Optional (default `0`) | Reverse-score flag |
| `weight` | Optional (default `1`) | Positive numeric item weight |
| `status` | Optional (default `active`) | `draft` \| `active` \| `archived` |

### `question_options`

| Field | Required | Description |
|---|---|---|
| `option_n_label` | Conditionally required | Option text for slot `n` |
| `option_n_score` | Conditionally required | Numeric option score |
| `option_n_is_correct` | Conditionally required | `0/1` boolean-like |
| `option_n_dimension_key` | Optional | Per-option dimension override |

At least 2 options are required per row.

## CSV Contract (`/api/question-bank/questions/import`)

Headers:

`test_type,question_code,question_type,question_order,prompt,dimension_key,category_key,scoring_key,is_reverse_scored,weight,status,option_1_label,option_1_score,option_1_is_correct,option_1_dimension_key,option_2_label,option_2_score,option_2_is_correct,option_2_dimension_key,option_3_label,option_3_score,option_3_is_correct,option_3_dimension_key,option_4_label,option_4_score,option_4_is_correct,option_4_dimension_key,option_5_label,option_5_score,option_5_is_correct,option_5_dimension_key`

## Import Validation Rules

- Reject entire import if any row fails (atomic)
- `question_code` must be unique per `test_type` in CSV payload
- `question_order` must be unique per `test_type` in CSV payload
- `prompt` must be present and min-length 5
- `dimension_key` required for `iq`, `disc`, and `workload`
- `is_reverse_scored` must be boolean-like (`0/1`, `true/false`, `yes/no`)
- `weight` must be positive
- Option labels/scores/correct flags must be structurally complete when option slot is used
- `single_choice` must contain at least one `is_correct=1`
- `forced_choice` options must resolve dimension (option override or row dimension)
- `likert` must provide numeric score range

Errors return row-level details:
- `row`
- `field`
- `message`

## Scoring Expectations

- Scorer reads item metadata from explicit columns first:
  - `questions.is_reverse_scored`
  - `questions.weight`
  - `questions.category_key`
  - `questions.scoring_key`
  - `question_options.score_value`
- Legacy fallback remains supported via:
  - `questions.question_meta_json`
  - `question_options.value_number` / `score_payload_json`
- Output shape for IQ/DISC/Workload responses remains unchanged.

## Current Production Content Status

- Engine + schema are ready for validated content imports.
- Demo content may still be active where validated licensed content has not yet been provided.
- Do not label demo content as “validated” in user-facing materials.
