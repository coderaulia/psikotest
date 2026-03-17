ALTER TABLE customer_accounts
  ADD COLUMN IF NOT EXISTS settings_json JSON NULL AFTER organization_name;
