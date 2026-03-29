SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'psychologist_reviewer') NOT NULL DEFAULT 'admin',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type ENUM('business', 'researcher') NOT NULL DEFAULT 'business',
  organization_name VARCHAR(190) NOT NULL,
  settings_json JSON NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_accounts_email (email),
  KEY idx_customer_accounts_org (organization_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  plan_code ENUM('starter', 'growth', 'research') NOT NULL DEFAULT 'starter',
  status ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial',
  billing_cycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
  billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL DEFAULT 'dummy',
  provider_customer_id VARCHAR(120) NULL,
  provider_subscription_id VARCHAR(120) NULL,
  provider_price_id VARCHAR(120) NULL,
  assessment_limit INT UNSIGNED NOT NULL,
  participant_limit INT UNSIGNED NOT NULL,
  team_member_limit INT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME NULL,
  renews_at DATETIME NULL,
  current_period_start DATETIME NULL,
  current_period_end DATETIME NULL,
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  canceled_at DATETIME NULL,
  past_due_at DATETIME NULL,
  suspended_at DATETIME NULL,
  plan_version INT UNSIGNED NOT NULL DEFAULT 1,
  billing_contact_email VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_subscriptions_account (customer_account_id),
  CONSTRAINT fk_workspace_subscriptions_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NOT NULL,
  session_key VARCHAR(120) NOT NULL,
  billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL DEFAULT 'dummy',
  plan_code ENUM('starter', 'growth', 'research') NOT NULL,
  billing_cycle ENUM('monthly', 'annual') NOT NULL,
  status ENUM('open', 'completed', 'expired', 'failed') NOT NULL DEFAULT 'open',
  checkout_url VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  completed_at DATETIME NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_checkout_sessions_key (session_key),
  KEY idx_billing_checkout_sessions_account (customer_account_id),
  KEY idx_billing_checkout_sessions_subscription (workspace_subscription_id),
  CONSTRAINT fk_billing_checkout_sessions_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_checkout_sessions_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NOT NULL,
  checkout_session_id BIGINT UNSIGNED NULL,
  external_invoice_id VARCHAR(120) NULL,
  invoice_number VARCHAR(120) NULL,
  status ENUM('draft', 'open', 'paid', 'void', 'uncollectible') NOT NULL DEFAULT 'draft',
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  amount_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  hosted_invoice_url VARCHAR(255) NULL,
  invoice_pdf_url VARCHAR(255) NULL,
  issued_at DATETIME NULL,
  due_at DATETIME NULL,
  paid_at DATETIME NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_billing_invoices_account (customer_account_id),
  KEY idx_billing_invoices_subscription (workspace_subscription_id),
  KEY idx_billing_invoices_checkout (checkout_session_id),
  CONSTRAINT fk_billing_invoices_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_invoices_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_invoices_checkout
    FOREIGN KEY (checkout_session_id) REFERENCES billing_checkout_sessions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  external_event_id VARCHAR(160) NOT NULL,
  processing_status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
  payload_json JSON NOT NULL,
  processed_at DATETIME NULL,
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_webhook_events_external (billing_provider, external_event_id),
  KEY idx_billing_webhook_events_status (processing_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_usage_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NULL,
  metric_key ENUM('assessment_created', 'participant_added', 'team_member_added', 'result_exported') NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  reference_type VARCHAR(80) NULL,
  reference_id BIGINT UNSIGNED NULL,
  metadata_json JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workspace_usage_events_account (customer_account_id, occurred_at),
  KEY idx_workspace_usage_events_subscription (workspace_subscription_id),
  CONSTRAINT fk_workspace_usage_events_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workspace_usage_events_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_usage_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NULL,
  period_start DATETIME NULL,
  period_end DATETIME NULL,
  assessment_count INT UNSIGNED NOT NULL DEFAULT 0,
  participant_count INT UNSIGNED NOT NULL DEFAULT 0,
  team_member_count INT UNSIGNED NOT NULL DEFAULT 0,
  export_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_usage_snapshots_period (customer_account_id, period_start, period_end),
  KEY idx_workspace_usage_snapshots_subscription (workspace_subscription_id),
  CONSTRAINT fk_workspace_usage_snapshots_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workspace_usage_snapshots_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_plan_features (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_code ENUM('starter', 'growth', 'research') NOT NULL,
  feature_key VARCHAR(80) NOT NULL,
  feature_label VARCHAR(120) NOT NULL,
  feature_enabled TINYINT(1) NOT NULL DEFAULT 1,
  hard_limit_value INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_plan_features (plan_code, feature_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  employee_code VARCHAR(100) NULL,
  department VARCHAR(120) NULL,
  position_title VARCHAR(120) NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_participants_name (full_name),
  KEY idx_participants_email (email),
  KEY idx_participants_employee_code (employee_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_types (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  question_style ENUM('single_choice', 'forced_choice', 'likert') NOT NULL,
  scoring_strategy VARCHAR(100) NOT NULL,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  test_type_id SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  access_token VARCHAR(80) NOT NULL,
  instructions TEXT NULL,
  settings_json JSON NULL,
  distribution_policy ENUM('hr_only', 'participant_summary', 'full_report_with_consent') NOT NULL DEFAULT 'participant_summary',
  protected_delivery_mode TINYINT(1) NOT NULL DEFAULT 0,
  participant_result_access ENUM('none', 'summary', 'full_released') NOT NULL DEFAULT 'summary',
  hr_result_access ENUM('none', 'summary', 'full') NOT NULL DEFAULT 'full',
  time_limit_minutes INT UNSIGNED NULL,
  status ENUM('draft', 'active', 'completed', 'archived') NOT NULL DEFAULT 'draft',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_by_admin_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_sessions_access_token (access_token),
  KEY idx_test_sessions_type_status (test_type_id, status),
  KEY idx_test_sessions_created_by (created_by_admin_id),
  CONSTRAINT fk_test_sessions_test_type
    FOREIGN KEY (test_type_id) REFERENCES test_types (id),
  CONSTRAINT fk_test_sessions_admin
    FOREIGN KEY (created_by_admin_id) REFERENCES admins (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  test_session_id BIGINT UNSIGNED NOT NULL,
  organization_name_snapshot VARCHAR(190) NOT NULL,
  onboarding_status ENUM('draft', 'ready') NOT NULL DEFAULT 'ready',
  plan_status ENUM('trial', 'upgraded') NOT NULL DEFAULT 'trial',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_assessments_session (test_session_id),
  KEY idx_customer_assessments_customer (customer_account_id),
  CONSTRAINT fk_customer_assessments_customer
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_assessments_session
    FOREIGN KEY (test_session_id) REFERENCES test_sessions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_workspace_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin', 'operator', 'reviewer') NOT NULL DEFAULT 'operator',
  invitation_status ENUM('active', 'invited') NOT NULL DEFAULT 'invited',
  activation_token VARCHAR(120) NULL,
  activation_expires_at DATETIME NULL,
  invited_at DATETIME NULL,
  activated_at DATETIME NULL,
  last_login_at DATETIME NULL,
  last_notified_at DATETIME NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_workspace_members_email (customer_account_id, email),
  KEY idx_customer_workspace_members_status (customer_account_id, invitation_status),
  CONSTRAINT fk_customer_workspace_members_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_assessment_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_assessment_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  employee_code VARCHAR(100) NULL,
  department VARCHAR(120) NULL,
  position_title VARCHAR(120) NULL,
  note VARCHAR(255) NULL,
  invitation_status ENUM('draft', 'invited') NOT NULL DEFAULT 'draft',
  invited_via ENUM('email', 'link') NULL,
  invited_at DATETIME NULL,
  reminder_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_reminder_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_assessment_participants_email (customer_assessment_id, email),
  KEY idx_customer_assessment_participants_status (customer_assessment_id, invitation_status),
  CONSTRAINT fk_customer_assessment_participants_assessment
    FOREIGN KEY (customer_assessment_id) REFERENCES customer_assessments (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  test_type_id SMALLINT UNSIGNED NOT NULL,
  question_code VARCHAR(50) NOT NULL,
  instruction_text TEXT NULL,
  prompt TEXT NULL,
  question_group_key VARCHAR(50) NULL,
  dimension_key VARCHAR(50) NULL,
  question_type ENUM('single_choice', 'forced_choice', 'likert') NOT NULL,
  question_order INT UNSIGNED NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'active',
  question_meta_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_questions_code (question_code),
  UNIQUE KEY uq_questions_type_order (test_type_id, question_order),
  KEY idx_questions_type_status (test_type_id, status),
  CONSTRAINT fk_questions_test_type
    FOREIGN KEY (test_type_id) REFERENCES test_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  option_key VARCHAR(20) NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  dimension_key VARCHAR(50) NULL,
  value_number DECIMAL(10,2) NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  option_order INT UNSIGNED NOT NULL,
  score_payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_question_options_key (question_id, option_key),
  UNIQUE KEY uq_question_options_order (question_id, option_order),
  KEY idx_question_options_dimension (dimension_key),
  CONSTRAINT fk_question_options_question
    FOREIGN KEY (question_id) REFERENCES questions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  test_session_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NOT NULL,
  attempt_no INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('not_started', 'in_progress', 'submitted', 'scored') NOT NULL DEFAULT 'in_progress',
  started_at DATETIME NULL,
  consent_given_at DATETIME NULL,
  consent_payload_json JSON NULL,
  identity_snapshot_json JSON NULL,
  answer_sequence INT UNSIGNED NOT NULL DEFAULT 0,
  submitted_at DATETIME NULL,
  time_spent_seconds INT UNSIGNED NULL,
  raw_score DECIMAL(10,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_submissions_session_participant_attempt (test_session_id, participant_id, attempt_no),
  KEY idx_submissions_status (status),
  KEY idx_submissions_submitted_at (submitted_at),
  CONSTRAINT fk_submissions_test_session
    FOREIGN KEY (test_session_id) REFERENCES test_sessions (id),
  CONSTRAINT fk_submissions_participant
    FOREIGN KEY (participant_id) REFERENCES participants (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  answer_role ENUM('single', 'most', 'least', 'scale') NOT NULL DEFAULT 'single',
  selected_option_id BIGINT UNSIGNED NULL,
  value_number DECIMAL(10,2) NULL,
  value_text VARCHAR(255) NULL,
  answer_payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_answers_submission_question_role (submission_id, question_id, answer_role),
  KEY idx_answers_question (question_id),
  KEY idx_answers_selected_option (selected_option_id),
  CONSTRAINT fk_answers_submission
    FOREIGN KEY (submission_id) REFERENCES submissions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_answers_question
    FOREIGN KEY (question_id) REFERENCES questions (id),
  CONSTRAINT fk_answers_selected_option
    FOREIGN KEY (selected_option_id) REFERENCES question_options (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  test_type_id SMALLINT UNSIGNED NOT NULL,
  score_total DECIMAL(10,2) NULL,
  score_band VARCHAR(100) NULL,
  primary_type VARCHAR(50) NULL,
  secondary_type VARCHAR(50) NULL,
  profile_code VARCHAR(50) NULL,
  interpretation_key VARCHAR(100) NULL,
  result_payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_results_submission (submission_id),
  KEY idx_results_test_type (test_type_id),
  KEY idx_results_profile_code (profile_code),
  CONSTRAINT fk_results_submission
    FOREIGN KEY (submission_id) REFERENCES submissions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_results_test_type
    FOREIGN KEY (test_type_id) REFERENCES test_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS result_summaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  result_id BIGINT UNSIGNED NOT NULL,
  metric_key VARCHAR(50) NOT NULL,
  metric_label VARCHAR(100) NOT NULL,
  metric_type ENUM('dimension', 'category', 'band', 'summary') NOT NULL DEFAULT 'dimension',
  score DECIMAL(10,2) NULL,
  band VARCHAR(100) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  summary_text TEXT NULL,
  chart_payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_result_summaries_metric (result_id, metric_key),
  KEY idx_result_summaries_metric_type (metric_type),
  CONSTRAINT fk_result_summaries_result
    FOREIGN KEY (result_id) REFERENCES results (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_access_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  result_id BIGINT UNSIGNED NOT NULL,
  accessor_type ENUM('admin', 'customer', 'participant', 'hr_user') NOT NULL,
  accessor_id BIGINT UNSIGNED NULL,
  access_action ENUM('view', 'download', 'export') NOT NULL DEFAULT 'view',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_access_result (result_id),
  KEY idx_report_access_created (created_at),
  CONSTRAINT fk_report_access_result
    FOREIGN KEY (result_id) REFERENCES results (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_type ENUM('admin', 'participant', 'system') NOT NULL DEFAULT 'system',
  actor_admin_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_created_at (created_at),
  KEY idx_audit_logs_actor_admin (actor_admin_id),
  CONSTRAINT fk_audit_logs_admin
    FOREIGN KEY (actor_admin_id) REFERENCES admins (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;











