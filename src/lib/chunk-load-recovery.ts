const CHUNK_RELOAD_KEY = 'psikotest:chunk-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 15_000;
const CHUNK_RELOAD_CLEAR_MS = 5_000;

export function isChunkLoadError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return [
    'failed to fetch dynamically imported module',
    'importing a module script failed',
    'failed to fetch module script',
    'unable to preload css',
  ].some((fragment) => message.includes(fragment));
}

export function tryRecoverFromChunkError() {
  if (typeof window === 'undefined') {
    return false;
  }

  const now = Date.now();
  const previousAttempt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');

  if (Number.isFinite(previousAttempt) && previousAttempt > 0 && now - previousAttempt < CHUNK_RELOAD_COOLDOWN_MS) {
    return false;
  }

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  window.location.reload();
  return true;
}

export function clearChunkRecoveryFlagSoon() {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }, CHUNK_RELOAD_CLEAR_MS);
}
