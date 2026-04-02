-- Migration 008: Settings expansion schemas
-- Run with: wrangler d1 execute psikotest-db --local --file="./migrations/008_settings_expansion.sql"

-- We insert the new default settings for platform identity, compliance defaults, security defaults, and customer controls into app_settings.

INSERT OR IGNORE INTO app_settings (setting_key, setting_value_json) VALUES (
  'platform_identity',
  JSON_OBJECT(
    'platformDisplayName', 'Vanaila Psikotest',
    'supportEmail', 'support@vanaila.com',
    'publicContactUrl', 'https://vanaila.com/contact'
  )
);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value_json) VALUES (
  'compliance_defaults',
  JSON_OBJECT(
    'consentStatementTemplate', 'I agree to participate in this psychological assessment and understand that my responses will be used for the stated assessment purpose.',
    'privacyStatementTemplate', 'Your personal information and responses will be treated as confidential assessment data and accessed only by authorized reviewers.',
    'reviewerAssignmentMode', 'auto_assign'
  )
);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value_json) VALUES (
  'security_defaults',
  JSON_OBJECT(
    'submissionTokenExpiryHours', 4,
    'protectedDeliveryModeDefault', false,
    'answerSequenceStrictness', 'standard'
  )
);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value_json) VALUES (
  'customer_controls',
  JSON_OBJECT(
    'defaultPlanCode', 'starter',
    'trialDurationDays', 14,
    'requireManualActivation', false
  )
);

-- Workspace settings are contained within the existing customer_accounts.settings_json column.
