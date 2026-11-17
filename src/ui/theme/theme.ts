// Colour mode: light (the default) or dark, chosen by the user. There is no system-following mode.
// src/public/theme-init.js repeats readMode in plain JS so the theme is applied before first
// paint; keep the two in step (tests/theme-init.test.ts).

import { getStorageKey } from '../../config.js';

export type ColorMode = 'light' | 'dark';

const COLOR_MODE_KEY = getStorageKey('color-mode');

export function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark';
}

/** Anything stored other than 'dark' (nothing, garbage, the retired 'auto') is light. */
export function readMode(): ColorMode {
  try {
    return localStorage.getItem(COLOR_MODE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeMode(mode: ColorMode): void {
  try {
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    // Storage unavailable: the choice just won't persist.
  }
}

/** Tokens in styles/tokens.css switch on this attribute. */
export function applyTheme(mode: ColorMode): void {
  document.documentElement.dataset.theme = mode;
}
