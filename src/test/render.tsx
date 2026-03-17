import type { ReactElement } from 'react';

import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { LanguageProvider } from '@/lib/language';

interface RenderRouteOptions {
  route?: string;
  path?: string;
  nextPath?: string;
  nextElement?: ReactElement;
  state?: Record<string, unknown>;
}

export function renderWithRoute(element: ReactElement, options: RenderRouteOptions = {}) {
  const {
    route = '/',
    path = '/',
    nextPath = '/next',
    nextElement = <div>Next route</div>,
    state,
  } = options;

  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[{ pathname: route, state }]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path={nextPath} element={nextElement} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}
