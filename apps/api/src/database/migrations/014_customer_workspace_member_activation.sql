ALTER TABLE customer_workspace_members
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
  ADD COLUMN activation_token VARCHAR(120) NULL AFTER invitation_status,
  ADD COLUMN activation_expires_at DATETIME NULL AFTER activation_token,
  ADD COLUMN activated_at DATETIME NULL AFTER invited_at,
  ADD COLUMN last_login_at DATETIME NULL AFTER activated_at,
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER last_notified_at,
  ADD UNIQUE KEY uq_customer_workspace_members_activation_token (activation_token);
