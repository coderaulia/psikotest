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
  'Pilih satu jawaban yang paling tepat.',
  q.prompt,
  'iq_dummy',
  q.dimension_key,
  'single_choice',
  q.question_order,
  1,
  'active',
  JSON_OBJECT('difficulty', q.difficulty)
FROM test_types tt
JOIN (
  SELECT 'IQ_Q001' AS question_code, 'Angka berikutnya dalam pola 2, 4, 6, 8, ... adalah?' AS prompt, 'numerical' AS dimension_key, 'easy' AS difficulty, 1 AS question_order
  UNION ALL SELECT 'IQ_Q002', 'Manakah bentuk hubungan yang benar: Buku : Membaca = Garpu : ?', 'verbal', 'easy', 2
  UNION ALL SELECT 'IQ_Q003', 'Jika semua mawar adalah bunga dan beberapa bunga cepat layu, maka pernyataan yang benar adalah?', 'logical', 'medium', 3
  UNION ALL SELECT 'IQ_Q004', 'Pilih angka yang tidak sesuai dengan kelompok: 3, 5, 7, 10, 11', 'numerical', 'medium', 4
  UNION ALL SELECT 'IQ_Q005', 'Jika sebuah rapat dimulai pukul 09:15 dan berlangsung selama 95 menit, rapat selesai pukul?', 'analytical', 'medium', 5
  UNION ALL SELECT 'IQ_Q006', 'Pilih pasangan kata yang paling mirip maknanya dengan “teliti”.', 'verbal', 'easy', 6
  UNION ALL SELECT 'IQ_Q007', 'Jika 5 mesin membuat 5 komponen dalam 5 menit, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 komponen?', 'numerical', 'hard', 7
  UNION ALL SELECT 'IQ_Q008', 'Semua analis menyukai data. Bima adalah analis. Kesimpulan yang tepat adalah?', 'logical', 'easy', 8
) q ON 1 = 1
WHERE tt.code = 'iq'
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
  NULL,
  NULL,
  o.is_correct,
  o.option_order,
  NULL
FROM questions q
JOIN (
  SELECT 'IQ_Q001' AS question_code, 'A' AS option_key, '9' AS option_text, 0 AS is_correct, 1 AS option_order
  UNION ALL SELECT 'IQ_Q001', 'B', '10', 1, 2
  UNION ALL SELECT 'IQ_Q001', 'C', '12', 0, 3
  UNION ALL SELECT 'IQ_Q001', 'D', '14', 0, 4
  UNION ALL SELECT 'IQ_Q002', 'A', 'Menulis', 0, 1
  UNION ALL SELECT 'IQ_Q002', 'B', 'Makan', 1, 2
  UNION ALL SELECT 'IQ_Q002', 'C', 'Menyapu', 0, 3
  UNION ALL SELECT 'IQ_Q002', 'D', 'Menggambar', 0, 4
  UNION ALL SELECT 'IQ_Q003', 'A', 'Beberapa mawar cepat layu', 0, 1
  UNION ALL SELECT 'IQ_Q003', 'B', 'Semua bunga adalah mawar', 0, 2
  UNION ALL SELECT 'IQ_Q003', 'C', 'Sebagian yang cepat layu bisa jadi mawar', 1, 3
  UNION ALL SELECT 'IQ_Q003', 'D', 'Tidak ada bunga yang cepat layu', 0, 4
  UNION ALL SELECT 'IQ_Q004', 'A', '3', 0, 1
  UNION ALL SELECT 'IQ_Q004', 'B', '5', 0, 2
  UNION ALL SELECT 'IQ_Q004', 'C', '7', 0, 3
  UNION ALL SELECT 'IQ_Q004', 'D', '10', 1, 4
  UNION ALL SELECT 'IQ_Q004', 'E', '11', 0, 5
  UNION ALL SELECT 'IQ_Q005', 'A', '10:30', 0, 1
  UNION ALL SELECT 'IQ_Q005', 'B', '10:45', 0, 2
  UNION ALL SELECT 'IQ_Q005', 'C', '10:50', 1, 3
  UNION ALL SELECT 'IQ_Q005', 'D', '11:00', 0, 4
  UNION ALL SELECT 'IQ_Q006', 'A', 'Cermat', 1, 1
  UNION ALL SELECT 'IQ_Q006', 'B', 'Cepat', 0, 2
  UNION ALL SELECT 'IQ_Q006', 'C', 'Berani', 0, 3
  UNION ALL SELECT 'IQ_Q006', 'D', 'Lugas', 0, 4
  UNION ALL SELECT 'IQ_Q007', 'A', '1 menit', 0, 1
  UNION ALL SELECT 'IQ_Q007', 'B', '5 menit', 1, 2
  UNION ALL SELECT 'IQ_Q007', 'C', '20 menit', 0, 3
  UNION ALL SELECT 'IQ_Q007', 'D', '100 menit', 0, 4
  UNION ALL SELECT 'IQ_Q008', 'A', 'Bima menyukai data', 1, 1
  UNION ALL SELECT 'IQ_Q008', 'B', 'Semua yang suka data adalah analis', 0, 2
  UNION ALL SELECT 'IQ_Q008', 'C', 'Bima tidak menyukai data', 0, 3
  UNION ALL SELECT 'IQ_Q008', 'D', 'Tidak ada kesimpulan yang dapat diambil', 0, 4
) o ON o.question_code = q.question_code
JOIN test_types tt ON tt.id = q.test_type_id
WHERE tt.code = 'iq'
ON DUPLICATE KEY UPDATE
  option_text = VALUES(option_text),
  is_correct = VALUES(is_correct),
  option_order = VALUES(option_order),
  updated_at = CURRENT_TIMESTAMP;
