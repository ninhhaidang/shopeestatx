import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockColorScheme } from './support/match-media';

// The pre-paint script is plain JS served as-is; run it the way the browser would.
const source = readFileSync(resolve(__dirname, '../src/public/theme-init.js'), 'utf-8');
const run = () => new Function(source)();

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('theme-init.js (applied before first paint)', () => {
  it('uses the system scheme when nothing is stored', () => {
    mockColorScheme('dark');
    run();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('a stored choice wins over the system scheme', () => {
    mockColorScheme('dark');
    localStorage.setItem('shopeestatx-color-mode', 'light');
    run();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('treats stored "auto" and garbage as Auto', () => {
    mockColorScheme('dark');
    localStorage.setItem('shopeestatx-color-mode', 'auto');
    run();
    expect(document.documentElement.dataset.theme).toBe('dark');
    localStorage.setItem('shopeestatx-color-mode', 'purple');
    run();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
