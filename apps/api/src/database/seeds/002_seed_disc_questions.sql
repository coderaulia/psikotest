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
  status
)
SELECT
  tt.id,
  q.question_code,
  q.instruction_text,
  NULL,
  NULL,
  NULL,
  'forced_choice',
  q.question_order,
  1,
  'active'
FROM test_types tt
JOIN (
  SELECT 'DISC_Q001' AS question_code, 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.' AS instruction_text, 1 AS question_order
  UNION ALL SELECT 'DISC_Q002', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 2
  UNION ALL SELECT 'DISC_Q003', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 3
  UNION ALL SELECT 'DISC_Q004', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 4
  UNION ALL SELECT 'DISC_Q005', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 5
  UNION ALL SELECT 'DISC_Q006', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 6
  UNION ALL SELECT 'DISC_Q007', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 7
  UNION ALL SELECT 'DISC_Q008', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 8
  UNION ALL SELECT 'DISC_Q009', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 9
  UNION ALL SELECT 'DISC_Q010', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 10
  UNION ALL SELECT 'DISC_Q011', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 11
  UNION ALL SELECT 'DISC_Q012', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 12
  UNION ALL SELECT 'DISC_Q013', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 13
  UNION ALL SELECT 'DISC_Q014', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 14
  UNION ALL SELECT 'DISC_Q015', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 15
  UNION ALL SELECT 'DISC_Q016', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 16
  UNION ALL SELECT 'DISC_Q017', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 17
  UNION ALL SELECT 'DISC_Q018', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 18
  UNION ALL SELECT 'DISC_Q019', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 19
  UNION ALL SELECT 'DISC_Q020', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 20
  UNION ALL SELECT 'DISC_Q021', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 21
  UNION ALL SELECT 'DISC_Q022', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 22
  UNION ALL SELECT 'DISC_Q023', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 23
  UNION ALL SELECT 'DISC_Q024', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', 24
) q ON 1 = 1
WHERE tt.code = 'disc'
ON DUPLICATE KEY UPDATE
  instruction_text = VALUES(instruction_text),
  question_type = VALUES(question_type),
  question_order = VALUES(question_order),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO question_options (
  question_id,
  option_key,
  option_text,
  dimension_key,
  value_number,
  is_correct,
  option_order
)
SELECT
  q.id,
  o.option_key,
  o.option_text,
  o.dimension_key,
  1,
  0,
  o.option_order
