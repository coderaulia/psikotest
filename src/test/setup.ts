import '@testing-library/jest-dom/vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  constructor(_: IntersectionObserverCallback, __?: IntersectionObserverInit) {}

  disconnect() {}

  observe() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

const localStorageMock = new MemoryStorage();
const sessionStorageMock = new MemoryStorage();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  configurable: true,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  configurable: true,
});
