import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

class MediaQueryListMock implements MediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => void) | null = null;
  private listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(query: string, matches = false) {
    this.media = query;
    this.matches = matches;
  }

  addEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'change', listener: (event: MediaQueryListEvent) => void) {
    this.listeners.delete(listener);
  }

  addListener(listener: (event: MediaQueryListEvent) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void) {
    this.listeners.delete(listener);
  }

  dispatchEvent(event: Event) {
    this.listeners.forEach((listener) => listener(event as MediaQueryListEvent));
    return true;
  }
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  configurable: true,
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => new MediaQueryListMock(query),
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.platformSource;
  cleanup();
});
