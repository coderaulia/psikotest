-- Migration 002: Add missing tables and columns for Workers API
-- Run with: wrangler d1 execute psikotest-db --file=./migrations/002_add_missing_tables.sql

-- Add session_version to admins (for token revocation)
ALTER TABLE admins ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

-- Add session_version to customer_accounts
ALTER TABLE customer_accounts ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

-- Add settings_json to customer_accounts (for future workspace settings)
ALTER TABLE customer_accounts ADD COLUMN settings_json TEXT;

-- Test types lookup table (IQ, DISC, Workload)
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
  ('workload', 'Workload Assessment', 'Work capacity and stress assessment');

-- Customer workspace members
CREATE TABLE IF NOT EXISTS customer_workspace_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'operator', -- admin | operator | reviewer
  invitation_status TEXT NOT NULL DEFAULT 'invited', -- invited | active
  activation_token TEXT UNIQUE,
  activation_expires_at DATETIME,
  activated_at DATETIME,
  last_login_at DATETIME,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id)
);

-- Audit events log
CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL, -- admin | customer | system
  actor_admin_id INTEGER,
  actor_customer_id INTEGER,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add test_type_id to test_sessions (reference to test_types)
-- SQLite doesn't support ADD COLUMN with FK, so we store test_type as text (already exists as test_type)
-- The existing test_type TEXT column serves the same purpose as test_type_id + join

-- Add instructions column to test_sessions
ALTER TABLE test_sessions ADD COLUMN instructions TEXT;

-- Add created_by_admin_id to test_sessions
ALTER TABLE test_sessions ADD COLUMN created_by_admin_id INTEGER;

-- Add attempt_no and review tracking to submissions
ALTER TABLE submissions ADD COLUMN attempt_no INTEGER NOT NULL DEFAULT 1;

-- Add result_payload_json to results (full structured result data)
ALTER TABLE results ADD COLUMN result_payload_json TEXT;

-- Add primary_type to results (for DISC primary type: D, I, S, C)
ALTER TABLE results ADD COLUMN primary_type TEXT;

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON customer_workspace_members(email);
CREATE INDEX IF NOT EXISTS idx_workspace_members_account ON customer_workspace_members(customer_account_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_token ON customer_workspace_members(activation_token);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_type, actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_test_type ON test_sessions(test_type);
CREATE INDEX IF NOT EXISTS idx_results_test_type ON results(test_type);
