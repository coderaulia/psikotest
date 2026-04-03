-- 012_validated_question_metadata.sql
-- Adds scoring-critical metadata columns for validated question content.
-- Note: SQLite does not support "ADD COLUMN IF NOT EXISTS", so this migration
-- is intended to run once through migration tracking.

ALTER TABLE questions ADD COLUMN category_key TEXT;
ALTER TABLE questions ADD COLUMN scoring_key TEXT;
ALTER TABLE questions ADD COLUMN is_reverse_scored INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN weight REAL NOT NULL DEFAULT 1;

ALTER TABLE question_options ADD COLUMN score_value REAL;
ALTER TABLE question_options ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- Backfill from existing metadata/value fields where possible.
UPDATE questions
SET category_key = COALESCE(
  category_key,
  CASE WHEN json_valid(question_meta_json) THEN json_extract(question_meta_json, '$.categoryKey') END
)
WHERE category_key IS NULL;

UPDATE questions
SET scoring_key = COALESCE(
  scoring_key,
  CASE WHEN json_valid(question_meta_json) THEN json_extract(question_meta_json, '$.scoringKey') END
)
WHERE scoring_key IS NULL;

UPDATE questions
SET is_reverse_scored = CASE
  WHEN json_valid(question_meta_json)
    AND json_extract(question_meta_json, '$.isReverseScored') IN (1, '1', 'true', 'TRUE') THEN 1
  ELSE is_reverse_scored
END;

UPDATE questions
SET weight = COALESCE(
  NULLIF(
    CASE
      WHEN json_valid(question_meta_json) THEN CAST(json_extract(question_meta_json, '$.weight') AS REAL)
      ELSE NULL
    END,
    0
  ),
  weight,
  1
);

UPDATE question_options
SET score_value = COALESCE(score_value, value_number)
WHERE score_value IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_test_type_question_code
  ON questions(test_type_id, question_code);

CREATE INDEX IF NOT EXISTS idx_questions_test_type_order
  ON questions(test_type_id, question_order);

CREATE INDEX IF NOT EXISTS idx_question_options_question_order
  ON question_options(question_id, option_order);
