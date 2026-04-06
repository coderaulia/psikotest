import { clearAdminSession, loadAdminSession } from '@/lib/admin-session';
import { apiBaseUrl } from './api-client';

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function readErrorPayload(response: Response) {
  return (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
}

export async function adminFetch(path: string, init: RequestInit = {}) {
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
    const payload = await readErrorPayload(response);
    const message = payload?.error ?? payload?.message ?? 'Request failed';

    if (response.status === 401) {
      clearAdminSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }

    throw new AdminApiError(message, response.status, payload);
  }

  return response;
}

export async function adminFetchJson<T>(path: string, init: RequestInit = {}) {
  const response = await adminFetch(path, init);
  return (await response.json()) as T;
}

export async function logoutAdminSession() {
  try {
    await adminFetch('/auth/logout', {
      method: 'POST',
    });
  } finally {
    clearAdminSession();
  }
}
