// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { build } from 'esbuild';
import { categoryFetcherBuildOptions } from '../bridge-build';

// The real injected script, built exactly as the extension build does.
let script = '';
beforeAll(async () => {
  const { outputFiles } = await build({ ...categoryFetcherBuildOptions, write: false, outfile: 'category-fetcher.js' });
  script = outputFiles[0].text;
});

const livePage = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/shopee-item-categories.json'), 'utf8'));
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const withTree = (...names: string[]) => ({
  error: null, data: { item: { categories: names.map((display_name, i) => ({ catid: 10 + i, display_name })) } },
});
const busy = ok({ error: 90309999, error_msg: 'busy' });
type Outcome = ReturnType<typeof ok> | Error | { ok: boolean; status: number; json: () => Promise<unknown> };

// Scripted fetch outcomes in call order; anything past the script is an item with no category.
function setup(items: Array<{ itemId: number; shopId: number }>, script_: Outcome[] = [], inFlight = { peak: 0 }) {
  let running = 0;
  const fetch = vi.fn(async () => {
    running++; inFlight.peak = Math.max(inFlight.peak, running);
    await Promise.resolve();
    running--;
    const step = script_[fetch.mock.calls.length - 1];
    if (step instanceof Error) throw step;
    return step ?? ok({ error: null, data: { item: { categories: [] } } });
  });
  const waits: number[] = [];
  const context = createContext({
    fetch, setTimeout: (callback: () => void, ms: number) => { waits.push(ms); callback(); },
    window: { shopeeStatXCategoryRequest: { items } },
  });
  const run = () => runInContext(script, context) as Promise<{ categories: Record<string, { path: Array<{ catid: number; name: string }> }>; failed: string[] }>;
  return { fetch, waits, run, inFlight };
}
const item = (itemId: number, shopId = 7) => ({ itemId, shopId });

describe('category fetcher script', () => {
  it('returns the category path from root to leaf, with Shopee ids and Vietnamese names', async () => {
    const { run } = setup([item(111)], [ok(withTree('Điện Thoại & Phụ Kiện', 'Phụ kiện', 'Khác'))]);
    const result = await run();
    expect(result.failed).toEqual([]);
    expect(result.categories['111'].path).toEqual([
      { catid: 10, name: 'Điện Thoại & Phụ Kiện' }, { catid: 11, name: 'Phụ kiện' }, { catid: 12, name: 'Khác' },
    ]);
  });

  it('reads the real captured response shape', async () => {
    const { run } = setup([item(1)], [ok(livePage)]);
    const result = await run();
    expect(result.categories['1'].path).toHaveLength(3);
    expect(result.categories['1'].path[0]).toEqual({ catid: 100000, name: 'x' });
  });

  it('asks the page-relative product endpoint with the item and shop ids', async () => {
    const { run, fetch } = setup([item(111, 7)]);
    await run();
    const url = new URL(fetch.mock.calls[0][0] as string, 'https://shopee.vn');
    expect(url.pathname).toBe('/api/v4/pdp/get_pc');
    expect(url.searchParams.get('item_id')).toBe('111');
    expect(url.searchParams.get('shop_id')).toBe('7');
  });

  it('spaces requests by at least 400ms plus up to 200ms of jitter and waits before none but the first', async () => {
    const { run, waits } = setup([item(1), item(2), item(3)]);
    await run();
    expect(waits).toHaveLength(2);
    for (const wait of waits) { expect(wait).toBeGreaterThanOrEqual(400); expect(wait).toBeLessThanOrEqual(600); }
  });

  it('never has two requests in flight', async () => {
    const { run, inFlight } = setup([item(1), item(2), item(3), item(4)]);
    await run();
    expect(inFlight.peak).toBe(1);
  });

  it('retries 429, 5xx, network failures and Shopee error codes with 2s, 5s and 10s back-off', async () => {
    const { run, waits } = setup([item(1)], [
      { ok: false, status: 429, json: async () => ({}) },
      new Error('network down'),
      busy,
      ok(withTree('Sách')),
    ]);
    const result = await run();
    expect(result.categories['1'].path[0].name).toBe('Sách');
    expect(waits.filter(wait => wait >= 2000)).toEqual([2000, 5000, 10000]);
  });

  it('reports an item as failed after three retries, and carries on with the next item', async () => {
    const { run } = setup([item(1), item(2)], [busy, busy, busy, busy, ok(withTree('Sách'))]);
    const result = await run();
    expect(result.failed).toEqual(['1']);
    expect(result.categories['2'].path[0].name).toBe('Sách');
    expect(result.categories['1']).toBeUndefined();
  });

  it('does not retry an error retrying cannot fix', async () => {
    const { run, fetch } = setup([item(1)], [{ ok: false, status: 403, json: async () => ({}) }]);
    const result = await run();
    expect(result.failed).toEqual(['1']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('records "no category" for a product Shopee returns but has not categorised', async () => {
    const { run } = setup([item(1)], [ok({ error: null, data: { item: { categories: [] } } })]);
    const result = await run();
    expect(result.failed).toEqual([]);
    expect(result.categories['1'].path).toEqual([]);
  });

  it.each([
    ['no item', { error: null, data: { item: null } }],
    ['no data', { error: null, data: null }],
    ['an unrelated body', { hello: 'world' }],
  ])('treats a reply with %s as a failure to retry on the next run, not as "no category", and does not retry now', async (_name, body) => {
    const { run, fetch } = setup([item(1), item(2)], [ok(body), ok(withTree('Sách'))]);
    const result = await run();
    expect(result.failed).toEqual(['1']);
    expect(result.categories['1']).toBeUndefined();
    expect(result.categories['2'].path[0].name).toBe('Sách');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('treats a response that is not JSON as a retriable failure', async () => {
    const { run } = setup([item(1)], [
      { ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); } },
      ok(withTree('Sách')),
    ]);
    expect((await run()).categories['1'].path[0].name).toBe('Sách');
  });

  it('asks Shopee nothing for an empty request', async () => {
    const { run, fetch } = setup([]);
    expect(await run()).toEqual({ categories: {}, failed: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('can be injected again into the same page', async () => {
    const { run, fetch } = setup([item(1)], [ok(withTree('A')), ok(withTree('B'))]);
    expect((await run()).categories['1'].path[0].name).toBe('A');
    expect((await run()).categories['1'].path[0].name).toBe('B');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
