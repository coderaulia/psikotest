INSERT INTO customer_accounts (
  full_name,
  email,
  password_hash,
  account_type,
  organization_name,
  settings_json,
  status,
  last_login_at,
  session_version
)
VALUES
(
  'Demo Workspace Owner',
  'demo.business@vanaila.test',
  'scrypt$cab12dcf8199658d72ae6e73970059f0$7bc03d8b51fd27411c895ea626bde6c831b8a98bd87c4d86f0a2985bcf030fd84b0f662ac938dda3e15bbbdd005d4641bb1328429978290bb6e58a942fcbec79',
  'business',
  'Vanaila Demo Company',
  JSON_OBJECT(
    'brandName', 'Vanaila Demo Company',
    'brandTagline', 'Structured assessment workspace',
    'supportEmail', 'demo.business@vanaila.test',
    'contactPerson', 'Demo Workspace Owner',
    'defaultAssessmentPurpose', 'recruitment',
    'defaultAdministrationMode', 'remote_unsupervised',
    'defaultResultVisibility', 'review_required',
    'defaultParticipantLimit', 25,
    'defaultTimeLimitMinutes', 20,
    'defaultConsentStatement', 'I agree to participate in the assessment conducted by {{organizationName}}.',
    'defaultPrivacyStatement', 'Your responses will be handled as confidential assessment data for {{organizationName}}.'
  ),
  'active',
  NOW(),
  1
),
(
  'Demo Research Owner',
  'demo.research@vanaila.test',
  'scrypt$cab12dcf8199658d72ae6e73970059f0$7bc03d8b51fd27411c895ea626bde6c831b8a98bd87c4d86f0a2985bcf030fd84b0f662ac938dda3e15bbbdd005d4641bb1328429978290bb6e58a942fcbec79',
  'researcher',
  'Vanaila Research Lab',
  JSON_OBJECT(
    'brandName', 'Vanaila Research Lab',
    'brandTagline', 'Structured psychological research workspace',
    'supportEmail', 'demo.research@vanaila.test',
    'contactPerson', 'Demo Research Owner',
    'defaultAssessmentPurpose', 'research',
    'defaultAdministrationMode', 'remote_unsupervised',
    'defaultResultVisibility', 'participant_summary',
    'defaultParticipantLimit', 100,
    'defaultTimeLimitMinutes', 15,
    'defaultConsentStatement', 'I agree to participate in this assessment or questionnaire managed by {{organizationName}}.',
    'defaultPrivacyStatement', 'Your responses will be stored as confidential research data for {{organizationName}}.'
  ),
  'active',
  NOW(),
  1
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  account_type = VALUES(account_type),
  organization_name = VALUES(organization_name),
  settings_json = VALUES(settings_json),
  status = VALUES(status),
  session_version = VALUES(session_version),
  updated_at = CURRENT_TIMESTAMP;
