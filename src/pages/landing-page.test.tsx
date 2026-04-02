import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { MarketingLayout } from '@/layouts/marketing-layout';
import { LanguageProvider } from '@/lib/language';
import { LandingPage } from '@/pages/public/landing-page';

function LocationProbe() {
  const location = useLocation();

  return <p data-testid="location">{location.pathname}</p>;
}

describe('LandingPage', () => {
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

    expect(screen.getByRole('heading', { name: /pick a test, enter your email in the flow, and start immediately/i })).toBeInTheDocument();

    const idButtons = screen.getAllByRole('button', { name: 'id' });
    await user.click(idButtons[0]!);

    expect(screen.getByRole('heading', { name: /pilih tes, isi email di alur yang ada, lalu mulai langsung/i })).toBeInTheDocument();
    expect(screen.getByText(/email dikumpulkan di langkah identitas participant/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tiga pintu masuk cepat untuk insight personal atau screening awal/i })).toBeInTheDocument();
  }, 15000);

  it('navigates to the DISC participant route from the test selection card', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/t/:token" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: /disc/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/t/disc-batch-a');
  });
});
