-- Seed Workload Questions (NASA-TLX inspired)
-- NOTE: These are DEMONSTRATION QUESTIONS for platform testing only.
-- They are NOT validated psychometric instruments and should not be used for assessment.
-- Replace with professionally validated questions before production use.

-- NASA-TLX dimensions: mental_demand, physical_demand, temporal_demand, performance, effort, frustration
-- Likert scale: 1 (Very Low) to 7 (Very High)

-- Mental Demand Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-MD-001', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa besar usaha mental yang Anda perlukan untuk memahami tugas-tugas di pekerjaan?', NULL, 'mental_demand', 'likert', 1, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-MD-002', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Apakah tugas Anda memerlukan konsentrasi tinggi secara terus-menerus?', NULL, 'mental_demand', 'likert', 2, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-MD-003', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa sering Anda harus memikirkan beberapa hal sekaligus?', NULL, 'mental_demand', 'likert', 3, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-MD-004', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa kompleks dan menantang pekerjaan Anda secara kognitif?', NULL, 'mental_demand', 'likert', 4, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Mental Demand Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-MD-001
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '1', 'Sangat rendah - Sangat mudah dipahami', 'mental_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '2', 'Rendah - Mudah dipahami', 'mental_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '3', 'Cukup rendah', 'mental_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '4', 'Sedang - Butuh usaha sedang', 'mental_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '5', 'Cukup tinggi', 'mental_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '6', 'Tinggi - Butuh usaha signifikan', 'mental_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-001'), '7', 'Sangat tinggi - Sangat menantang', 'mental_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-MD-002
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '1', 'Tidak pernah - Tidak perlu konsentrasi', 'mental_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '2', 'Jarang - Sesekali perlu konsentrasi', 'mental_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '3', 'Kadang-kadang', 'mental_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '4', 'Sering - Perlu konsentrasi cukup', 'mental_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '5', 'Sering sekali', 'mental_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '6', 'Hampir selalu', 'mental_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-002'), '7', 'Selalu - Perlu konsentrasi penuh', 'mental_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-MD-003
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '1', 'Tidak pernah - Satu hal pada satu waktu', 'mental_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '2', 'Jarang sekali', 'mental_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '3', 'Kadang-kadang', 'mental_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '4', 'Sering', 'mental_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '5', 'Sering sekali - Banyak tugas paralel', 'mental_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '6', 'Hampir selalu', 'mental_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-003'), '7', 'Selalu - Multi-tasking terus menerus', 'mental_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-MD-004
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '1', 'Sangat sederhana - Tidak ada tantangan', 'mental_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '2', 'Sederhana', 'mental_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '3', 'Cukup sederhana', 'mental_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '4', 'Sedang kompleks', 'mental_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '5', 'Cukup kompleks', 'mental_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '6', 'Kompleks', 'mental_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-MD-004'), '7', 'Sangat kompleks - Sangat menantang', 'mental_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Physical Demand Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-PD-001', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa besar aktivitas fisik yang Anda lakukan dalam pekerjaan?', NULL, 'physical_demand', 'likert', 5, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PD-002', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Apakah pekerjaan Anda memerlukan tenaga fisik yang besar?', NULL, 'physical_demand', 'likert', 6, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PD-003', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa sering Anda merasa kelelahan fisik setelah bekerja?', NULL, 'physical_demand', 'likert', 7, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PD-004', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa intens aktivitas fisik yang Anda lakukan?', NULL, 'physical_demand', 'likert', 8, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Physical Demand Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-PD-001
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '1', 'Sangat rendah - Terutama duduk', 'physical_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '2', 'Rendah - Aktivitas minimal', 'physical_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '3', 'Cukup rendah', 'physical_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '4', 'Sedang - Campuran duduk dan berdiri', 'physical_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '5', 'Cukup tinggi', 'physical_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '6', 'Tinggi - Aktif sepanjang hari', 'physical_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-001'), '7', 'Sangat tinggi - Pekerjaan manual berat', 'physical_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PD-002
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '1', 'Tidak sama sekali', 'physical_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '2', 'Sedikit', 'physical_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '3', 'Cukup sedikit', 'physical_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '4', 'Sedang', 'physical_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '5', 'Cukup besar', 'physical_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '6', 'Besar', 'physical_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-002'), '7', 'Sangat besar', 'physical_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PD-003
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '1', 'Tidak pernah', 'physical_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '2', 'Jarang sekali', 'physical_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '3', 'Kadang-kadang', 'physical_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '4', 'Sering', 'physical_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '5', 'Sering sekali', 'physical_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '6', 'Hampir selalu', 'physical_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-003'), '7', 'Selalu', 'physical_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PD-004
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '1', 'Sangat ringan', 'physical_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '2', 'Ringan', 'physical_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '3', 'Cukup ringan', 'physical_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '4', 'Sedang', 'physical_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '5', 'Cukup berat', 'physical_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '6', 'Berat', 'physical_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PD-004'), '7', 'Sangat berat', 'physical_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Temporal Demand Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-TD-001', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa banyak waktu yang Anda miliki untuk menyelesaikan tugas?', NULL, 'temporal_demand', 'likert', 9, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-TD-002', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa sering Anda harus bekerja dengan buru-buru?', NULL, 'temporal_demand', 'likert', 10, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-TD-003', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Apakah Anda merasa waktu selalu mendesak?', NULL, 'temporal_demand', 'likert', 11, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-TD-004', 'Pilih jawaban yang paling sesuai dengan kondisi Anda saat bekerja.', 'Seberapa sering deadline tiba-tiba muncul atau berubah?', NULL, 'temporal_demand', 'likert', 12, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Temporal Demand Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-TD-001
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '1', 'Lebih dari cukup - Tidak ada tekanan waktu', 'temporal_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '2', 'Cukup banyak', 'temporal_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '3', 'Cukup', 'temporal_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '4', 'Sedang - Kadang terburu-buru', 'temporal_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '5', 'Cukup ketat', 'temporal_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '6', 'Ketat', 'temporal_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-001'), '7', 'Sangat ketat - Hampir tidak punya waktu', 'temporal_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-TD-002
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '1', 'Tidak pernah', 'temporal_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '2', 'Jarang sekali', 'temporal_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '3', 'Kadang-kadang', 'temporal_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '4', 'Sering', 'temporal_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '5', 'Sering sekali', 'temporal_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '6', 'Hampir selalu', 'temporal_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-002'), '7', 'Selalu', 'temporal_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-TD-003
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '1', 'Tidak sama sekali', 'temporal_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '2', 'Jarang', 'temporal_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '3', 'Kadang', 'temporal_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '4', 'Sering', 'temporal_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '5', 'Sering sekali', 'temporal_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '6', 'Hampir selalu', 'temporal_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-003'), '7', 'Selalu mendesak', 'temporal_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-TD-004
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '1', 'Tidak pernah', 'temporal_demand', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '2', 'Jarang sekali', 'temporal_demand', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '3', 'Kadang-kadang', 'temporal_demand', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '4', 'Sering', 'temporal_demand', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '5', 'Sering sekali', 'temporal_demand', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '6', 'Hampir selalu', 'temporal_demand', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-TD-004'), '7', 'Selalu - Deadline sering berubah', 'temporal_demand', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Performance Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-PF-001', 'Pilih jawaban yang paling sesuai dengan pencapaian Anda.', 'Seberapa puas Anda dengan performa kerja Anda saat ini?', NULL, 'performance', 'likert', 13, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PF-002', 'Pilih jawaban yang paling sesuai dengan pencapaian Anda.', 'Seberapa baik Anda mencapai target pekerjaan?', NULL, 'performance', 'likert', 14, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PF-003', 'Pilih jawaban yang paling sesuai dengan pencapaian Anda.', 'Seberapa sering Anda merasa puas dengan hasil kerja Anda?', NULL, 'performance', 'likert', 15, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-PF-004', 'Pilih jawaban yang paling sesuai dengan pencapaian Anda.', 'Seberapa sering Anda menyelesaikan tugas dengan kualitas yang memuaskan?', NULL, 'performance', 'likert', 16, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Performance Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-PF-001
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '1', 'Sangat tidak puas', 'performance', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '2', 'Tidak puas', 'performance', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '3', 'Cukup tidak puas', 'performance', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '4', 'Netral', 'performance', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '5', 'Cukup puas', 'performance', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '6', 'Puat', 'performance', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-001'), '7', 'Sangat puas', 'performance', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PF-002
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '1', 'Sangat buruk - Tidak mencapai target', 'performance', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '2', 'Buruk', 'performance', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '3', 'Cukup buruk', 'performance', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '4', 'Sedang - Mencapai sebagian target', 'performance', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '5', 'Cukup baik', 'performance', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '6', 'Baik', 'performance', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-002'), '7', 'Sangat baik - Melampaui target', 'performance', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PF-003
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '1', 'Tidak pernah puas', 'performance', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '2', 'Jarang puas', 'performance', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '3', 'Kadang puas', 'performance', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '4', 'Sering puas', 'performance', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '5', 'Sering sekali puas', 'performance', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '6', 'Hampir selalu puas', 'performance', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-003'), '7', 'Selalu puas', 'performance', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-PF-004
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '1', 'Tidak pernah', 'performance', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '2', 'Jarang sekali', 'performance', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '3', 'Kadang-kadang', 'performance', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '4', 'Sering', 'performance', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '5', 'Sering sekali', 'performance', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '6', 'Hampir selalu', 'performance', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-PF-004'), '7', 'Selalu', 'performance', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Effort Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-EF-001', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa besar usaha yang Anda keluarkan untuk mencapai target?', NULL, 'effort', 'likert', 17, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-EF-002', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa keras Anda harus bekerja untuk mencapai hasil?', NULL, 'effort', 'likert', 18, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-EF-003', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa banyak energi yang Anda habiskan dalam bekerja?', NULL, 'effort', 'likert', 19, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-EF-004', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa sulit bagi Anda untuk mempertahankan produktivitas?', NULL, 'effort', 'likert', 20, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Effort Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-EF-001
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '1', 'Sangat rendah - Hampir tidak ada usaha', 'effort', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '2', 'Rendah', 'effort', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '3', 'Cukup rendah', 'effort', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '4', 'Sedang', 'effort', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '5', 'Cukup tinggi', 'effort', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '6', 'Tinggi', 'effort', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-001'), '7', 'Sangat tinggi - Usaha maksimal', 'effort', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-EF-002
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '1', 'Sangat ringan', 'effort', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '2', 'Ringan', 'effort', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '3', 'Cukup ringan', 'effort', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '4', 'Sedang', 'effort', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '5', 'Cukup berat', 'effort', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '6', 'Berat', 'effort', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-002'), '7', 'Sangat berat', 'effort', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-EF-003
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '1', 'Sangat sedikit', 'effort', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '2', 'Sedikit', 'effort', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '3', 'Cukup sedikit', 'effort', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '4', 'Sedang', 'effort', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '5', 'Cukup banyak', 'effort', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '6', 'Banyak', 'effort', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-003'), '7', 'Sangat banyak', 'effort', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-EF-004
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '1', 'Sangat mudah - Tidak ada kesulitan', 'effort', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '2', 'Mudah', 'effort', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '3', 'Cukup mudah', 'effort', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '4', 'Sedang', 'effort', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '5', 'Cukup sulit', 'effort', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '6', 'Sulit', 'effort', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-EF-004'), '7', 'Sangat sulit - Butuh perjuangan', 'effort', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Frustration Questions (4 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(3, 'WL-FR-001', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa sering Anda merasa frustrasi dalam bekerja?', NULL, 'frustration', 'likert', 21, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-FR-002', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa sering Anda merasa pekerjaan menghambat pencapaian tujuan?', NULL, 'frustration', 'likert', 22, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-FR-003', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa sering Anda merasa stres dalam bekerja?', NULL, 'frustration', 'likert', 23, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'WL-FR-004', 'Pilih jawaban yang paling sesuai dengan kondisi Anda.', 'Seberapa sering Anda merasa terhalang oleh situasi di luar kendali?', NULL, 'frustration', 'likert', 24, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Frustration Options (Likert 1-7)
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- WL-FR-001
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '1', 'Tidak pernah', 'frustration', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '2', 'Jarang sekali', 'frustration', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '3', 'Kadang-kadang', 'frustration', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '4', 'Sering', 'frustration', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '5', 'Sering sekali', 'frustration', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '6', 'Hampir selalu', 'frustration', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-001'), '7', 'Selalu frustrasi', 'frustration', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-FR-002
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '1', 'Tidak pernah menghambat', 'frustration', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '2', 'Jarang menghambat', 'frustration', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '3', 'Kadang menghambat', 'frustration', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '4', 'Sering menghambat', 'frustration', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '5', 'Sering sekali menghambat', 'frustration', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '6', 'Hampir selalu menghambat', 'frustration', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-002'), '7', 'Selalu menghambat', 'frustration', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-FR-003
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '1', 'Tidak pernah stres', 'frustration', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '2', 'Jarang stres', 'frustration', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '3', 'Kadang stres', 'frustration', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '4', 'Sering stres', 'frustration', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '5', 'Sering sekali stres', 'frustration', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '6', 'Hampir selalu stres', 'frustration', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-003'), '7', 'Selalu dalam tekanan', 'frustration', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- WL-FR-004
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '1', 'Tidak pernah', 'frustration', 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '2', 'Jarang sekali', 'frustration', 2, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '3', 'Kadang-kadang', 'frustration', 3, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '4', 'Sering', 'frustration', 4, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '5', 'Sering sekali', 'frustration', 5, 0, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '6', 'Hampir selalu', 'frustration', 6, 0, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'WL-FR-004'), '7', 'Selalu terhalang', 'frustration', 7, 0, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);