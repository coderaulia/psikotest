INSERT INTO test_sessions (
  test_type_id,
  title,
  description,
  access_token,
  instructions,
  settings_json,
  time_limit_minutes,
  status,
  starts_at,
  ends_at,
  created_by_admin_id
)
SELECT
  tt.id,
  'Research Scale Pilot',
  'Demo custom research questionnaire session for academic data collection workflows.',
  'research-scale-pilot',
  'Read each statement carefully before responding.\nUse the full response scale and answer based on your current experience.\nYour responses will be stored as structured research data for analysis.',
  JSON_OBJECT(
    'assessmentPurpose', 'research',
    'administrationMode', 'remote_unsupervised',
    'interpretationMode', 'self_assessment',
    'participantLimit', 100,
    'consentStatement', 'I agree to participate in this psychological research questionnaire and understand that my responses will be collected for academic or research analysis.',
    'privacyStatement', 'Your responses will be stored as confidential research data and used only by authorized lecturers, students, or research supervisors.',
    'contactPerson', 'Research coordinator'
  ),
  15,
  'active',
  NOW(),
  NULL,
  a.id
FROM test_types tt
INNER JOIN (
  SELECT id
  FROM admins
  WHERE status = 'active'
  ORDER BY CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, id ASC
  LIMIT 1
) a ON 1 = 1
WHERE tt.code = 'custom'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  instructions = VALUES(instructions),
  settings_json = VALUES(settings_json),
  time_limit_minutes = VALUES(time_limit_minutes),
  status = VALUES(status),
  created_by_admin_id = VALUES(created_by_admin_id),
  updated_at = CURRENT_TIMESTAMP;
