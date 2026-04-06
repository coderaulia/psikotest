-- D1 Database Schema - Matches production MySQL structure
-- Run: wrangler d1 execute psikotest-db --file=this-file.sql --remote

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- test_types
CREATE TABLE IF NOT EXISTS test_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  question_style TEXT NOT NULL,
  scoring_strategy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- questions
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_type_id INTEGER NOT NULL,
  question_code TEXT NOT NULL,
  instruction_text TEXT,
  prompt TEXT,
  question_group_key TEXT,
  dimension_key TEXT,
  question_type TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',
  question_meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- question_options
CREATE TABLE IF NOT EXISTS question_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  option_key TEXT NOT NULL,
  option_text TEXT NOT NULL,
  dimension_key TEXT,
  value_number REAL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  option_order INTEGER NOT NULL,
  score_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- participants
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  employee_code TEXT,
  department TEXT,
  position_title TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- admins (update to match)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- test_sessions
CREATE TABLE IF NOT EXISTS test_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_type_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  access_token TEXT UNIQUE NOT NULL,
  instructions TEXT,
  settings_json TEXT,
  distribution_policy TEXT NOT NULL DEFAULT 'participant_summary',
  protected_delivery_mode INTEGER NOT NULL DEFAULT 0,
  participant_result_access TEXT NOT NULL DEFAULT 'summary',
  hr_result_access TEXT NOT NULL DEFAULT 'full',
  time_limit_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TEXT,
  ends_at TEXT,
  created_by_admin_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- submissions
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_session_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TEXT,
  consent_given_at TEXT,
  consent_payload_json TEXT,
  identity_snapshot_json TEXT,
  answer_sequence INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  time_spent_seconds INTEGER,
  raw_score REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- answers
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  answer_role TEXT NOT NULL DEFAULT 'single',
  selected_option_id INTEGER,
  value_number REAL,
  value_text TEXT,
  answer_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- results
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER UNIQUE NOT NULL,
  test_type_id INTEGER NOT NULL,
  score_total REAL,
  score_band TEXT,
  primary_type TEXT,
  secondary_type TEXT,
  profile_code TEXT,
  interpretation_key TEXT,
  result_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- result_summaries
CREATE TABLE IF NOT EXISTS result_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'dimension',
  score REAL,
  band TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  summary_text TEXT,
  chart_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- customer_accounts
CREATE TABLE IF NOT EXISTS customer_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'business',
  organization_name TEXT NOT NULL,
  settings_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- customer_assessments
CREATE TABLE IF NOT EXISTS customer_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  test_session_id INTEGER UNIQUE NOT NULL,
  organization_name_snapshot TEXT NOT NULL,
  onboarding_status TEXT NOT NULL DEFAULT 'ready',
  plan_status TEXT NOT NULL DEFAULT 'trial',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- customer_assessment_participants
CREATE TABLE IF NOT EXISTS customer_assessment_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_assessment_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  employee_code TEXT,
  department TEXT,
  position_title TEXT,
  note TEXT,
  invitation_status TEXT NOT NULL DEFAULT 'draft',
  invited_via TEXT,
  invited_at TEXT,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- customer_workspace_members
CREATE TABLE IF NOT EXISTS customer_workspace_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  invitation_status TEXT NOT NULL DEFAULT 'invited',
  activation_token TEXT UNIQUE,
  activation_expires_at TEXT,
  invited_at TEXT,
  activated_at TEXT,
  last_login_at TEXT,
  last_notified_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- workspace_subscriptions
CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER UNIQUE NOT NULL,
  plan_code TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trial',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  billing_provider TEXT NOT NULL DEFAULT 'dummy',
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  provider_price_id TEXT,
  assessment_limit INTEGER NOT NULL,
  participant_limit INTEGER NOT NULL,
  team_member_limit INTEGER NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at TEXT,
  renews_at TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  canceled_at TEXT,
  past_due_at TEXT,
  suspended_at TEXT,
  plan_version INTEGER NOT NULL DEFAULT 1,
  billing_contact_email TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- workspace_usage_snapshots
CREATE TABLE IF NOT EXISTS workspace_usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER,
  period_start TEXT,
  period_end TEXT,
  assessment_count INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,
  team_member_count INTEGER NOT NULL DEFAULT 0,
  export_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- workspace_usage_events
CREATE TABLE IF NOT EXISTS workspace_usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER,
  metric_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reference_type TEXT,
  reference_id INTEGER,
  metadata_json TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- billing_checkout_sessions
CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER NOT NULL,
  session_key TEXT UNIQUE NOT NULL,
  billing_provider TEXT NOT NULL DEFAULT 'dummy',
  plan_code TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  checkout_url TEXT,
  expires_at TEXT,
  completed_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- billing_invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER NOT NULL,
  checkout_session_id INTEGER,
  external_invoice_id TEXT,
  invoice_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  currency_code TEXT NOT NULL DEFAULT 'USD',
  amount_subtotal REAL NOT NULL DEFAULT 0,
  amount_total REAL NOT NULL DEFAULT 0,
  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,
  issued_at TEXT,
  due_at TEXT,
  paid_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- billing_webhook_events
CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  billing_provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  payload_json TEXT NOT NULL,
  processed_at TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_admin_id INTEGER,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  action TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- report_access_logs
CREATE TABLE IF NOT EXISTS report_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  accessor_type TEXT NOT NULL,
  accessor_id INTEGER,
  access_action TEXT NOT NULL DEFAULT 'view',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY NOT NULL,
  setting_value_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_test_sessions_token ON test_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_test_sessions_type_status ON test_sessions(test_type_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_results_test_type ON results(test_type_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(email);