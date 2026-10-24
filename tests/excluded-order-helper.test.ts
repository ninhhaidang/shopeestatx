import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { isExcludedOrder } from '../src/dashboard/order-status';

const root = process.cwd();

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

describe('isExcludedOrder', () => {
  it('is true for cancelled (4) and returned (12) orders only', () => {
    expect([0, 3, 4, 7, 8, 9, 12].map(statusCode => isExcludedOrder({ statusCode }))).toEqual(
      [false, false, true, false, false, false, true]);
  });
});

// content.js is injected as a classic script and cannot import, so it keeps its own copy.
describe('excluded-order rule lives in one place', () => {
  it('is not re-implemented with raw status codes elsewhere in src', () => {
    const offenders = [...sourceFiles(resolve(root, 'src'))]
      .filter(file => !file.endsWith('order-status.ts'))
      .filter(file => /statusCode\s*[!=]==\s*(4|12)\b/.test(readFileSync(file, 'utf8')));
    expect(offenders, 'Use isExcludedOrder from src/dashboard/order-status.ts').toEqual([]);
  });
});
