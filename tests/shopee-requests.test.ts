import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

// Guardrail: extra or faster Shopee requests got the owner's Shopee account banned (commits 5e554b4,
// 9d33f43, 498590e, since reverted). New figures must come from data the order-list API already returns.
const root = process.cwd();
const BAN_RISK = 'Adding Shopee requests risks an account ban; derive new stats from existing order data instead (see docs/shopee-order-api.md).';

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (/\.(ts|js)$/.test(path)) yield path;
  }
}

describe('Shopee request surface', () => {
  it('makes exactly one fetch, to the order-list endpoint, in the injected content script', () => {
    const code = readFileSync(resolve(root, 'src/content/content.js'), 'utf8');
    expect(code.match(/\bfetch\(/g), BAN_RISK).toHaveLength(1);
    expect(code.match(/\/api\/[\w/]+/g), BAN_RISK).toEqual(['/api/v4/order/get_all_order_and_checkout_list']);
  });

  it('makes no fetch anywhere else in src', () => {
    const offenders = [...sourceFiles(resolve(root, 'src'))]
      .filter(file => !file.endsWith('content.js'))
      .filter(file => /\bfetch\(/.test(readFileSync(file, 'utf8')));
    expect(offenders, BAN_RISK).toEqual([]);
  });

  it('keeps the manifest limited to Shopee hosts and the current permissions', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'src/manifest.json'), 'utf8'));
    expect(manifest.permissions, BAN_RISK).toEqual(['activeTab', 'storage', 'scripting']);
    expect(manifest.host_permissions.every((h: string) => /^https:\/\/shopee\.[a-z.]+\/\*$/.test(h)), BAN_RISK).toBe(true);
  });
});
