-- Migration 008: Rate limiting counters table
-- D1-backed rate limiting for auth and submission endpoints

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_counters (window_start);