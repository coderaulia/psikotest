ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS answer_sequence INT UNSIGNED NOT NULL DEFAULT 0 AFTER identity_snapshot_json;

UPDATE submissions
SET answer_sequence = 0
WHERE answer_sequence IS NULL;
