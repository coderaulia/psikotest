import { env } from '../../config/env.js';
import { createAdminSessionToken } from '../../lib/signed-token.js';

const PLACEHOLDER_ADMIN_EMAIL = 'admin@example.com';
const PLACEHOLDER_ADMIN_PASSWORD = 'change-this-password';

function isAdminAuthConfigured() {
  return env.ADMIN_EMAIL !== PLACEHOLDER_ADMIN_EMAIL && env.ADMIN_PASSWORD !== PLACEHOLDER_ADMIN_PASSWORD;
}

export function loginAdmin(email: string, password: string) {
  if (!isAdminAuthConfigured()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = env.ADMIN_EMAIL.trim().toLowerCase();

  if (normalizedEmail !== expectedEmail || password !== env.ADMIN_PASSWORD) {
    return null;
  }

  const admin = {
    id: 1,
    fullName: 'Platform Administrator',
    email: env.ADMIN_EMAIL,
    role: 'super_admin' as const,
  };

  return {
    token: createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    }),
    admin,
  };
}
