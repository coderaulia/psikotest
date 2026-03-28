CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  plan_code ENUM('starter', 'growth', 'research') NOT NULL DEFAULT 'starter',
  status ENUM('trial', 'active', 'past_due', 'suspended') NOT NULL DEFAULT 'trial',
  billing_cycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
  assessment_limit INT UNSIGNED NOT NULL,
  participant_limit INT UNSIGNED NOT NULL,
  team_member_limit INT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME NULL,
  renews_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_subscriptions_account (customer_account_id),
  CONSTRAINT fk_workspace_subscriptions_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
