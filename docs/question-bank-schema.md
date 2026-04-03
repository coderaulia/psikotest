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

## CSV Endpoints

### `GET /questions/export`
- Auth: Admin Bearer
- Response: `text/csv`
- Purpose: Export current question bank in a flat Excel-friendly format (one row per question, up to five option slots).

### `POST /questions/import`
- Auth: Admin Bearer
- Content-Type: `application/json`
- Request body:
  - `csv: string` (required)
  - `dryRun?: boolean` (default `false`)
  - `replaceAll?: boolean` (default `false`)
- Behavior:
  - Validates all rows first.
  - Returns `400` with row-level `errors[]` if any row is invalid.
  - `dryRun: true` performs validation only (no writes).
  - `dryRun: false` writes inserts (and applies `replaceAll` when requested).

### `GET /questions/import/template`
- Auth: Admin Bearer
- Response: `text/csv`
- Purpose: Download import template with headers and sample rows.

## Flat CSV Contract (Prompt 2 reference)

CSV columns (ordered):
- `id`
- `question_text`
- `question_type`
- `category`
- `test_type`
- `dimension`
- `difficulty`
- `is_active`
- `order_index`
- `option_1_text`
- `option_1_value`
- `option_1_is_correct`
- `option_2_text`
- `option_2_value`
- `option_2_is_correct`
- `option_3_text`
- `option_3_value`
- `option_3_is_correct`
- `option_4_text`
- `option_4_value`
- `option_4_is_correct`
- `option_5_text`
- `option_5_value`
- `option_5_is_correct`

### CSV-to-DB mapping
- `question_text` → `questions.prompt`
- `question_type` → `questions.question_type`
- `category`/`test_type` → `test_types.code` → `questions.test_type_id`
- `dimension` → `questions.dimension_key`
- `difficulty` → `questions.question_meta_json.difficulty` (stored as JSON)
- `is_active` (`1`/`0`) → `questions.status` (`active`/`archived`)
- `order_index` → `questions.question_order`
- `option_n_text` → `question_options.option_text`
- `option_n_value` → `question_options.value_number`
- `option_n_is_correct` (`1`/`0`) → `question_options.is_correct`
- Option order is derived from `n` and stored in `question_options.option_order`

### Import notes
- `id` is ignored during import; IDs are database-managed.
- At least two option text columns must be provided per row.
- Duplicate detection is based on `(test_type_id, prompt)` and duplicates are skipped when `replaceAll=false`.
- `replaceAll=true` deletes existing questions/options for categories present in the CSV before insert.
