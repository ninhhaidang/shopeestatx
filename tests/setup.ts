// Test setup — jsdom localStorage mock, jest-dom matchers, RTL cleanup
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// jsdom omits the cross-context browser lock API used by extension pages.
const lockQueues = new Map<string, Promise<unknown>>();
Object.defineProperty(navigator, 'locks', {
  configurable: true,
  value: {
    request(name: string, run: () => Promise<unknown>) {
      const next = (lockQueues.get(name) ?? Promise.resolve()).then(run);
      lockQueues.set(name, next.catch(() => {}));
      return next;
    },
  },
});
