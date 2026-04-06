import { HttpError } from '../../lib/http-error.js';
import { fetchAdminProfile, fetchAuditLogFeed, fetchSessionDefaults, saveSessionDefaults, updateAdminProfileRecord, } from './settings.repository.js';
export async function getSettingsOverview(adminId) {
    const [profile, sessionDefaults, auditFeed] = await Promise.all([
        fetchAdminProfile(adminId),
        fetchSessionDefaults(),
        fetchAuditLogFeed(),
    ]);
    if (!profile) {
        throw new HttpError(404, 'Admin profile not found');
    }
    return {
        profile,
        sessionDefaults,
        auditFeed,
    };
}
export async function updateAdminProfile(adminId, input) {
    const profile = await updateAdminProfileRecord(adminId, input);
    if (!profile) {
        throw new HttpError(404, 'Admin profile not found');
    }
    return profile;
}
export async function updateSessionDefaults(input) {
    return saveSessionDefaults(input);
}
