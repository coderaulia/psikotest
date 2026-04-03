CREATE TABLE IF NOT EXISTS manual_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  customer_id INTEGER,
  selected_plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  base_amount INTEGER NOT NULL,
  unique_code INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  instructions_text TEXT,
  proof_url TEXT,
  proof_filename TEXT,
  sender_name TEXT,
  sender_bank TEXT,
  transfer_note TEXT,
  transfer_at INTEGER,
  proof_submitted_at INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at INTEGER,
  verified_at INTEGER,
  verified_by_admin_id INTEGER,
  rejection_reason TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_manual_payments_workspace_id ON manual_payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_reference ON manual_payments(payment_reference);
