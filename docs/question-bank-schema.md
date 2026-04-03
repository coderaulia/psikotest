# Question Bank Schema Contract

Canonical contract for Question Bank CRUD and validated CSV import/export.

## Tables

### `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto increment |
| `test_type_id` | INTEGER FK | References `test_types.id` |
| `question_code` | TEXT NOT NULL | Stable identifier; unique with `test_type_id` |
| `instruction_text` | TEXT | Optional instruction |
| `prompt` | TEXT | Item prompt |
| `question_group_key` | TEXT | Optional group key |
| `dimension_key` | TEXT | Primary scoring dimension |
| `category_key` | TEXT | Optional category/subscale key |
| `scoring_key` | TEXT | Optional scorer routing key |
| `is_reverse_scored` | INTEGER NOT NULL DEFAULT 0 | Reverse scoring flag |
| `weight` | REAL NOT NULL DEFAULT 1 | Positive scoring weight |
| `question_type` | TEXT NOT NULL | `single_choice` \| `forced_choice` \| `likert` |
| `question_order` | INTEGER NOT NULL | Display/scoring order |
| `is_required` | INTEGER NOT NULL DEFAULT 1 | Required answer flag |
| `status` | TEXT DEFAULT `active` | `draft` \| `active` \| `archived` |
| `question_meta_json` | TEXT | Optional metadata fallback |
| `created_at` | TEXT | Timestamp |
| `updated_at` | TEXT | Timestamp |

### `question_options`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto increment |
| `question_id` | INTEGER FK | References `questions.id` |
| `option_key` | TEXT NOT NULL | Key (`A/B/C/...`) |
| `option_text` | TEXT NOT NULL | Label shown to participant |
| `dimension_key` | TEXT | Optional dimension override |
| `value_number` | REAL | Legacy numeric value |
| `score_value` | REAL | Canonical numeric score |
| `is_correct` | INTEGER NOT NULL DEFAULT 0 | Correct option marker |
| `is_active` | INTEGER NOT NULL DEFAULT 1 | Active option flag |
| `option_order` | INTEGER NOT NULL | Option order |
| `score_payload_json` | TEXT | Optional scoring payload |
| `created_at` | TEXT | Timestamp |
| `updated_at` | TEXT | Timestamp |

## API Payload Contract

Question list item includes:
- `id`, `testType`, `questionCode`, `prompt`, `instructionText`
- `questionGroupKey`, `dimensionKey`, `categoryKey`, `scoringKey`
- `isReverseScored`, `weight`
- `questionType`, `questionOrder`, `isRequired`, `status`, `optionCount`, `updatedAt`

Question detail includes all above plus:
- `questionMeta`
- `options[]` with `optionKey`, `optionText`, `dimensionKey`, `valueNumber`, `scoreValue`, `isCorrect`, `isActive`, `optionOrder`, `scorePayload`

## Validated CSV Contract (v2)

Headers (ordered):
- `test_type`
- `question_code`
- `question_type`
- `question_order`
- `prompt`
- `dimension_key`
- `category_key`
- `scoring_key`
- `is_reverse_scored`
- `weight`
- `status`
- `option_1_label`
- `option_1_score`
- `option_1_is_correct`
- `option_1_dimension_key`
- `option_2_label`
- `option_2_score`
- `option_2_is_correct`
- `option_2_dimension_key`
- `option_3_label`
- `option_3_score`
- `option_3_is_correct`
- `option_3_dimension_key`
- `option_4_label`
- `option_4_score`
- `option_4_is_correct`
- `option_4_dimension_key`
- `option_5_label`
- `option_5_score`
- `option_5_is_correct`
- `option_5_dimension_key`

Legacy CSV columns are no longer accepted for write import. Use template endpoint:
- `GET /api/question-bank/questions/import/template`
