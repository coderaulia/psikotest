-- Migration 006: Add question_bank table for storing test questions
-- Run with: wrangler d1 execute psikotest-db --file=./migrations/006_add_question_bank.sql

CREATE TABLE IF NOT EXISTS question_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_type TEXT NOT NULL, -- iq, disc, workload, custom
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice', -- single_choice, multiple_choice, text, scale
  options_json TEXT, -- JSON array of option objects: [{"label": "...", "value": "...", "score": n}]
  category TEXT, -- e.g., "verbal", "numerical", "behavioral"
  subcategory TEXT, -- e.g., "vocabulary", "pattern_recognition"
  difficulty TEXT, -- easy, medium, hard
  time_estimate_seconds INTEGER, -- estimated time to answer
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, archived
  order_index INTEGER NOT NULL DEFAULT 0, -- ordering within test type
  metadata_json TEXT, -- additional metadata as JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_question_bank_test_type ON question_bank(test_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_status ON question_bank(status);
CREATE INDEX IF NOT EXISTS idx_question_bank_category ON question_bank(category);
CREATE INDEX IF NOT EXISTS idx_question_bank_order ON question_bank(test_type, order_index);

-- Sample IQ question
INSERT OR IGNORE INTO question_bank (test_type, question_text, question_type, options_json, category, difficulty, status, order_index) VALUES
  ('iq', 'What number comes next in the sequence: 2, 6, 12, 20, ?', 'single_choice', 
   '[{"label": "28", "value": 28, "score": 0}, {"label": "30", "value": 30, "score": 1}, {"label": "32", "value": 32, "score": 0}, {"label": "36", "value": 36, "score": 0}]',
   'numerical', 'medium', 'active', 1);

-- Sample DISC question
INSERT OR IGNORE INTO question_bank (test_type, question_text, question_type, options_json, category, difficulty, status, order_index) VALUES
  ('disc', 'In a team meeting, I typically:', 'single_choice',
   '[{"label": "Take charge and direct the discussion", "value": "D", "score": 1}, {"label": "Share ideas and energize the group", "value": "I", "score": 1}, {"label": "Listen and provide supportive feedback", "value": "S", "score": 1}, {"label": "Analyze facts and ask detailed questions", "value": "C", "score": 1}]',
   'behavioral', 'easy', 'active', 1);

-- Sample Workload question
INSERT OR IGNORE INTO question_bank (test_type, question_text, question_type, options_json, category, difficulty, status, order_index) VALUES
  ('workload', 'Over the past week, how often have you felt overwhelmed by your workload?', 'single_choice',
   '[{"label": "Never", "value": 1, "score": 1}, {"label": "Rarely", "value": 2, "score": 2}, {"label": "Sometimes", "value": 3, "score": 3}, {"label": "Often", "value": 4, "score": 4}, {"label": "Always", "value": 5, "score": 5}]',
   'stress_assessment', 'easy', 'active', 1);
