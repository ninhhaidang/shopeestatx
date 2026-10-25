// Display style: a presentation axis (fintech | warm) independent of colour mode (ui/theme/theme.ts).
// No "auto" concept and no OS-level signal to resolve, so unlike theme there is no pre-paint
// mirror script — a one-frame flash while OverviewSkeleton shows is low-cost (ADR 0003).

import { getStorageKey } from '../../config.js';

export type DisplayStyle = 'fintech' | 'warm';

const DISPLAY_STYLE_KEY = getStorageKey('display-style');

export function isDisplayStyle(value: unknown): value is DisplayStyle {
  return value === 'fintech' || value === 'warm';
}

export function readStyle(): DisplayStyle {
  try {
    const stored = localStorage.getItem(DISPLAY_STYLE_KEY);
    return isDisplayStyle(stored) ? stored : 'fintech';
  } catch {
    return 'fintech';
  }
}

export function writeStyle(style: DisplayStyle): void {
  try {
    localStorage.setItem(DISPLAY_STYLE_KEY, style);
  } catch {
    // Storage unavailable: the choice just won't persist.
  }
}

/** Tokens in styles/tokens.css switch on this class. */
export function applyStyle(style: DisplayStyle): void {
  document.documentElement.classList.toggle('style-warm', style === 'warm');
}
