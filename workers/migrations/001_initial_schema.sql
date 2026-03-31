-- D1 Database Schema for Psikotest
-- SQLite syntax for Cloudflare D1

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customer accounts
CREATE TABLE IF NOT EXISTS customer_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'business',
  organization_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test sessions
CREATE TABLE IF NOT EXISTS test_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  access_token TEXT UNIQUE,
  participant_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  starts_at DATETIME,
  ends_at DATETIME,
  time_limit_minutes INTEGER,
  settings_json TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Participants
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT,
  employee_code TEXT,
  department TEXT,
  position_title TEXT,
  latest_test_type TEXT,
  latest_status TEXT,
  total_submissions INTEGER DEFAULT 0,
  last_activity_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  participant_id INTEGER,
  token TEXT UNIQUE,
  access_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at DATETIME,
  submitted_at DATETIME,
  score_total INTEGER,
  score_band TEXT,
  profile_code TEXT,
  result_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Results
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER UNIQUE,
  participant_id INTEGER,
  session_id INTEGER,
  test_type TEXT,
  score_total INTEGER,
  score_band TEXT,
  profile_code TEXT,
  professional_summary TEXT,
  recommendation TEXT,
  limitations TEXT,
  review_status TEXT DEFAULT 'scored_preliminary',
  released_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON test_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_submissions_token ON submissions(token);
CREATE INDEX IF NOT EXISTS idx_submissions_access ON submissions(access_token);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

-- Insert default admin (CHANGE THIS PASSWORD!)
-- Password hash is for 'admin123' - replace with bcrypt hash
INSERT OR IGNORE INTO admins (id, full_name, email, password_hash, role, status) 
VALUES (1, 'Administrator', 'admin@vanaila.com', '$2b$10$YourHashedPasswordHere', 'super_admin', 'active');