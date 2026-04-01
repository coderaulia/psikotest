INSERT INTO questions (
  test_type_id,
  question_code,
  instruction_text,
  prompt,
  question_group_key,
  dimension_key,
  question_type,
  question_order,
  is_required,
  status,
  question_meta_json
)
SELECT
  tt.id,
  seed.question_code,
  'Rate each statement based on how closely it matches your current experience.',
  seed.prompt,
  'RESEARCH_PILOT_A',
  seed.dimension_key,
  'likert',
  seed.question_order,
  1,
  'active',
  JSON_OBJECT('instrument', 'research_pilot_scale', 'responseScale', '1_to_5_agreement')
FROM test_types tt
INNER JOIN (
  SELECT 'CUSTOM_Q001' AS question_code, 'I stay focused on academic tasks even when distractions are present.' AS prompt, 'self_regulation' AS dimension_key, 801 AS question_order
  UNION ALL SELECT 'CUSTOM_Q002', 'I postpone important work until the deadline is close.', 'procrastination', 802
  UNION ALL SELECT 'CUSTOM_Q003', 'I feel confident that I can handle difficult academic demands.', 'self_efficacy', 803
  UNION ALL SELECT 'CUSTOM_Q004', 'I feel mentally fatigued after a full day of study or research activity.', 'mental_fatigue', 804
  UNION ALL SELECT 'CUSTOM_Q005', 'I can rely on support from others when academic pressure increases.', 'social_support', 805
) seed ON 1 = 1
WHERE tt.code = 'custom'
ON DUPLICATE KEY UPDATE
  instruction_text = VALUES(instruction_text),
  prompt = VALUES(prompt),
  question_group_key = VALUES(question_group_key),
  dimension_key = VALUES(dimension_key),
  question_type = VALUES(question_type),
  question_order = VALUES(question_order),
  is_required = VALUES(is_required),
  status = VALUES(status),
  question_meta_json = VALUES(question_meta_json),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO question_options (
  question_id,
  option_key,
  option_text,
  dimension_key,
  value_number,
  is_correct,
  option_order,
  score_payload_json
)
SELECT
  q.id,
  opt.option_key,
  opt.option_text,
  q.dimension_key,
  opt.value_number,
  0,
  opt.option_order,
  JSON_OBJECT('weight', opt.value_number)
FROM questions q
INNER JOIN test_types tt ON tt.id = q.test_type_id
INNER JOIN (
  SELECT '1' AS option_key, 'Strongly disagree' AS option_text, 1 AS value_number, 1 AS option_order
  UNION ALL SELECT '2', 'Disagree', 2, 2
  UNION ALL SELECT '3', 'Neutral', 3, 3
  UNION ALL SELECT '4', 'Agree', 4, 4
  UNION ALL SELECT '5', 'Strongly agree', 5, 5
) opt ON 1 = 1
WHERE tt.code = 'custom'
  AND q.question_code IN ('CUSTOM_Q001', 'CUSTOM_Q002', 'CUSTOM_Q003', 'CUSTOM_Q004', 'CUSTOM_Q005')
ON DUPLICATE KEY UPDATE
  option_text = VALUES(option_text),
  dimension_key = VALUES(dimension_key),
  value_number = VALUES(value_number),
  is_correct = VALUES(is_correct),
  option_order = VALUES(option_order),
  score_payload_json = VALUES(score_payload_json),
  updated_at = CURRENT_TIMESTAMP;
