import type { AdminLoginResponse } from '@/types/assessment';

const ADMIN_SESSION_KEY = 'psikotest:admin-session';

export interface StoredAdminSession extends AdminLoginResponse {}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

function getLegacyStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function loadAdminSession() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const activeValue = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (activeValue) {
    return JSON.parse(activeValue) as StoredAdminSession;
  }

  const legacyStorage = getLegacyStorage();
  const legacyValue = legacyStorage?.getItem(ADMIN_SESSION_KEY);
  if (!legacyValue) {
    return null;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, legacyValue);
  legacyStorage?.removeItem(ADMIN_SESSION_KEY);
  return JSON.parse(legacyValue) as StoredAdminSession;
}

export function saveAdminSession(session: AdminLoginResponse) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  getLegacyStorage()?.removeItem(ADMIN_SESSION_KEY);
}

export function updateStoredAdminProfile(admin: StoredAdminSession['admin']) {
  const current = loadAdminSession();
  const sessionStorage = getSessionStorage();

  if (!current || !sessionStorage) {
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ...current, admin }));
}

export function clearAdminSession() {
  getSessionStorage()?.removeItem(ADMIN_SESSION_KEY);
  getLegacyStorage()?.removeItem(ADMIN_SESSION_KEY);
}
