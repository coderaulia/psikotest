const DEMO_ADMIN = {
  id: 1,
  fullName: 'Admin Psikotest',
  email: 'admin@psikotest.local',
  role: 'super_admin',
};

export function loginAdmin(email: string, password: string) {
  const isValid =
    email.toLowerCase() === DEMO_ADMIN.email && password === 'admin123';

  if (!isValid) {
    return null;
  }

  return {
    token: 'demo-admin-token',
    admin: DEMO_ADMIN,
  };
}
