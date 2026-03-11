import type { AdminLoginResponse } from '@/types/assessment';

const ADMIN_SESSION_KEY = 'psikotest:admin-session';

export interface StoredAdminSession extends AdminLoginResponse {}

export function loadAdminSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  return raw ? (JSON.parse(raw) as StoredAdminSession) : null;
}

export function saveAdminSession(session: AdminLoginResponse) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function updateStoredAdminProfile(admin: StoredAdminSession['admin']) {
  const current = loadAdminSession();

  if (!current || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ...current, admin }));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

