// The public policy (privacy.md → shopeestatx.ninhhaidang.com/privacy.html, the Store's privacy URL) must not drift from the in-extension page.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf-8');
const publicPolicy = read('privacy.md');
const appPolicy = read('src/privacy/Privacy.tsx');
const manifest = JSON.parse(read('src/manifest.json')) as { permissions: string[]; host_permissions: string[] };

describe('public privacy policy', () => {
  it('lists every permission the manifest requests', () => {
    for (const p of [...manifest.permissions, ...manifest.host_permissions]) expect(publicPolicy).toContain(`\`${p}\``);
  });

  it('carries the same last-updated date as the extension page', () => {
    const date = /Cập nhật lần cuối: (\d{2}\/\d{2}\/\d{4})/.exec(appPolicy)?.[1];
    expect(date).toBeDefined();
    expect(publicPolicy).toContain(`Cập nhật lần cuối: ${date}`);
  });
});
