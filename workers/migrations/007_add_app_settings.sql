-- Migration 005: Add app_settings table for session defaults
-- Run with: wrangler d1 execute psikotest-db --file=./migrations/005_add_app_settings.sql

-- App settings table for storing configuration like session defaults
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Insert default session defaults if not exists
INSERT OR IGNORE INTO app_settings (setting_key, setting_value_json) VALUES (
  'session_defaults',
  JSON_OBJECT(
    'timeLimitMinutes', 15,
    'descriptionTemplate', 'Use this assessment session to gather structured psychological screening data for the selected purpose.',
    'instructions', JSON_ARRAY(
      'Read each question carefully before responding.',
      'Answer honestly and complete the assessment in one sitting.',
      'Contact the listed administrator if you need clarification before submitting.'
    ),
    'settings', JSON_OBJECT(
      'assessmentPurpose', 'recruitment',
      'administrationMode', 'remote_unsupervised',
      'interpretationMode', 'professional_review',
      'participantLimit', NULL,
      'consentStatement', 'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
      'privacyStatement', 'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
      'contactPerson', 'HR Assessment Desk',
      'distributionPolicy', 'participant_summary',
      'protectedDeliveryMode', false,
      'participantResultAccess', 'summary',
      'hrResultAccess', 'full'
    )
  )
);
