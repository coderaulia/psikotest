ALTER TABLE workspace_subscriptions
  ADD COLUMN billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL DEFAULT 'dummy' AFTER billing_cycle,
  ADD COLUMN provider_customer_id VARCHAR(120) NULL AFTER billing_provider,
  ADD COLUMN provider_subscription_id VARCHAR(120) NULL AFTER provider_customer_id,
  ADD COLUMN provider_price_id VARCHAR(120) NULL AFTER provider_subscription_id,
  ADD COLUMN current_period_start DATETIME NULL AFTER renews_at,
  ADD COLUMN current_period_end DATETIME NULL AFTER current_period_start,
  ADD COLUMN cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0 AFTER current_period_end,
  ADD COLUMN canceled_at DATETIME NULL AFTER cancel_at_period_end,
  ADD COLUMN past_due_at DATETIME NULL AFTER canceled_at,
  ADD COLUMN suspended_at DATETIME NULL AFTER past_due_at,
  ADD COLUMN plan_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER suspended_at,
  ADD COLUMN billing_contact_email VARCHAR(190) NULL AFTER plan_version;

CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NOT NULL,
  session_key VARCHAR(120) NOT NULL,
  billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL DEFAULT 'dummy',
  plan_code ENUM('starter', 'growth', 'research') NOT NULL,
  billing_cycle ENUM('monthly', 'annual') NOT NULL,
  status ENUM('open', 'completed', 'expired', 'failed') NOT NULL DEFAULT 'open',
  checkout_url VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  completed_at DATETIME NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_checkout_sessions_key (session_key),
  KEY idx_billing_checkout_sessions_account (customer_account_id),
  KEY idx_billing_checkout_sessions_subscription (workspace_subscription_id),
  CONSTRAINT fk_billing_checkout_sessions_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_checkout_sessions_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NOT NULL,
  checkout_session_id BIGINT UNSIGNED NULL,
  external_invoice_id VARCHAR(120) NULL,
  invoice_number VARCHAR(120) NULL,
  status ENUM('draft', 'open', 'paid', 'void', 'uncollectible') NOT NULL DEFAULT 'draft',
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  amount_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  hosted_invoice_url VARCHAR(255) NULL,
  invoice_pdf_url VARCHAR(255) NULL,
  issued_at DATETIME NULL,
  due_at DATETIME NULL,
  paid_at DATETIME NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_billing_invoices_account (customer_account_id),
  KEY idx_billing_invoices_subscription (workspace_subscription_id),
  KEY idx_billing_invoices_checkout (checkout_session_id),
  CONSTRAINT fk_billing_invoices_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_invoices_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_billing_invoices_checkout
    FOREIGN KEY (checkout_session_id) REFERENCES billing_checkout_sessions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  billing_provider ENUM('dummy', 'manual', 'stripe') NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  external_event_id VARCHAR(160) NOT NULL,
  processing_status ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
  payload_json JSON NOT NULL,
  processed_at DATETIME NULL,
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_webhook_events_external (billing_provider, external_event_id),
  KEY idx_billing_webhook_events_status (processing_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_usage_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NULL,
  metric_key ENUM('assessment_created', 'participant_added', 'team_member_added', 'result_exported') NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  reference_type VARCHAR(80) NULL,
  reference_id BIGINT UNSIGNED NULL,
  metadata_json JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workspace_usage_events_account (customer_account_id, occurred_at),
  KEY idx_workspace_usage_events_subscription (workspace_subscription_id),
  CONSTRAINT fk_workspace_usage_events_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workspace_usage_events_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_usage_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  workspace_subscription_id BIGINT UNSIGNED NULL,
  period_start DATETIME NULL,
  period_end DATETIME NULL,
  assessment_count INT UNSIGNED NOT NULL DEFAULT 0,
  participant_count INT UNSIGNED NOT NULL DEFAULT 0,
  team_member_count INT UNSIGNED NOT NULL DEFAULT 0,
  export_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_usage_snapshots_period (customer_account_id, period_start, period_end),
  KEY idx_workspace_usage_snapshots_subscription (workspace_subscription_id),
  CONSTRAINT fk_workspace_usage_snapshots_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workspace_usage_snapshots_subscription
    FOREIGN KEY (workspace_subscription_id) REFERENCES workspace_subscriptions (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_plan_features (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_code ENUM('starter', 'growth', 'research') NOT NULL,
  feature_key VARCHAR(80) NOT NULL,
  feature_label VARCHAR(120) NOT NULL,
  feature_enabled TINYINT(1) NOT NULL DEFAULT 1,
  hard_limit_value INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_plan_features (plan_code, feature_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
