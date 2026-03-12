import { clearCustomerSession, loadCustomerSession, updateStoredCustomerProfile } from '@/lib/customer-session';
import type { CustomerUser } from '@/types/assessment';

import { apiBaseUrl } from './api-client';

export class CustomerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CustomerApiError';
  }
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'Request failed';
}

export async function customerFetchJson<T>(path: string, init: RequestInit = {}) {
  const session = loadCustomerSession();

  if (!session?.token) {
    throw new CustomerApiError('Customer session not found', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.token}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      clearCustomerSession();
      if (typeof window !== 'undefined' && !['/login', '/signup'].includes(window.location.pathname)) {
        window.location.assign('/login');
      }
    }

    throw new CustomerApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function refreshCustomerProfile() {
  const payload = await customerFetchJson<{ account: CustomerUser }>('/site-auth/me');
  updateStoredCustomerProfile(payload.account);
  return payload.account;
}
