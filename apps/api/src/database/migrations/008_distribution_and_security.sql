-- Phase 2: Distribution policy and session security

ALTER TABLE test_sessions
  ADD COLUMN IF NOT EXISTS distribution_policy
    ENUM('hr_only', 'participant_summary', 'full_report_with_consent')
    NOT NULL DEFAULT 'participant_summary'
    AFTER settings_json,
  ADD COLUMN IF NOT EXISTS protected_delivery_mode
    TINYINT(1) NOT NULL DEFAULT 0
    AFTER distribution_policy,
  ADD COLUMN IF NOT EXISTS participant_result_access
    ENUM('none', 'summary', 'full_released')
    NOT NULL DEFAULT 'summary'
    AFTER protected_delivery_mode,
  ADD COLUMN IF NOT EXISTS hr_result_access
    ENUM('none', 'summary', 'full')
    NOT NULL DEFAULT 'full'
    AFTER participant_result_access;

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
    FOREIGN KEY (result_id) REFERENCES results (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
