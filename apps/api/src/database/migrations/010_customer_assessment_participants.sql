CREATE TABLE IF NOT EXISTS customer_assessment_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_assessment_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  employee_code VARCHAR(100) NULL,
  department VARCHAR(120) NULL,
  position_title VARCHAR(120) NULL,
  note VARCHAR(255) NULL,
  invitation_status ENUM('draft', 'invited') NOT NULL DEFAULT 'draft',
  invited_via ENUM('email', 'link') NULL,
  invited_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_assessment_participants_email (customer_assessment_id, email),
  KEY idx_customer_assessment_participants_status (customer_assessment_id, invitation_status),
  CONSTRAINT fk_customer_assessment_participants_assessment
    FOREIGN KEY (customer_assessment_id) REFERENCES customer_assessments (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
