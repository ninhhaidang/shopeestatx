import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(__dirname, '..', path), 'utf-8');

// Pages are built from src/, so a chrome.runtime.getURL('x/y.html') must exist at src/x/y.html.
function pagesOpenedBy(path: string): string[] {
  return [...read(path).matchAll(/getURL\('([^'?]+\.html)/g)].map(match => match[1]);
}

describe('extension entry points', () => {
  it.each(['src/background.ts', 'src/popup/chrome-host.ts'])('%s only opens pages that exist', file => {
    const pages = pagesOpenedBy(file);
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(existsSync(resolve(__dirname, '../src', page)), page).toBe(true);
  });

  it('opens the new dashboard from both the popup and the background worker', () => {
    expect(pagesOpenedBy('src/background.ts')).toContain('dashboard-app/dashboard.html');
    expect(read('src/popup/chrome-host.ts')).toContain('dashboard-app/dashboard.html?fetch=true');
  });

  it('builds only the new entries', () => {
    const config = read('vite.config.ts');
    expect(config).toContain('src/dashboard-app/dashboard.html');
    expect(config).not.toContain('dashboard/results');
  });
});
