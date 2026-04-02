-- Seed IQ Questions
-- NOTE: These are DEMONSTRATION QUESTIONS for platform testing only.
-- They are NOT validated psychometric instruments and should not be used for assessment.
-- Replace with professionally validated questions before production use.

-- Dimension: pattern = Pattern Recognition, numerical = Numerical Reasoning, verbal = Verbal Reasoning, spatial = Spatial Reasoning
-- Difficulty: 1 = Easy, 2 = Medium, 3 = Hard

-- Pattern Recognition Questions (10 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(1, 'IQ-PAT-001', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', 'Bayangan berikut mendapatkan promosi. Urutan gelar: Magang → Staf → Supervisor → ???. Apa gelar berikutnya?', NULL, 'pattern', 'single_choice', 1, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-002', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', '2, 6, 12, 20, 30, ???', NULL, 'pattern', 'single_choice', 2, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-003', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', 'A, C, F, J, O, ???', NULL, 'pattern', 'single_choice', 3, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-004', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', 'Jika A=1, B=2, maka CAT = 3+1+20=24. Berapa nilai DOG?', NULL, 'pattern', 'single_choice', 4, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-005', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', '1, 4, 9, 16, 25, ???', NULL, 'pattern', 'single_choice', 5, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-006', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', 'Senin, Rabu, Jumat, Minggu, ???', NULL, 'pattern', 'single_choice', 6, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-007', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', '2, 3, 5, 8, 12, 17, ???', NULL, 'pattern', 'single_choice', 7, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-008', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', 'Jika MEJA = 45, maka kurs = ???', NULL, 'pattern', 'single_choice', 8, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-009', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', '1, 1, 2, 3, 5, 8, 13, ???', NULL, 'pattern', 'single_choice', 9, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-PAT-010', 'Pilihlah pola yang tepat untuk melengkapi urutan berikut.', '3, 6, 11, 18, 27, ???', NULL, 'pattern', 'single_choice', 10, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Pattern Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- IQ-PAT-001
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-001'), 'A', 'Manager', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-001'), 'B', 'Director', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-001'), 'C', 'Asisten Manager', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-001'), 'D', 'Executive', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-002
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-002'), 'A', '40', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-002'), 'B', '42', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-002'), 'C', '44', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-002'), 'D', '38', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-003
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-003'), 'A', 'T', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-003'), 'B', 'U', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-003'), 'C', 'V', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-003'), 'D', 'W', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-004
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-004'), 'A', '23', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-004'), 'B', '22', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-004'), 'C', '26', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-004'), 'D', '24', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-005
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-005'), 'A', '30', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-005'), 'B', '36', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-005'), 'C', '42', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-005'), 'D', '49', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-006
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-006'), 'A', 'Senin', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-006'), 'B', 'Selasa', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-006'), 'C', 'Kamis', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-006'), 'D', 'Sabtu', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-007
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-007'), 'A', '22', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-007'), 'B', '23', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-007'), 'C', '24', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-007'), 'D', '25', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-008
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-008'), 'A', '52', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-008'), 'B', '50', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-008'), 'C', '48', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-008'), 'D', '55', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-009
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-009'), 'A', '18', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-009'), 'B', '19', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-009'), 'C', '20', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-009'), 'D', '21', NULL, NULL, 1, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-PAT-010
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-010'), 'A', '36', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-010'), 'B', '38', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-010'), 'C', '40', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-PAT-010'), 'D', '42', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Numerical Reasoning Questions (10 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(1, 'IQ-NUM-001', 'Pilih jawaban yang tepat.', 'Jika sebuah proyek membutuhkan 8 orang selama 15 hari untuk menyelesaikannya, berapa hari yang dibutuhkan jika hanya 6 orang yang tersedia?', NULL, 'numerical', 'single_choice', 11, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-002', 'Pilih jawaban yang tepat.', 'Sebuah toko menjual produk dengan diskon 20%. Jika harga asli Rp 250.000, berapa harga setelah diskon?', NULL, 'numerical', 'single_choice', 12, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-003', 'Pilih jawaban yang tepat.', 'Jika x + 2y = 10 dan x - y = 4, berapa nilai x?', NULL, 'numerical', 'single_choice', 13, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-004', 'Pilih jawaban yang tepat.', 'Sebuah kantor memiliki rasio karyawan laki-laki dan perempuan 3:2. Jika ada 30 karyawan laki-laki, berapa jumlah karyawan perempuan?', NULL, 'numerical', 'single_choice', 14, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-005', 'Pilih jawaban yang tepat.', 'Jika harga naik 25% menjadi Rp 125.000, berapa harga asli?', NULL, 'numerical', 'single_choice', 15, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-006', 'Pilih jawaban yang tepat.', 'Sebuah kolam diisi air dengan 2 keran. Keran A mengisi dalam 6 jam, keran B dalam 4 jam. Berapa lama jika diisi bersamaan?', NULL, 'numerical', 'single_choice', 16, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-007', 'Pilih jawaban yang tepat.', 'Jika a = 2b dan b = 3c, maka a = ? dalam c', NULL, 'numerical', 'single_choice', 17, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-008', 'Pilih jawaban yang tepat.', 'Sebuah mobil bergerak dengan kecepatan 60 km/jam. Berapa waktu yang dibutuhkan untuk menempuh 150 km?', NULL, 'numerical', 'single_choice', 18, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-009', 'Pilih jawaban yang tepat.', 'Dalam sebuah tim, rasio produktivitas adalah 4:5:6 untuk tiga karyawan. Jika total output 90 unit, berapa unit untuk karyawan kedua?', NULL, 'numerical', 'single_choice', 19, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-NUM-010', 'Pilih jawaban yang tepat.', 'Jika f(x) = 2x + 3, maka f(f(2)) = ?', NULL, 'numerical', 'single_choice', 20, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Numerical Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- IQ-NUM-001
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-001'), 'A', '18 hari', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-001'), 'B', '20 hari', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-001'), 'C', '22 hari', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-001'), 'D', '12 hari', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-002
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-002'), 'A', 'Rp 200.000', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-002'), 'B', 'Rp 210.000', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-002'), 'C', 'Rp 225.000', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-002'), 'D', 'Rp 230.000', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-003
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-003'), 'A', '4', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-003'), 'B', '5', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-003'), 'C', '6', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-003'), 'D', '8', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-004
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-004'), 'A', '15', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-004'), 'B', '18', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-004'), 'C', '20', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-004'), 'D', '25', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-005
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-005'), 'A', 'Rp 100.000', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-005'), 'B', 'Rp 105.000', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-005'), 'C', 'Rp 95.000', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-005'), 'D', 'Rp 110.000', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-006
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-006'), 'A', '2.4 jam', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-006'), 'B', '2.5 jam', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-006'), 'C', '3 jam', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-006'), 'D', '5 jam', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-007
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-007'), 'A', '3c', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-007'), 'B', '5c', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-007'), 'C', '6c', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-007'), 'D', '8c', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-008
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-008'), 'A', '2 jam', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-008'), 'B', '2.5 jam', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-008'), 'C', '3 jam', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-008'), 'D', '3.5 jam', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-009
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-009'), 'A', '24 unit', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-009'), 'B', '27 unit', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-009'), 'C', '30 unit', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-009'), 'D', '33 unit', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-NUM-010
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-010'), 'A', '9', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-010'), 'B', '10', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-010'), 'C', '11', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-NUM-010'), 'D', '13', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Verbal Reasoning Questions (10 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(1, 'IQ-VRB-001', 'Pilih sinonim yang tepat.', 'ERAT adalah lawan kata dari:', NULL, 'verbal', 'single_choice', 21, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-002', 'Pilih sinonim yang tepat.', 'MANDUL memiliki makna yang sama dengan:', NULL, 'verbal', 'single_choice', 22, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-003', 'Pilih kata yang melengkapi analogi.', 'BUKU : BACA :: PENCIPTA : ?', NULL, 'verbal', 'single_choice', 23, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-004', 'Pilih kata yang tidak cocok.', 'Manakah kata yang TIDAK cocok: Kucing, Anjing, Ayam, Ikan, Kelinci', NULL, 'verbal', 'single_choice', 24, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-005', 'Pilih sinonim yang tepat.', 'Sukarela memiliki makna yang sama dengan:', NULL, 'verbal', 'single_choice', 25, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-006', 'Pilih kata yang melengkapi analogi.', 'DOKTER : PASIEN :: GURU : ?', NULL, 'verbal', 'single_choice', 26, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-007', 'Pilih lawan kata yang tepat.', 'GAJAH adalah lawan kata dari:', NULL, 'verbal', 'single_choice', 27, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-008', 'Pilih kata yang melengkapi analogi.', 'HANGAT : DINGIN :: TERANG : ?', NULL, 'verbal', 'single_choice', 28, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-009', 'Pilih kata yang tidak cocok.', 'Manakah kata yang TIDAK cocok: Sepeda, Motor, Mobil, Kereta, Pesawat', NULL, 'verbal', 'single_choice', 29, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-VRB-010', 'Pilih sinonim yang tepat.', 'SEDERHANA memiliki makna yang sama dengan:', NULL, 'verbal', 'single_choice', 30, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Verbal Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- IQ-VRB-001
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-001'), 'A', 'Jauh', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-001'), 'B', 'Lemah', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-001'), 'C', 'Kecil', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-001'), 'D', 'Rendah', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-002
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-002'), 'A', 'Subur', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-002'), 'B', 'Tidak subur', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-002'), 'C', 'Kurang', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-002'), 'D', 'Sehat', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-003
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-003'), 'A', 'Baca', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-003'), 'B', 'Tulis', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-003'), 'C', 'Cipta', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-003'), 'D', 'Karya', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-004
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-004'), 'A', 'Kucing', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-004'), 'B', 'Anjing', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-004'), 'C', 'Ayam', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-004'), 'D', 'Kelinci', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-005
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-005'), 'A', 'Terpaksa', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-005'), 'B', 'Rela', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-005'), 'C', 'Iklas', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-005'), 'D', 'Paksa', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-006
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-006'), 'A', 'Murid', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-006'), 'B', 'Sekolah', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-006'), 'C', 'Kelas', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-006'), 'D', 'Belajar', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-007
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-007'), 'A', 'Semut', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-007'), 'B', 'Gajah Besar', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-007'), 'C', 'Kecil', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-007'), 'D', 'Besar', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-008
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-008'), 'A', 'Terang', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-008'), 'B', 'Gelap', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-008'), 'C', 'Cerah', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-008'), 'D', 'Redup', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-009
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-009'), 'A', 'Sepeda', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-009'), 'B', 'Motor', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-009'), 'C', 'Mobil', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-009'), 'D', 'Kereta', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-VRB-010
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-010'), 'A', 'Mewah', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-010'), 'B', 'Biasa', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-010'), 'C', 'Mahal', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-VRB-010'), 'D', 'Indah', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Spatial Reasoning Questions (7 questions)
INSERT INTO questions (test_type_id, question_code, instruction_text, prompt, question_group_key, dimension_key, question_type, question_order, is_required, status, created_at, updated_at)
VALUES 
(1, 'IQ-SPA-001', 'Pilih jawaban yang tepat.', 'Kubus yang diputar 90 derajat searah jarum jam akan menunjukkan sisi mana di posisi depan?', NULL, 'spatial', 'single_choice', 31, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-002', 'Pilih jawaban yang tepat.', 'Jika kertas dilipat dua kali dan dipotong di tengah, berapa lubang yang dihasilkan saat dibuka?', NULL, 'spatial', 'single_choice', 32, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-003', 'Pilih jawaban yang tepat.', 'Bayangan sebuah benda pada jam 2 siang akan jatuh ke arah mana?', NULL, 'spatial', 'single_choice', 33, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-004', 'Pilih jawaban yang tepat.', 'Kubus memiliki 6 sisi. Jika 3 sisi terlihat, berapa sisi yang tidak terlihat?', NULL, 'spatial', 'single_choice', 34, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-005', 'Pilih jawaban yang tepat.', 'Jika A berada di sebelah utara B, dan B berada di sebelah barat C, maka A berada di arah mana dari C?', NULL, 'spatial', 'single_choice', 35, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-006', 'Pilih jawaban yang tepat.', 'Piramida dengan alas segitiga memiliki berapa sisi?', NULL, 'spatial', 'single_choice', 36, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'IQ-SPA-007', 'Pilih jawaban yang tepat.', 'Jika Anda menghadap utara dan berputar 180 derajat, Anda akan menghadap ke arah mana?', NULL, 'spatial', 'single_choice', 37, 1, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Spatial Options
INSERT INTO question_options (question_id, option_key, option_text, dimension_key, value_number, is_correct, option_order, created_at, updated_at)
VALUES
-- IQ-SPA-001
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-001'), 'A', 'Sisi kanan semula', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-001'), 'B', 'Sisi kiri semula', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-001'), 'C', 'Sisi atas', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-001'), 'D', 'Sisi belakang', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-002
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-002'), 'A', '1 lubang', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-002'), 'B', '2 lubang', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-002'), 'C', '4 lubang', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-002'), 'D', '8 lubang', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-003
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-003'), 'A', 'Utara', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-003'), 'B', 'Selatan', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-003'), 'C', 'Timur utara', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-003'), 'D', 'Utara timur', NULL, NULL, 1, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-004
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-004'), 'A', '1 sisi', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-004'), 'B', '2 sisi', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-004'), 'C', '3 sisi', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-004'), 'D', '0 sisi', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-005
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-005'), 'A', 'Utara', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-005'), 'B', 'Timur laut', NULL, NULL, 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-005'), 'C', 'Barat laut', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-005'), 'D', 'Selatan', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-006
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-006'), 'A', '3 sisi', NULL, NULL, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-006'), 'B', '4 sisi', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-006'), 'C', '5 sisi', NULL, NULL, 0, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-006'), 'D', '6 sisi', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- IQ-SPA-007
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-007'), 'A', 'Timur', NULL, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-007'), 'B', 'Barat', NULL, NULL, 0, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-007'), 'C', 'Selatan', NULL, NULL, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
((SELECT id FROM questions WHERE question_code = 'IQ-SPA-007'), 'D', 'Utara', NULL, NULL, 0, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);