import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

// The pre-paint script is plain JS served as-is; run it the way the browser would.
const source = readFileSync(resolve(__dirname, '../src/public/theme-init.js'), 'utf-8');
const run = () => new Function(source)();

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('theme-init.js (applied before first paint)', () => {
  it('is light when nothing is stored', () => {
    run();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('applies a stored dark choice', () => {
    localStorage.setItem('shopeestatx-color-mode', 'dark');
    run();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('treats the retired "auto" and garbage as light', () => {
    localStorage.setItem('shopeestatx-color-mode', 'auto');
    run();
    expect(document.documentElement.dataset.theme).toBe('light');
    localStorage.setItem('shopeestatx-color-mode', 'purple');
    run();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
