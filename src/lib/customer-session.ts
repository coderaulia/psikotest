import type { CustomerAuthResponse, CustomerUser } from '@/types/assessment';

const CUSTOMER_SESSION_KEY = 'psikotest:customer-session';

export interface StoredCustomerSession extends CustomerAuthResponse {}

export function loadCustomerSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  return raw ? (JSON.parse(raw) as StoredCustomerSession) : null;
}

export function saveCustomerSession(session: CustomerAuthResponse) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function updateStoredCustomerProfile(account: CustomerUser) {
  const current = loadCustomerSession();

  if (!current || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ ...current, account }));
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
