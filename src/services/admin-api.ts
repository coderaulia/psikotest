import { clearAdminSession, loadAdminSession } from '@/lib/admin-session';
import { apiBaseUrl } from './api-client';

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'Request failed';
}

export async function adminFetchJson<T>(path: string, init: RequestInit = {}) {
  const session = loadAdminSession();

  if (!session?.token) {
    throw new AdminApiError('Admin session not found', 401);
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
      clearAdminSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }

    throw new AdminApiError(message, response.status);
  }

  return (await response.json()) as T;
}
