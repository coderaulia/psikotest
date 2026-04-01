INSERT INTO test_types (code, name, description, question_style, scoring_strategy, status)
VALUES
  (
    'iq',
    'IQ Test',
    'Multiple-choice cognitive assessment with one correct answer per question.',
    'single_choice',
    'iq_standard',
    'active'
  ),
  (
    'disc',
    'DISC Personality Test',
    'Forced-choice personality questionnaire using most/least selections across D, I, S, and C dimensions.',
    'forced_choice',
    'disc_forced_choice',
    'active'
  ),
  (
    'workload',
    'Workload Assessment',
    'Likert-scale workload assessment covering demand, pressure, stress, and fatigue dimensions.',
    'likert',
    'workload_likert_sum',
    'active'
  ),
  (
    'custom',
    'Custom Psychological Research Test',
    'Research-configured questionnaire or scale instrument for academic studies, surveys, and new scale development.',
    'likert',
    'custom_questionnaire',
    'active'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  question_style = VALUES(question_style),
  scoring_strategy = VALUES(scoring_strategy),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;
