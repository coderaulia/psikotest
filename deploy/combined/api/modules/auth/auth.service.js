import { env } from '../../config/env.js';
import { verifyPassword } from '../../lib/password.js';
import { createAdminSessionToken } from '../../lib/signed-token.js';
import { findAdminByEmail, markAdminLogin, revokeAdminSessions } from './auth.repository.js';
export async function loginAdmin(email, password) {
    const admin = await findAdminByEmail(email);
    if (!admin || admin.status !== 'active') {
        return null;
    }
    const isValidPassword = await verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
        return null;
    }
    try {
        await markAdminLogin(admin.id);
    }
    catch {
        if (env.NODE_ENV !== 'test') {
            console.warn('[auth] Failed to update admin login audit metadata');
        }
    }
    return {
        token: createAdminSessionToken({
            adminId: admin.id,
            email: admin.email,
            role: admin.role,
            sessionVersion: admin.session_version,
        }),
        admin: {
            id: admin.id,
            fullName: admin.full_name,
            email: admin.email,
            role: admin.role,
        },
    };
}
export async function logoutAdmin(adminId) {
    await revokeAdminSessions(adminId);
}
