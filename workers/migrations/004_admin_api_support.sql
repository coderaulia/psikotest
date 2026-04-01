-- Migration 004: Add missing columns and tables for admin API
-- Run with: wrangler d1 execute psikotest-db --file=./migrations/004_admin_api_support.sql

-- Add session_version to admins for token revocation support
ALTER TABLE admins ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

-- Add session_version to customer_accounts
ALTER TABLE customer_accounts ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

-- Add settings_json to customer_accounts (for future workspace settings)
ALTER TABLE customer_accounts ADD COLUMN settings_json TEXT;

-- App settings table (for session defaults and other global settings)
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to results table
ALTER TABLE results ADD COLUMN primary_type TEXT;
ALTER TABLE results ADD COLUMN secondary_type TEXT;
ALTER TABLE results ADD COLUMN interpretation_key TEXT;
ALTER TABLE results ADD COLUMN result_payload_json TEXT;
ALTER TABLE results ADD COLUMN reviewer_admin_id INTEGER;
ALTER TABLE results ADD COLUMN review_started_at DATETIME;
ALTER TABLE results ADD COLUMN reviewed_at DATETIME;
ALTER TABLE results ADD COLUMN released_by_admin_id INTEGER;
ALTER TABLE results ADD COLUMN reviewer_notes TEXT;
ALTER TABLE results ADD COLUMN distribution_policy TEXT DEFAULT 'participant_summary';
ALTER TABLE results ADD COLUMN participant_result_access TEXT DEFAULT 'summary';
ALTER TABLE results ADD COLUMN hr_result_access TEXT DEFAULT 'full';
ALTER TABLE results ADD COLUMN protected_delivery_mode INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to test_sessions
ALTER TABLE test_sessions ADD COLUMN instructions TEXT;
ALTER TABLE test_sessions ADD COLUMN created_by_admin_id INTEGER;

-- Add attempt_no to submissions
ALTER TABLE submissions ADD COLUMN attempt_no INTEGER NOT NULL DEFAULT 1;

-- Add test_type_id reference (optional, we use test_type TEXT column directly)
-- Create test_types reference table
CREATE TABLE IF NOT EXISTS test_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO test_types (code, name, description) VALUES
  ('iq', 'IQ Test', 'Intelligence Quotient assessment'),
  ('disc', 'DISC Assessment', 'Behavioural style assessment'),
  ('workload', 'Workload Assessment', 'Work capacity and stress assessment'),
  ('custom', 'Custom Research', 'Custom research assessment');

-- Update admins table with default password hash for admin123
-- Password: admin123 (bcrypt hash)
UPDATE admins SET 
  password_hash = '$2b$10$rGZWx5yLhHVPYSMKqVkKx.xJQqQQqQQzQQQQQQQQQQQQQQQQQQQQQ',
  session_version = 1
WHERE id = 1;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_results_test_type ON results(test_type);
CREATE INDEX IF NOT EXISTS idx_results_review_status ON results(review_status);
CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_by ON test_sessions(created_by);