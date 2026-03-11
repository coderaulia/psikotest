ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS consent_given_at DATETIME NULL AFTER started_at,
  ADD COLUMN IF NOT EXISTS consent_payload_json JSON NULL AFTER consent_given_at,
  ADD COLUMN IF NOT EXISTS identity_snapshot_json JSON NULL AFTER consent_payload_json;
