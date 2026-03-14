ALTER TABLE admins
  MODIFY COLUMN role ENUM('super_admin', 'admin', 'psychologist_reviewer') NOT NULL DEFAULT 'admin';
