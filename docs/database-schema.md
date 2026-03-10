# Database Schema Notes

This project uses a generic question bank schema so IQ, DISC, and workload tests can share the same core tables.

## DISC mapping

Your sample tables map like this:

- `disc_questions` -> `questions`
- `disc_options` -> `question_options`

For DISC rows:

- `test_types.code = 'disc'`
- `questions.question_type = 'forced_choice'`
- `questions.question_code` stores values like `DISC_Q001`
- `questions.instruction_text` stores the repeated instruction text
- `question_options.option_key` stores `A`, `B`, `C`, `D`
- `question_options.option_text` stores the statement text
- `question_options.dimension_key` stores `D`, `I`, `S`, or `C`

## How DISC answers are stored

Each DISC question creates two rows in `answers`:

- one row with `answer_role = 'most'`
- one row with `answer_role = 'least'`

Both rows point to the chosen option through `selected_option_id`.

That means one submission can store:

- which statement was selected as most like the participant
- which statement was selected as least like the participant

without needing a DISC-only answers table.

## How DISC results are stored

Example output:

```json
{
  "participant_id": 123,
  "scores": {
    "D": 6,
    "I": 10,
    "S": 4,
    "C": 2
  },
  "primary_type": "I",
  "secondary_type": "D",
  "profile_code": "I/D"
}
```

This maps to:

- `results.submission_id` -> submission reference
- `results.primary_type` -> `I`
- `results.secondary_type` -> `D`
- `results.profile_code` -> `I/D`
- `results.result_payload_json` -> full score object snapshot

And the per-dimension breakdown can also be stored in `result_summaries`:

- `metric_key = 'D'`, `score = 6`
- `metric_key = 'I'`, `score = 10`
- `metric_key = 'S'`, `score = 4`
- `metric_key = 'C'`, `score = 2`

This keeps the schema flexible for future charts, exports, and reports.
