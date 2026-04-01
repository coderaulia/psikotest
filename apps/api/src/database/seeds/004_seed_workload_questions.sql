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
  q.question_code,
  'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.',
  q.prompt,
  'workload_core',
  q.dimension_key,
  'likert',
  q.question_order,
  1,
  'active',
  JSON_OBJECT('scaleMin', 1, 'scaleMax', 5)
FROM test_types tt
JOIN (
  SELECT 'WORKLOAD_Q001' AS question_code, 'Seberapa besar tuntutan mental yang Anda rasakan saat mengerjakan tugas utama?' AS prompt, 'mental_demand' AS dimension_key, 1 AS question_order
  UNION ALL SELECT 'WORKLOAD_Q002', 'Seberapa sering Anda merasa harus berpikir cepat saat bekerja?', 'mental_demand', 2
  UNION ALL SELECT 'WORKLOAD_Q003', 'Seberapa kuat tekanan waktu yang Anda rasakan dalam pekerjaan harian?', 'time_pressure', 3
  UNION ALL SELECT 'WORKLOAD_Q004', 'Seberapa sering tenggat waktu membuat Anda harus terburu-buru?', 'time_pressure', 4
  UNION ALL SELECT 'WORKLOAD_Q005', 'Seberapa sulit tugas yang Anda kerjakan dibanding kemampuan Anda saat ini?', 'task_difficulty', 5
  UNION ALL SELECT 'WORKLOAD_Q006', 'Seberapa sering Anda merasa tugas memerlukan usaha ekstra untuk diselesaikan?', 'task_difficulty', 6
  UNION ALL SELECT 'WORKLOAD_Q007', 'Seberapa tinggi tingkat stres yang Anda rasakan selama bekerja?', 'stress_level', 7
  UNION ALL SELECT 'WORKLOAD_Q008', 'Seberapa sering pekerjaan membuat Anda tegang secara emosional?', 'stress_level', 8
  UNION ALL SELECT 'WORKLOAD_Q009', 'Seberapa lelah Anda setelah menyelesaikan pekerjaan harian?', 'fatigue', 9
  UNION ALL SELECT 'WORKLOAD_Q010', 'Seberapa sering Anda merasa energi menurun sebelum pekerjaan selesai?', 'fatigue', 10
) q ON 1 = 1
WHERE tt.code = 'workload'
ON DUPLICATE KEY UPDATE
  instruction_text = VALUES(instruction_text),
  prompt = VALUES(prompt),
  question_group_key = VALUES(question_group_key),
  dimension_key = VALUES(dimension_key),
  question_type = VALUES(question_type),
  question_order = VALUES(question_order),
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
  o.option_key,
  o.option_text,
  q.dimension_key,
  o.value_number,
  0,
  o.option_order,
  NULL
FROM questions q
JOIN (
  SELECT '1' AS option_key, 'Sangat Rendah' AS option_text, 1 AS value_number, 1 AS option_order
  UNION ALL SELECT '2', 'Rendah', 2, 2
  UNION ALL SELECT '3', 'Sedang', 3, 3
  UNION ALL SELECT '4', 'Tinggi', 4, 4
  UNION ALL SELECT '5', 'Sangat Tinggi', 5, 5
) o ON 1 = 1
JOIN test_types tt ON tt.id = q.test_type_id
WHERE tt.code = 'workload'
ON DUPLICATE KEY UPDATE
  option_text = VALUES(option_text),
  dimension_key = VALUES(dimension_key),
  value_number = VALUES(value_number),
  option_order = VALUES(option_order),
  updated_at = CURRENT_TIMESTAMP;
