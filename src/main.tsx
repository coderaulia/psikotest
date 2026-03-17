import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from './app/router';
import { clearChunkRecoveryFlagSoon, tryRecoverFromChunkError } from './lib/chunk-load-recovery';
import { LanguageProvider } from './lib/language';
import './styles/index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    tryRecoverFromChunkError();
  });

  clearChunkRecoveryFlagSoon();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </React.StrictMode>,
);
