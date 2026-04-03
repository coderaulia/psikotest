# Question Bank Schema Contract

This document is the canonical contract for admin Question Bank CRUD and CSV import/export mapping.

## Tables

### `questions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INTEGER` (PK) | Auto increment primary key |
| `test_type_id` | `INTEGER` (FK) | References `test_types.id` |
| `question_code` | `TEXT` (NOT NULL) | Stable question identifier (for example `IQ_Q001`) |
| `instruction_text` | `TEXT` (nullable) | Optional instruction block shown with question |
| `prompt` | `TEXT` (nullable) | Main question text |
| `question_group_key` | `TEXT` (nullable) | Group/batch key for progressive delivery |
| `dimension_key` | `TEXT` (nullable) | Scoring dimension key (`D/I/S/C`, `pattern`, etc.) |
| `question_type` | `TEXT` (NOT NULL) | `single_choice` \| `forced_choice` \| `likert` |
| `question_order` | `INTEGER` (NOT NULL) | Display order |
| `is_required` | `INTEGER` (NOT NULL, default `1`) | `1` required, `0` optional |
| `status` | `TEXT` (default `'active'`) | `draft` \| `active` \| `archived` |
| `question_meta_json` | `TEXT` (nullable) | JSON metadata blob |
| `created_at` | `TEXT` (NOT NULL, default `CURRENT_TIMESTAMP`) | Creation timestamp |
| `updated_at` | `TEXT` (NOT NULL, default `CURRENT_TIMESTAMP`) | Last update timestamp |

### `question_options`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INTEGER` (PK) | Auto increment primary key |
| `question_id` | `INTEGER` (FK) | References `questions.id` |
| `option_key` | `TEXT` (NOT NULL) | Option label (`A`, `B`, `C`, `D`, etc.) |
| `option_text` | `TEXT` (NOT NULL) | Option content |
| `dimension_key` | `TEXT` (nullable) | Optional per-option dimension |
| `value_number` | `REAL` (nullable) | Numeric score value |
| `is_correct` | `INTEGER` (NOT NULL, default `0`) | `1` marks correct answer (IQ), else `0` |
| `option_order` | `INTEGER` (NOT NULL) | Option display order |
| `score_payload_json` | `TEXT` (nullable) | JSON scoring payload |
| `created_at` | `TEXT` (NOT NULL, default `CURRENT_TIMESTAMP`) | Creation timestamp |
| `updated_at` | `TEXT` (NOT NULL, default `CURRENT_TIMESTAMP`) | Last update timestamp |

## API Contract (`/api/question-bank`)

### List questions

`GET /questions`

Query params:
- `search` (optional)
- `testType` (`iq` \| `disc` \| `workload` \| `custom` \| `all`)
- `status` (`draft` \| `active` \| `archived` \| `all`)

Response:

```json
{
  "items": [
    {
      "id": 1,
      "testType": "iq",
      "questionCode": "IQ_Q001",
      "prompt": "2, 4, 8, ...",
      "instructionText": null,
      "questionGroupKey": null,
      "dimensionKey": "pattern",
      "questionType": "single_choice",
      "questionOrder": 1,
      "isRequired": true,
      "status": "active",
      "optionCount": 4,
      "updatedAt": "2026-04-03 00:00:00"
    }
  ]
}
```

### Get question detail

`GET /questions/:id`

Response:

```json
{
  "id": 1,
  "testType": "iq",
  "questionCode": "IQ_Q001",
  "prompt": "2, 4, 8, ...",
  "instructionText": null,
  "questionGroupKey": null,
  "dimensionKey": "pattern",
  "questionType": "single_choice",
  "questionOrder": 1,
  "isRequired": true,
  "status": "active",
  "optionCount": 4,
  "updatedAt": "2026-04-03 00:00:00",
  "questionMeta": {},
  "options": [
    {
      "id": 10,
      "optionKey": "A",
      "optionText": "16",
      "dimensionKey": "pattern",
      "valueNumber": null,
      "isCorrect": true,
      "optionOrder": 1,
      "scorePayload": {}
    }
  ]
}
```

### Create question

`POST /questions`

Body:

```json
{
  "testType": "iq",
  "questionCode": "IQ_Q001",
  "instructionText": null,
  "prompt": "2, 4, 8, ...",
  "questionGroupKey": null,
  "dimensionKey": "pattern",
  "questionType": "single_choice",
  "questionOrder": 1,
  "isRequired": true,
  "status": "active",
  "questionMeta": {},
  "options": [
    {
      "optionKey": "A",
      "optionText": "16",
      "dimensionKey": "pattern",
      "valueNumber": null,
      "isCorrect": true,
      "optionOrder": 1,
      "scorePayload": null
    }
  ]
}
```

### Update question

`PATCH /questions/:id`

Body: same shape as create, partial updates allowed.

## CSV Mapping Contract (for Prompt 2)

Expected CSV columns for question import:
- `test_type`
- `question_code`
- `instruction_text`
- `prompt`
- `question_group_key`
- `dimension_key`
- `question_type`
- `question_order`
- `is_required`
- `status`
- `question_meta_json`
- `option_key`
- `option_text`
- `option_dimension_key`
- `value_number`
- `is_correct`
- `option_order`
- `score_payload_json`

Notes:
- `test_type` maps to `test_types.code`, then stored as `questions.test_type_id`.
- One question can span multiple rows when multiple options exist.
- `id`, `created_at`, and `updated_at` are system-managed and must not be supplied by CSV import.
