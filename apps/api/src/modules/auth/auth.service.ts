import { createAdminSessionToken } from '../../lib/signed-token.js';
import { verifyPassword } from '../../lib/password.js';
import { findAdminByEmail, markAdminLogin } from './auth.repository.js';

export async function loginAdmin(email: string, password: string) {
  const admin = await findAdminByEmail(email);

  if (!admin || admin.status !== 'active') {
    return null;
  }

  const isValidPassword = await verifyPassword(password, admin.password_hash);

  if (!isValidPassword) {
    return null;
  }

  await markAdminLogin(admin.id);

  return {
    token: createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    }),
    admin: {
      id: admin.id,
      fullName: admin.full_name,
      email: admin.email,
      role: admin.role,
    },
  };
}
