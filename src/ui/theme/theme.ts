// Colour mode: the user's choice (light | dark | auto) and the theme actually shown (light | dark).
// `auto` follows prefers-color-scheme. src/public/theme-init.js repeats readMode/resolve in plain JS
// so the theme is applied before first paint; keep the two in step (tests/theme-init.test.ts).

import { getStorageKey } from '../../config.js';

export type ColorMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const COLOR_MODE_KEY = getStorageKey('color-mode');
export const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

export function readMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY);
    return isColorMode(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function writeMode(mode: ColorMode): void {
  try {
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    // Storage unavailable: the choice just won't persist.
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(mode: ColorMode): ResolvedTheme {
  return mode === 'auto' ? systemTheme() : mode;
}

/** Tokens in styles/tokens.css switch on this attribute. */
export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
}
