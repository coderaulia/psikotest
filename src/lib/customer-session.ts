import type { CustomerAuthResponse, CustomerUser } from '@/types/assessment';

const CUSTOMER_SESSION_KEY = 'psikotest:customer-session';

export interface StoredCustomerSession extends CustomerAuthResponse {}

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

export function loadCustomerSession() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return null;
  }

  const activeValue = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
  if (activeValue) {
    return JSON.parse(activeValue) as StoredCustomerSession;
  }

  const legacyStorage = getLegacyStorage();
  const legacyValue = legacyStorage?.getItem(CUSTOMER_SESSION_KEY);
  if (!legacyValue) {
    return null;
  }

  sessionStorage.setItem(CUSTOMER_SESSION_KEY, legacyValue);
  legacyStorage?.removeItem(CUSTOMER_SESSION_KEY);
  return JSON.parse(legacyValue) as StoredCustomerSession;
}

export function saveCustomerSession(session: CustomerAuthResponse) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  getLegacyStorage()?.removeItem(CUSTOMER_SESSION_KEY);
}

export function updateStoredCustomerProfile(account: CustomerUser) {
  const current = loadCustomerSession();
  const sessionStorage = getSessionStorage();

  if (!current || !sessionStorage) {
    return;
  }

  sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ ...current, account }));
}

export function clearCustomerSession() {
  getSessionStorage()?.removeItem(CUSTOMER_SESSION_KEY);
  getLegacyStorage()?.removeItem(CUSTOMER_SESSION_KEY);
}
