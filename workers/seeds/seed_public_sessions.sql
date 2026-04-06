INSERT OR IGNORE INTO test_sessions (
  title,
  access_token,
  test_type,
  status,
  time_limit_minutes
)
VALUES
('DISC Public Test', 'disc-public-001', 'disc', 'active', 15),
('IQ Public Test', 'iq-public-001', 'iq', 'active', 20),
('Workload Public Test', 'workload-public-001', 'workload', 'active', 10);
