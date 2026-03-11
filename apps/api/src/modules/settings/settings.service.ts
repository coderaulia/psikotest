import { HttpError } from '../../lib/http-error.js';
import {
  fetchAdminProfile,
  fetchAuditLogFeed,
  fetchSessionDefaults,
  saveSessionDefaults,
  updateAdminProfileRecord,
} from './settings.repository.js';

export async function getSettingsOverview(adminId: number) {
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

export async function updateAdminProfile(adminId: number, input: { fullName: string; email: string }) {
  const profile = await updateAdminProfileRecord(adminId, input);

  if (!profile) {
    throw new HttpError(404, 'Admin profile not found');
  }

  return profile;
}

export async function updateSessionDefaults(input: Parameters<typeof saveSessionDefaults>[0]) {
  return saveSessionDefaults(input);
}
