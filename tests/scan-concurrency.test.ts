import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chromeHost } from '../src/dashboard-app/chrome-host';
import { STORAGE_KEYS } from '../src/config';
import { makeData, makeOrder } from './support/orders';
import type { OrderData } from '../src/types';

const profile = (id: number) => ({ userId: id, username: `user-${id}`, avatar: '' });
const order = (id: string, amount = 100) => makeOrder('2026-10-01T12:00:00', { orderId: id, subTotal: amount });
interface Deferred<T> { promise: Promise<T>; resolve: (value: T) => void }
const deferred = <T,>(): Deferred<T> => Promise.withResolvers<T>();
type Sender = { tab?: { id?: number } };

function install(initial: OrderData) {
  const stored: Record<string, unknown> = { [STORAGE_KEYS.STATS]: initial, [STORAGE_KEYS.TAB_ID]: 123 };
  const scans = new Map<number, Deferred<unknown>>();
  const started = new Map<number, Deferred<void>>();
  const listeners = new Set<(message: unknown, sender: Sender) => void>();
  const tokens = new Map<number, string>();
  const locks = new Map<string, Promise<unknown>>();
  vi.stubGlobal('navigator', { locks: { request: (name: string, run: () => Promise<unknown>) => {
    const pending = (locks.get(name) ?? Promise.resolve()).then(run);
    locks.set(name, pending.catch(() => {}));
    return pending;
  } } });
  vi.stubGlobal('chrome', {
    storage: { local: {
      get: async () => structuredClone(stored),
      set: async (values: Record<string, unknown>) => { Object.assign(stored, structuredClone(values)); },
    } },
    runtime: { onMessage: {
      addListener: (listener: (message: unknown, sender: Sender) => void) => listeners.add(listener),
      removeListener: (listener: (message: unknown, sender: Sender) => void) => listeners.delete(listener),
    } },
    scripting: { executeScript: async ({ target, files, args }: { target: { tabId: number }; files?: string[]; args?: string[] }) => {
      if (args) tokens.set(target.tabId, args[0]);
      if (files?.[0] !== 'content.js') return [];
      const result = deferred<unknown>();
      scans.set(target.tabId, result);
      started.get(target.tabId)!.resolve();
      return result.promise;
    } },
  });
  return {
    async begin(tabId: number, mode: 'merge' | 'replace' = 'merge', onProgress = (_: number) => {}) {
      stored[STORAGE_KEYS.TAB_ID] = tabId;
      const ready = deferred<void>();
      started.set(tabId, ready);
      const result = chromeHost.refresh(onProgress, mode);
      await ready.promise;
      return { result, finish: (data: OrderData) => scans.get(tabId)!.resolve([{ result: { success: true, data } }]) };
    },
    async progress(tabId: number, count: number, token = tokens.get(tabId)) {
      for (const listener of listeners) await listener({ source: 'shopee-stats', type: 'progress', scanId: token, count }, { tab: { id: tabId } });
    },
    cached: () => stored[STORAGE_KEYS.STATS] as OrderData,
    listeners,
  };
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('concurrent dashboard scans', () => {
  it('keeps orders another dashboard committed during a slower refresh', async () => {
    const cache = install(makeData([order('C')], { user: profile(1) }));
    const first = await cache.begin(123);
    const slower = await cache.begin(124);
    first.finish(makeData([order('N'), order('C')], { user: profile(1) }));
    await first.result;
    slower.finish(makeData([order('C')], { user: profile(1) }));
    await slower.result;
    expect(cache.cached().orders.map(o => o.orderId).sort()).toEqual(['C', 'N']);
    expect(cache.cached().totalAmount).toBe(200);
  });

  it('does not regress updated orders when an older scan completes last', async () => {
    const cache = install(makeData([order('C')], { user: profile(1) }));
    const older = await cache.begin(123);
    const newer = await cache.begin(124);
    newer.finish(makeData([order('C', 500)], { user: profile(1) }));
    await newer.result;
    older.finish(makeData([order('C', 100), order('OLD', 30)], { user: profile(1) }));
    await older.result;
    expect(cache.cached().orders.map(o => [o.orderId, o.subTotal])).toEqual([['C', 500], ['OLD', 30]]);
  });

  it('rejects an older refresh after a replacement analysis changes accounts', async () => {
    const cache = install(makeData([order('A')], { user: profile(1) }));
    const older = await cache.begin(123);
    const replacement = await cache.begin(124, 'replace');
    replacement.finish(makeData([order('B')], { user: profile(2) }));
    await replacement.result;
    const rejected = expect(older.result).rejects.toThrow();
    older.finish(makeData([order('A')], { user: profile(1) }));
    await rejected;
    expect(cache.cached().user?.userId).toBe(2);
    expect(cache.cached().orders.map(o => o.orderId)).toEqual(['B']);
  });

  it('normalizes legacy numeric IDs and deduplicates authoritative fresh rows', async () => {
    const cache = install(makeData([order('123')], { user: profile(1) }));
    const scan = await cache.begin(123);
    const legacy = JSON.parse(JSON.stringify({ ...order('123'), orderId: 123 }));
    scan.finish(makeData([legacy, order('123', 250)], { user: profile(1) }));
    const result = await scan.result;
    expect(result.added).toBe(0);
    expect(result.data.orders.map(o => [o.orderId, o.subTotal])).toEqual([['123', 250]]);
    expect((await chromeHost.loadCached())?.totalAmount).toBe(250);
  });

  it('ignores unrelated and superseded progress without updating the active scan', async () => {
    const cache = install(makeData([order('A')], { user: profile(1) }));
    const progress = vi.fn();
    const older = await cache.begin(123, 'merge', progress);
    await cache.progress(999, 500);
    await cache.progress(123, 600, 'unrelated-scan');
    expect(progress).not.toHaveBeenCalled();
    await cache.progress(123, 2);
    expect(progress.mock.calls).toEqual([[2]]);
    const replacement = await cache.begin(124, 'replace');
    await cache.progress(123, 900);
    expect(progress.mock.calls).toEqual([[2]]);
    replacement.finish(makeData([order('B')], { user: profile(2) }));
    await replacement.result;
    const rejected = expect(older.result).rejects.toThrow();
    older.finish(makeData([order('A')], { user: profile(1) }));
    await rejected;
  });

  it('accepts a newer refresh of the same account after another scan discovers the account change', async () => {
    const cache = install(makeData([order('A')], { user: profile(1) }));
    const first = await cache.begin(123);
    const newer = await cache.begin(124);
    first.finish(makeData([order('B')], { user: profile(2) }));
    await first.result;
    newer.finish(makeData([order('B', 500), order('N')], { user: profile(2) }));
    await newer.result;
    expect(cache.cached().user?.userId).toBe(2);
    expect(cache.cached().orders.map(o => [o.orderId, o.subTotal])).toEqual([['B', 500], ['N', 100]]);
  });
});
