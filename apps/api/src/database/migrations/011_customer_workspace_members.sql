CREATE TABLE IF NOT EXISTS customer_workspace_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_account_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  role ENUM('admin', 'operator', 'reviewer') NOT NULL DEFAULT 'operator',
  invitation_status ENUM('active', 'invited') NOT NULL DEFAULT 'invited',
  invited_at DATETIME NULL,
  last_notified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_workspace_members_email (customer_account_id, email),
  KEY idx_customer_workspace_members_status (customer_account_id, invitation_status),
  CONSTRAINT fk_customer_workspace_members_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
