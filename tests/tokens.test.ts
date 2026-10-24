import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../src/ui/styles/tokens.css'), 'utf-8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { light: block(':root'), dark: block("[data-theme='dark']") };

// [foreground token, background token, minimum ratio]. 4.5 for text, 3 for UI and focus indicators.
const PAIRS: Array<[string, string, number]> = [
  ['fg', 'bg', 4.5],
  ['fg', 'card', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'card', 4.5],
  ['accent-strong', 'bg', 4.5],
  ['accent-strong', 'card', 4.5],
  ['accent-hover', 'card', 4.5],
  ['on-accent', 'accent-strong', 4.5],
  ['on-accent', 'accent-hover', 4.5],
  ['warn-fg', 'warn-bg', 4.5],
  ['good', 'card', 4.5],
  ['bad', 'card', 4.5],
  ['accent', 'card', 3],
  ['focus', 'bg', 3],
  ['focus', 'card', 3],
];

describe('design tokens', () => {
  it('define the same token names for Light and Dark', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
    expect(Object.keys(themes.light).length).toBeGreaterThan(10);
  });

  for (const [name, tokens] of Object.entries(themes)) {
    describe(name, () => {
      it.each(PAIRS)('%s on %s is at least %s:1', (fg, bg, min) => {
        expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
      });
    });
  }
});
