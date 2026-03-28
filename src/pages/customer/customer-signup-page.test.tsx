import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { loadCustomerSession } from '@/lib/customer-session';
import { renderWithRoute } from '@/test/render';

import { CustomerSignupPage } from './customer-signup-page';

const signupCustomerMock = vi.fn();

vi.mock('@/services/customer-auth', () => ({
  signupCustomer: (...args: unknown[]) => signupCustomerMock(...args),
}));

describe('CustomerSignupPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    signupCustomerMock.mockReset();
  });

  it('stores the customer session and redirects to onboarding after signup', async () => {
    signupCustomerMock.mockResolvedValue({
      token: 'customer-token',
      account: {
        id: 22,
        fullName: 'Research Owner',
        email: 'owner@example.com',
        accountType: 'researcher',
        organizationName: 'Psych Lab',
      },
    });

    renderWithRoute(<CustomerSignupPage />, {
      route: '/signup',
      path: '/signup',
      nextPath: '/workspace/create',
      nextElement: <div>Workspace onboarding</div>,
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), 'Research Owner');
    await user.type(screen.getByLabelText(/^email$/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPassword123!');
    await user.selectOptions(screen.getByLabelText(/workspace type/i), 'researcher');
    await user.type(screen.getByLabelText(/organization name/i), 'Psych Lab');
    await user.click(screen.getByRole('button', { name: /create workspace/i }));

    await screen.findByText('Workspace onboarding');

    expect(signupCustomerMock).toHaveBeenCalledWith({
      fullName: 'Research Owner',
      email: 'owner@example.com',
      password: 'StrongPassword123!',
      accountType: 'researcher',
      organizationName: 'Psych Lab',
    });
    expect(loadCustomerSession()).toMatchObject({
      token: 'customer-token',
      account: {
        email: 'owner@example.com',
      },
    });
    expect(window.localStorage.getItem('psikotest:customer-session')).toBeNull();
    expect(window.sessionStorage.getItem('psikotest:customer-session')).not.toBeNull();
  }, 10000);
});
