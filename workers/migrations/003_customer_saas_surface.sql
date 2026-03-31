-- Migration 003: SaaS customer workspace, billing, and result delivery surface for Workers
-- Run after 001_initial_schema.sql and 002_add_missing_tables.sql

ALTER TABLE customer_workspace_members ADD COLUMN invited_at DATETIME;
ALTER TABLE customer_workspace_members ADD COLUMN last_notified_at DATETIME;

CREATE TABLE IF NOT EXISTS customer_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  test_session_id INTEGER NOT NULL,
  organization_name_snapshot TEXT NOT NULL,
  onboarding_status TEXT NOT NULL DEFAULT 'ready',
  plan_status TEXT NOT NULL DEFAULT 'trial',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_assessments_session ON customer_assessments(test_session_id);
CREATE INDEX IF NOT EXISTS idx_customer_assessments_customer ON customer_assessments(customer_account_id);

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
  invited_at DATETIME,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_assessment_id) REFERENCES customer_assessments(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_assessment_participants_email ON customer_assessment_participants(customer_assessment_id, email);
CREATE INDEX IF NOT EXISTS idx_customer_assessment_participants_status ON customer_assessment_participants(customer_assessment_id, invitation_status);

CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
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
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME,
  renews_at DATETIME,
  current_period_start DATETIME,
  current_period_end DATETIME,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  canceled_at DATETIME,
  past_due_at DATETIME,
  suspended_at DATETIME,
  plan_version INTEGER NOT NULL DEFAULT 1,
  billing_contact_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_subscriptions_account ON workspace_subscriptions(customer_account_id);

CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER NOT NULL,
  session_key TEXT NOT NULL,
  billing_provider TEXT NOT NULL DEFAULT 'dummy',
  plan_code TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  checkout_url TEXT,
  expires_at DATETIME,
  completed_at DATETIME,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_checkout_sessions_key ON billing_checkout_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_account ON billing_checkout_sessions(customer_account_id);

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
  issued_at DATETIME,
  due_at DATETIME,
  paid_at DATETIME,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (checkout_session_id) REFERENCES billing_checkout_sessions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_account ON billing_invoices(customer_account_id);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  billing_provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  payload_json TEXT NOT NULL,
  processed_at DATETIME,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_webhook_events_external ON billing_webhook_events(billing_provider, external_event_id);

CREATE TABLE IF NOT EXISTS workspace_usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER,
  metric_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reference_type TEXT,
  reference_id INTEGER,
  metadata_json TEXT,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_events_account ON workspace_usage_events(customer_account_id, occurred_at);

CREATE TABLE IF NOT EXISTS workspace_usage_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_account_id INTEGER NOT NULL,
  workspace_subscription_id INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  assessment_count INTEGER NOT NULL DEFAULT 0,
  participant_count INTEGER NOT NULL DEFAULT 0,
  team_member_count INTEGER NOT NULL DEFAULT 0,
  export_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_usage_snapshots_period ON workspace_usage_snapshots(customer_account_id, period_start, period_end);

CREATE TABLE IF NOT EXISTS workspace_plan_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_code TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  feature_label TEXT NOT NULL,
  feature_enabled INTEGER NOT NULL DEFAULT 1,
  hard_limit_value INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_plan_features ON workspace_plan_features(plan_code, feature_key);
