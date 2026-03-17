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
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_accounts_email (email),
  KEY idx_customer_accounts_org (organization_name)
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








