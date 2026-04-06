-- Seed DISC Questions (Indonesian)
-- NOTE: These are DEMONSTRATION QUESTIONS for platform testing only.
-- They are NOT validated psychometric instruments and should not be used for assessment.
-- Replace with professionally validated questions before production use.

-- DISC uses single-choice questions where each option corresponds to a dimension (D/I/S/C)
-- Dimension: D = Dominance, I = Influence, S = Steadiness, C = Conscientiousness

-- D (Dominance) Questions - Focus on results, control, challenge
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(2, 'DISC-D-001', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Dalam menghadapi tantangan, saya cenderung:', NULL, 'D', 'single_choice', 1, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-D-002', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Ketika memimpin tim, saya biasanya:', NULL, 'D', 'single_choice', 2, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-D-003', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Dalam mengambil keputusan, saya:', NULL, 'D', 'single_choice', 3, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-D-004', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Saya paling nyaman ketika:', NULL, 'D', 'single_choice', 4, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-D-005', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Ketika ada konflik dalam tim, saya:', NULL, 'D', 'single_choice', 5, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-D-006', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Pendapat orang lain tentang saya:', NULL, 'D', 'single_choice', 6, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- D Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- DISC-D-001
((SELECT id FROM questions WHERE question_code = 'DISC-D-001'), 'A', 'Menghadapi langsung dan mencari solusi', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-001'), 'B', 'Berbicara dengan orang lain untuk mendapatkan perspektif', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-001'), 'C', 'Menganalisis dengan teliti sebelum bertindak', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-001'), 'D', 'Mencari cara yang tidak menimbulkan konflik', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-D-002
((SELECT id FROM questions WHERE question_code = 'DISC-D-002'), 'A', 'Memberikan arahan yang jelas dan menetapkan target', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-002'), 'B', 'Mendorong partisipasi dan antusiasme tim', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-002'), 'C', 'Mendengarkan dan mempertimbangkan semua masukan', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-002'), 'D', 'Memastikan prosedur dan standar diikuti', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-D-003
((SELECT id FROM questions WHERE question_code = 'DISC-D-003'), 'A', 'Mengambil keputusan dengan cepat dan tegas', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-003'), 'B', 'Mengutamakan hubungan dan dampak sosial', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-003'), 'C', 'Mengambil keputusan berdasarkan data dan fakta', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-003'), 'D', 'Mempertimbangkan dampak pada semua pihak', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-D-004
((SELECT id FROM questions WHERE question_code = 'DISC-D-004'), 'A', 'Memiliki kontrol dan dapat mempengaruhi hasil', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-004'), 'B', 'Berdiskusi dan berinteraksi dengan orang banyak', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-004'), 'C', 'Bekerja dalam lingkungan yang stabil dan harmonis', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-004'), 'D', 'Memiliki informasi lengkap dan detail yang akurat', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-D-005
((SELECT id FROM questions WHERE question_code = 'DISC-D-005'), 'A', 'Mengambil alih dan menyelesaikan dengan cepat', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-005'), 'B', 'Membantu menengahi dan mencari solusi kreatif', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-005'), 'C', 'Menganalisis akar masalah secara sistematis', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-005'), 'D', 'Mendengarkan semua pihak dan mencari kesepakatan', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-D-006
((SELECT id FROM questions WHERE question_code = 'DISC-D-006'), 'A', 'Orang yang tegas, langsung, dan berorientasi hasil', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-006'), 'B', 'Orang yang antusias, ramah, dan mudah bergaul', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-006'), 'C', 'Orang yang sabar, setia, dan dapat diandalkan', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-D-006'), 'D', 'Orang yang teliti, akurat, dan berorientasi kualitas', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- I (Influence) Questions - Focus on people, enthusiasm, communication
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(2, 'DISC-I-001', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Dalam rapat tim, saya biasanya:', NULL, 'I', 'single_choice', 7, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-I-002', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Ketika berkomunikasi, saya:', NULL, 'I', 'single_choice', 8, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-I-003', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Dalam membangun hubungan kerja, saya:', NULL, 'I', 'single_choice', 9, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-I-004', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Ketika mempresentasikan ide:', NULL, 'I', 'single_choice', 10, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-I-005', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Dalam situasi baru, saya cenderung:', NULL, 'I', 'single_choice', 11, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-I-006', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi sosial.', 'Saya merasa paling energik ketika:', NULL, 'I', 'single_choice', 12, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- I Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- DISC-I-001
((SELECT id FROM questions WHERE question_code = 'DISC-I-001'), 'A', 'Memimpin diskusi dan mengarahkan topik', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-001'), 'B', 'Berkontribusi aktif dan membangkitkan semangat', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-001'), 'C', 'Mendengarkan dengan seksama dan memberikan dukungan', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-001'), 'D', 'Menganalisis dan memastikan informasi akurat', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-I-002
((SELECT id FROM questions WHERE question_code = 'DISC-I-002'), 'A', 'Berbicara dengan percaya diri dan langsung ke poin', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-002'), 'B', 'Menggunakan cerita dan humor untuk menyampaikan pesan', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-002'), 'C', 'Mendengarkan lebih banyak daripada berbicara', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-002'), 'D', 'Menyampaikan informasi dengan detail dan presisi', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-I-003
((SELECT id FROM questions WHERE question_code = 'DISC-I-003'), 'A', 'Fokus pada tujuan dan hasil', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-003'), 'B', 'Menciptakan hubungan yang hangat dan personal', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-003'), 'C', 'Memberikan dukungan dan bantuan konsisten', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-003'), 'D', 'Bekerja dengan teliti dan mengikuti prosedur', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-I-004
((SELECT id FROM questions WHERE question_code = 'DISC-I-004'), 'A', 'Menyampaikan dengan singkat dan meyakinkan', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-004'), 'B', 'Menarik perhatian dengan gaya yang menarik', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-004'), 'C', 'Menggunakan contoh konkret dan data', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-004'), 'D', 'Mendengarkan pertanyaan dan menjawab dengan sabar', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-I-005
((SELECT id FROM questions WHERE question_code = 'DISC-I-005'), 'A', 'Langsung mengambil inisiatif', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-005'), 'B', 'Berkenalan dan membangun koneksi dengan cepat', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-005'), 'C', 'Mengamati dan memahami situasi terlebih dahulu', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-005'), 'D', 'Mengumpulkan informasi dan menganalisis', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-I-006
((SELECT id FROM questions WHERE question_code = 'DISC-I-006'), 'A', 'Mencapai target dan hasil yang menantang', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-006'), 'B', 'Berinteraksi dengan orang lain dan berbagi ide', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-006'), 'C', 'Bekerja dalam tim yang harmonis', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-I-006'), 'D', 'Menyelesaikan tugas dengan presisi tinggi', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- S (Steadiness) Questions - Focus on stability, support, harmony
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(2, 'DISC-S-001', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Dalam menghadapi perubahan, saya:', NULL, 'S', 'single_choice', 13, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-S-002', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Ketika bekerja dalam tim, saya biasanya:', NULL, 'S', 'single_choice', 14, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-S-003', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Dalam memberikan umpan balik, saya:', NULL, 'S', 'single_choice', 15, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-S-004', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Saya lebih menghargai:', NULL, 'S', 'single_choice', 16, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-S-005', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Dalam menghadapi deadline, saya:', NULL, 'S', 'single_choice', 17, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-S-006', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam situasi kerja.', 'Yang paling memotivasi saya adalah:', NULL, 'S', 'single_choice', 18, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- S Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- DISC-S-001
((SELECT id FROM questions WHERE question_code = 'DISC-S-001'), 'A', 'Melihat sebagai peluang dan cepat beradaptasi', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-001'), 'B', 'Antusias dan mencari cara kreatif untuk beradaptasi', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-001'), 'C', 'Menganalisis detail dan mempersiapkan diri', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-001'), 'D', 'Membutuhkan waktu untuk beradaptasi dan mempertahankan stabilitas', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-S-002
((SELECT id FROM questions WHERE question_code = 'DISC-S-002'), 'A', 'Memimpin dan menentukan arah', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-002'), 'B', 'Mendorong dan memotivasi anggota', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-002'), 'C', 'Memberikan dukungan dan menjaga harmoni', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-002'), 'D', 'Memastikan kualitas dan akurasi', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-S-003
((SELECT id FROM questions WHERE question_code = 'DISC-S-003'), 'A', 'Langsung dan fokus pada solusi', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-003'), 'B', 'Positif dan membangun antusiasme', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-003'), 'C', 'Dengan data dan fakta yang jelas', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-003'), 'D', 'Dengan cara yang mendukung dan tidak menyakit', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-S-004
((SELECT id FROM questions WHERE question_code = 'DISC-S-004'), 'A', 'Hasil dan pencapaian', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-004'), 'B', 'Pengakuan dan apresiasi', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-004'), 'C', 'Kualitas dan akurasi', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-004'), 'D', 'Kestabilan dan hubungan yang baik', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-S-005
((SELECT id FROM questions WHERE question_code = 'DISC-S-005'), 'A', 'Mengerjakan dengan cepat dan fokus', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-005'), 'B', 'Menyelesaikan sambil tetap antusias', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-005'), 'C', 'Bekerja sesuai prosedur dengan teliti', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-005'), 'D', 'Bekerja dengan konsisten dan menghindari tekanan', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-S-006
((SELECT id FROM questions WHERE question_code = 'DISC-S-006'), 'A', 'Persaingan dan kemenangan', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-006'), 'B', 'Pengakuan sosial dan pujian', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-006'), 'C', 'Kesempatan untuk belajar dan berkembang', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-S-006'), 'D', 'Keamanan dan lingkungan yang stabil', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- C (Conscientiousness) Questions - Focus on accuracy, quality, analysis
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(2, 'DISC-C-001', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Ketika mengerjakan tugas, saya:', NULL, 'C', 'single_choice', 19, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-C-002', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Dalam mengambil keputusan, saya:', NULL, 'C', 'single_choice', 20, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-C-003', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Saya cenderung mengkhawatirkan:', NULL, 'C', 'single_choice', 21, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-C-004', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Ketika memeriksa pekerjaan, saya:', NULL, 'C', 'single_choice', 22, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-C-005', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Yang membuat saya frustrasi:', NULL, 'C', 'single_choice', 23, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'DISC-C-006', 'Pilih pernyataan yang paling menggambarkan diri Anda dalam pekerjaan.', 'Dalam situasi yang tidak pasti, saya:', NULL, 'C', 'single_choice', 24, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- C Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- DISC-C-001
((SELECT id FROM questions WHERE question_code = 'DISC-C-001'), 'A', 'Fokus pada hasil dan segera menyelesaikan', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-001'), 'B', 'Mengerjakan dengan antusias dan melibatkan orang lain', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-001'), 'C', 'Bekerja dengan teliti dan mengikuti prosedur', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-001'), 'D', 'Mengerjakan dengan hati-hati dan mendukung tim', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-C-002
((SELECT id FROM questions WHERE question_code = 'DISC-C-002'), 'A', 'Mengandalkan intuisi dan bertindak cepat', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-002'), 'B', 'Mengandalkan perasaan dan intuisi', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-002'), 'C', 'Meminta pendapat dan mencari harmoni', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-002'), 'D', 'Menganalisis data dan membuat keputusan logis', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-C-003
((SELECT id FROM questions WHERE question_code = 'DISC-C-003'), 'A', 'Tidak tercapainya target', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-003'), 'B', 'Tidak dihargai atau tidak diperhatikan', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-003'), 'C', 'Perubahan mendadak dan ketidakpastian', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-003'), 'D', 'Kesalahan dan ketidakakuratan', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-C-004
((SELECT id FROM questions WHERE question_code = 'DISC-C-004'), 'A', 'Memeriksa hasil akhir saja', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-004'), 'B', 'Memeriksa sambil diskusi dengan tim', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-004'), 'C', 'Memeriksa dengan detail dan teliti', 'C', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-004'), 'D', 'Memeriksa dan meminta bantuan jika perlu', 'S', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-C-005
((SELECT id FROM questions WHERE question_code = 'DISC-C-005'), 'A', 'Orang yang tidak langsung ke poin', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-005'), 'B', 'Kritik dan feedback negatif', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-005'), 'C', 'Konflik dan konfrontasi', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-005'), 'D', 'Ketidakjelasan dan kurangnya informasi', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DISC-C-006
((SELECT id FROM questions WHERE question_code = 'DISC-C-006'), 'A', 'Mengambil tindakan cepat', 'D', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-006'), 'B', 'Mencari sisi positif dan optimis', 'I', 1, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-006'), 'C', 'Menunggu dan melihat perkembangan', 'S', 1, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'DISC-C-006'), 'D', 'Mengumpulkan semua informasi yang relevan', 'C', 1, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);