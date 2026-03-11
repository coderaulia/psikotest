INSERT INTO admins (full_name, email, password_hash, role, status)
VALUES
  ('System Administrator', 'admin@psikotest.local', 'hostinger-demo-password-not-used', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

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
  seed.title,
  seed.description,
  seed.access_token,
  seed.instructions,
  JSON_OBJECT('source', 'demo_seed'),
  seed.time_limit_minutes,
  'active',
  NOW(),
  NULL,
  a.id
FROM test_types tt
INNER JOIN admins a
  ON a.email = 'admin@psikotest.local'
INNER JOIN (
  SELECT
    'disc' AS test_type_code,
    'Graduate Hiring Batch A' AS title,
    'Demo DISC session for participant flow and result scoring.' AS description,
    'disc-batch-a' AS access_token,
    'Pilih satu pernyataan yang paling menggambarkan diri Anda.\nPilih satu pernyataan yang paling tidak menggambarkan diri Anda.\nJawab secara spontan, tidak ada jawaban benar atau salah.' AS instructions,
    15 AS time_limit_minutes
  UNION ALL
  SELECT
    'iq',
    'Leadership IQ Screening',
    'Demo IQ screening session with dummy questions.',
    'iq-screening',
    'Pilih satu jawaban yang paling tepat untuk setiap soal.\nUtamakan ketepatan jawaban dalam batas waktu yang tersedia.',
    20
  UNION ALL
  SELECT
    'workload',
    'Operations Workload Check',
    'Demo workload assessment session for operational teams.',
    'workload-check',
    'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.\nGunakan skala dari sangat rendah hingga sangat tinggi.',
    10
) seed ON seed.test_type_code = tt.code
WHERE a.status = 'active'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  instructions = VALUES(instructions),
  settings_json = VALUES(settings_json),
  time_limit_minutes = VALUES(time_limit_minutes),
  status = VALUES(status),
  created_by_admin_id = VALUES(created_by_admin_id),
  updated_at = CURRENT_TIMESTAMP;
