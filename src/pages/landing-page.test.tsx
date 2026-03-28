import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { MarketingLayout } from '@/layouts/marketing-layout';
import { LanguageProvider } from '@/lib/language';
import { LandingPage } from '@/pages/landing-page';

describe('LandingPage language toggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('switches the landing-page content from English to Bahasa Indonesia', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route index element={<LandingPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    expect(screen.getByRole('heading', { name: /build digital assessments with a calmer workflow/i })).toBeInTheDocument();

    const idButtons = screen.getAllByRole('button', { name: 'id' });
    await user.click(idButtons[0]!);

    expect(screen.getByRole('heading', { name: /bangun asesmen digital dengan alur kerja yang lebih tenang/i })).toBeInTheDocument();
    expect(screen.getByText(/platform asesmen psikologis/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /beragam alat asesmen dalam satu platform/i })).toBeInTheDocument();
  });
});

