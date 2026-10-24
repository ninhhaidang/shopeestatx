import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(
  readFileSync(resolve(__dirname, '../src/manifest.json'), 'utf-8'),
) as { minimum_chrome_version?: string };

// Container queries 105, color-mix() 111, chrome.sidePanel.open() 116.
const REQUIRED_CHROME = 116;

describe('manifest minimum_chrome_version', () => {
  it('is new enough for container queries, color-mix and the side panel API', () => {
    const major = Number.parseInt(manifest.minimum_chrome_version ?? '0', 10);
    expect(major).toBeGreaterThanOrEqual(REQUIRED_CHROME);
  });
});