FROM questions q
JOIN (
  SELECT 'DISC_Q001' AS question_code, 'A' AS option_key, 'Saya suka mengambil keputusan dengan cepat' AS option_text, 'D' AS dimension_key, 1 AS option_order
  UNION ALL SELECT 'DISC_Q001', 'B', 'Saya mudah bergaul dan berbicara dengan banyak orang', 'I', 2
  UNION ALL SELECT 'DISC_Q001', 'C', 'Saya lebih nyaman bekerja dalam suasana stabil', 'S', 3
  UNION ALL SELECT 'DISC_Q001', 'D', 'Saya memperhatikan detail sebelum mengambil keputusan', 'C', 4
  UNION ALL SELECT 'DISC_Q002', 'A', 'Saya suka memimpin dan mengarahkan orang lain', 'D', 1
  UNION ALL SELECT 'DISC_Q002', 'B', 'Saya suka membuat suasana kerja menjadi menyenangkan', 'I', 2
  UNION ALL SELECT 'DISC_Q002', 'C', 'Saya sabar dan konsisten dalam bekerja', 'S', 3
  UNION ALL SELECT 'DISC_Q002', 'D', 'Saya teliti dan mengikuti prosedur dengan baik', 'C', 4
  UNION ALL SELECT 'DISC_Q003', 'A', 'Saya fokus pada hasil dan target', 'D', 1
  UNION ALL SELECT 'DISC_Q003', 'B', 'Saya mudah membangun hubungan dengan orang baru', 'I', 2
  UNION ALL SELECT 'DISC_Q003', 'C', 'Saya pendengar yang baik', 'S', 3
  UNION ALL SELECT 'DISC_Q003', 'D', 'Saya menyukai data dan analisis', 'C', 4
  UNION ALL SELECT 'DISC_Q004', 'A', 'Saya berani menghadapi tantangan', 'D', 1
  UNION ALL SELECT 'DISC_Q004', 'B', 'Saya suka memotivasi orang lain', 'I', 2
  UNION ALL SELECT 'DISC_Q004', 'C', 'Saya setia dan dapat diandalkan', 'S', 3
  UNION ALL SELECT 'DISC_Q004', 'D', 'Saya berhati-hati dalam mengambil keputusan', 'C', 4
  UNION ALL SELECT 'DISC_Q005', 'A', 'Saya ingin menyelesaikan masalah dengan cepat', 'D', 1
  UNION ALL SELECT 'DISC_Q005', 'B', 'Saya suka berbicara di depan banyak orang', 'I', 2
  UNION ALL SELECT 'DISC_Q005', 'C', 'Saya menghargai kerja tim yang harmonis', 'S', 3
  UNION ALL SELECT 'DISC_Q005', 'D', 'Saya memastikan pekerjaan dilakukan dengan benar', 'C', 4
  UNION ALL SELECT 'DISC_Q006', 'A', 'Saya tegas dalam mengambil keputusan', 'D', 1
  UNION ALL SELECT 'DISC_Q006', 'B', 'Saya optimis dan penuh energi', 'I', 2
  UNION ALL SELECT 'DISC_Q006', 'C', 'Saya stabil dan tidak mudah berubah', 'S', 3
  UNION ALL SELECT 'DISC_Q006', 'D', 'Saya sistematis dan terstruktur', 'C', 4
  UNION ALL SELECT 'DISC_Q007', 'A', 'Saya menyukai kompetisi', 'D', 1
  UNION ALL SELECT 'DISC_Q007', 'B', 'Saya suka berinteraksi dengan banyak orang', 'I', 2
  UNION ALL SELECT 'DISC_Q007', 'C', 'Saya menjaga hubungan jangka panjang', 'S', 3
  UNION ALL SELECT 'DISC_Q007', 'D', 'Saya memperhatikan akurasi', 'C', 4
  UNION ALL SELECT 'DISC_Q008', 'A', 'Saya fokus mencapai tujuan', 'D', 1
  UNION ALL SELECT 'DISC_Q008', 'B', 'Saya ekspresif dan komunikatif', 'I', 2
  UNION ALL SELECT 'DISC_Q008', 'C', 'Saya tenang dan sabar', 'S', 3
  UNION ALL SELECT 'DISC_Q008', 'D', 'Saya mengikuti standar kerja dengan ketat', 'C', 4
  UNION ALL SELECT 'DISC_Q009', 'A', 'Saya cepat bertindak', 'D', 1
  UNION ALL SELECT 'DISC_Q009', 'B', 'Saya suka menjadi pusat perhatian', 'I', 2
  UNION ALL SELECT 'DISC_Q009', 'C', 'Saya mendukung anggota tim lain', 'S', 3
  UNION ALL SELECT 'DISC_Q009', 'D', 'Saya memeriksa detail sebelum menyelesaikan pekerjaan', 'C', 4
  UNION ALL SELECT 'DISC_Q010', 'A', 'Saya percaya diri dalam mengambil keputusan', 'D', 1
  UNION ALL SELECT 'DISC_Q010', 'B', 'Saya mudah mempengaruhi orang lain', 'I', 2
  UNION ALL SELECT 'DISC_Q010', 'C', 'Saya bekerja dengan ritme stabil', 'S', 3
  UNION ALL SELECT 'DISC_Q010', 'D', 'Saya fokus pada kualitas', 'C', 4
  UNION ALL SELECT 'DISC_Q011', 'A', 'Saya ingin memimpin proyek penting', 'D', 1
  UNION ALL SELECT 'DISC_Q011', 'B', 'Saya suka membangun jaringan pertemanan', 'I', 2
  UNION ALL SELECT 'DISC_Q011', 'C', 'Saya loyal terhadap tim', 'S', 3
  UNION ALL SELECT 'DISC_Q011', 'D', 'Saya memastikan semua aturan dipatuhi', 'C', 4
  UNION ALL SELECT 'DISC_Q012', 'A', 'Saya suka tantangan besar', 'D', 1
  UNION ALL SELECT 'DISC_Q012', 'B', 'Saya suka suasana kerja yang dinamis', 'I', 2
  UNION ALL SELECT 'DISC_Q012', 'C', 'Saya menghargai stabilitas kerja', 'S', 3
  UNION ALL SELECT 'DISC_Q012', 'D', 'Saya mengutamakan ketelitian', 'C', 4
  UNION ALL SELECT 'DISC_Q013', 'A', 'Saya ingin mengontrol situasi', 'D', 1
  UNION ALL SELECT 'DISC_Q013', 'B', 'Saya suka menyampaikan ide dengan antusias', 'I', 2
  UNION ALL SELECT 'DISC_Q013', 'C', 'Saya menjaga keharmonisan tim', 'S', 3
  UNION ALL SELECT 'DISC_Q013', 'D', 'Saya bekerja secara metodis', 'C', 4
  UNION ALL SELECT 'DISC_Q014', 'A', 'Saya fokus pada pencapaian', 'D', 1
  UNION ALL SELECT 'DISC_Q014', 'B', 'Saya pandai membujuk orang lain', 'I', 2
  UNION ALL SELECT 'DISC_Q014', 'C', 'Saya pendukung yang baik', 'S', 3
  UNION ALL SELECT 'DISC_Q014', 'D', 'Saya memperhatikan prosedur', 'C', 4
  UNION ALL SELECT 'DISC_Q015', 'A', 'Saya cepat mengambil tindakan', 'D', 1
  UNION ALL SELECT 'DISC_Q015', 'B', 'Saya mudah membangun koneksi', 'I', 2
  UNION ALL SELECT 'DISC_Q015', 'C', 'Saya konsisten dalam pekerjaan', 'S', 3
  UNION ALL SELECT 'DISC_Q015', 'D', 'Saya teliti terhadap kesalahan', 'C', 4
  UNION ALL SELECT 'DISC_Q016', 'A', 'Saya ingin menjadi pengambil keputusan', 'D', 1
  UNION ALL SELECT 'DISC_Q016', 'B', 'Saya energik dan komunikatif', 'I', 2
  UNION ALL SELECT 'DISC_Q016', 'C', 'Saya sabar menghadapi perubahan', 'S', 3
  UNION ALL SELECT 'DISC_Q016', 'D', 'Saya menyukai aturan yang jelas', 'C', 4
  UNION ALL SELECT 'DISC_Q017', 'A', 'Saya menyukai kontrol terhadap situasi', 'D', 1
  UNION ALL SELECT 'DISC_Q017', 'B', 'Saya ekspresif dalam menyampaikan ide', 'I', 2
  UNION ALL SELECT 'DISC_Q017', 'C', 'Saya kooperatif dengan tim', 'S', 3
  UNION ALL SELECT 'DISC_Q017', 'D', 'Saya fokus pada akurasi', 'C', 4
  UNION ALL SELECT 'DISC_Q018', 'A', 'Saya berorientasi pada kemenangan', 'D', 1
  UNION ALL SELECT 'DISC_Q018', 'B', 'Saya suka menghibur orang lain', 'I', 2
  UNION ALL SELECT 'DISC_Q018', 'C', 'Saya tenang dalam tekanan', 'S', 3
  UNION ALL SELECT 'DISC_Q018', 'D', 'Saya logis dan analitis', 'C', 4
  UNION ALL SELECT 'DISC_Q019', 'A', 'Saya suka memimpin diskusi', 'D', 1
  UNION ALL SELECT 'DISC_Q019', 'B', 'Saya mudah beradaptasi dengan orang baru', 'I', 2
  UNION ALL SELECT 'DISC_Q019', 'C', 'Saya menjaga stabilitas kerja', 'S', 3
  UNION ALL SELECT 'DISC_Q019', 'D', 'Saya memperhatikan detail kecil', 'C', 4
  UNION ALL SELECT 'DISC_Q020', 'A', 'Saya berani mengambil risiko', 'D', 1
  UNION ALL SELECT 'DISC_Q020', 'B', 'Saya komunikatif dan terbuka', 'I', 2
  UNION ALL SELECT 'DISC_Q020', 'C', 'Saya setia pada proses', 'S', 3
  UNION ALL SELECT 'DISC_Q020', 'D', 'Saya memastikan kualitas kerja', 'C', 4
  UNION ALL SELECT 'DISC_Q021', 'A', 'Saya fokus menyelesaikan target', 'D', 1
  UNION ALL SELECT 'DISC_Q021', 'B', 'Saya suka mempengaruhi orang lain', 'I', 2
  UNION ALL SELECT 'DISC_Q021', 'C', 'Saya sabar dalam bekerja', 'S', 3
  UNION ALL SELECT 'DISC_Q021', 'D', 'Saya sistematis dalam berpikir', 'C', 4
  UNION ALL SELECT 'DISC_Q022', 'A', 'Saya menyukai tantangan baru', 'D', 1
  UNION ALL SELECT 'DISC_Q022', 'B', 'Saya suka berbicara dengan banyak orang', 'I', 2
  UNION ALL SELECT 'DISC_Q022', 'C', 'Saya menjaga hubungan kerja yang baik', 'S', 3
  UNION ALL SELECT 'DISC_Q022', 'D', 'Saya memperhatikan aturan kerja', 'C', 4
  UNION ALL SELECT 'DISC_Q023', 'A', 'Saya ingin mencapai hasil terbaik', 'D', 1
  UNION ALL SELECT 'DISC_Q023', 'B', 'Saya antusias terhadap ide baru', 'I', 2
  UNION ALL SELECT 'DISC_Q023', 'C', 'Saya stabil dan konsisten', 'S', 3
  UNION ALL SELECT 'DISC_Q023', 'D', 'Saya berhati-hati terhadap kesalahan', 'C', 4
  UNION ALL SELECT 'DISC_Q024', 'A', 'Saya fokus pada kemenangan', 'D', 1
  UNION ALL SELECT 'DISC_Q024', 'B', 'Saya suka membangun relasi', 'I', 2
  UNION ALL SELECT 'DISC_Q024', 'C', 'Saya dapat diandalkan', 'S', 3
  UNION ALL SELECT 'DISC_Q024', 'D', 'Saya analitis dalam bekerja', 'C', 4
) o ON o.question_code = q.question_code
JOIN test_types tt ON tt.id = q.test_type_id
WHERE tt.code = 'disc'
ON DUPLICATE KEY UPDATE
  option_text = VALUES(option_text),
  dimension_key = VALUES(dimension_key),
  value_number = VALUES(value_number),
  option_order = VALUES(option_order),
  updated_at = CURRENT_TIMESTAMP;
