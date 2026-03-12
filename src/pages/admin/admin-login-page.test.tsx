import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AdminLoginPage } from './admin-login-page';
import { loadAdminSession } from '@/lib/admin-session';
import { renderWithRoute } from '@/test/render';

const loginAdminMock = vi.fn();

vi.mock('@/services/admin-auth', () => ({
  loginAdmin: (...args: unknown[]) => loginAdminMock(...args),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loginAdminMock.mockReset();
  });

  it('stores the admin session and redirects after successful login', async () => {
    loginAdminMock.mockResolvedValue({
      token: 'admin-token',
      admin: {
        id: 1,
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'super_admin',
      },
    });

    renderWithRoute(<AdminLoginPage />, {
      route: '/admin/login',
      path: '/admin/login',
      nextPath: '/admin/results',
      nextElement: <div>Results workspace</div>,
      state: { redirectTo: '/admin/results' },
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.click(screen.getByRole('button', { name: /enter dashboard/i }));

    await screen.findByText('Results workspace');

    expect(loginAdminMock).toHaveBeenCalledWith('admin@example.com', 'StrongPassword123!');
    expect(loadAdminSession()).toMatchObject({
      token: 'admin-token',
      admin: {
        email: 'admin@example.com',
      },
    });
  });

  it('shows the API error when login fails', async () => {
    loginAdminMock.mockRejectedValue(new Error('Invalid email or password'));

    renderWithRoute(<AdminLoginPage />, {
      route: '/admin/login',
      path: '/admin/login',
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /enter dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
