import type { CustomerAuthResponse } from '@/types/assessment';

import { apiBaseUrl } from './api-client';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Request failed');
  }

  return (await response.json()) as T;
}

export async function signupCustomer(input: {
  fullName: string;
  email: string;
  password: string;
  accountType: 'business' | 'researcher';
  organizationName: string;
}) {
  const response = await fetch(`${apiBaseUrl}/site-auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJson<CustomerAuthResponse>(response);
}

export async function loginCustomer(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/site-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return readJson<CustomerAuthResponse>(response);
}
