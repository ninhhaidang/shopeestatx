import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, STORAGE_KEYS } from '../src/config';
import { state } from '../src/dashboard/state';
import { fetchOrders } from '../src/dashboard/fetch-orders';
import type { Order, OrderData } from '../src/types';

vi.mock('../src/dashboard/filters', () => ({ applyFilters: vi.fn() }));

const makeOrder = (orderId: string, statusCode: Order['statusCode'], subTotal = 100_000, productCount = 1): Order => ({
  orderId, name: `Product ${orderId}`, productCount, subTotal, subTotalFormatted: `${subTotal} ₫`,
  status: 'x', statusCode, shopName: 'Shop', productSummary: '', deliveryDate: null, orderMonth: null, orderYear: null,
});

const makeData = (orders: Order[], extra: Partial<OrderData> = {}): OrderData => ({
  orders, totalCount: 0, totalAmount: 0, totalAmountFormatted: '', fetchedAt: '2026-01-01T00:00:00.000Z', ...extra,
});

type ContentResult = { success: boolean; data?: OrderData; partial?: OrderData; error?: string } | undefined;
type Injection = { files?: string[]; func?: (...args: unknown[]) => void; args?: unknown[]; world?: string };

function installChrome(initial: Record<string, unknown>, content: () => Promise<ContentResult> | ContentResult) {
  const storage: Record<string, unknown> = { [STORAGE_KEYS.TAB_ID]: 42, ...initial };
  const injections: Injection[] = [];
  const progressListeners: Array<(message: unknown) => void> = [];
  vi.stubGlobal('chrome', {
    storage: { local: {
      get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.map(key => [key, storage[key]]))),
      set: vi.fn(async (values: Record<string, unknown>) => { Object.assign(storage, values); }),
    } },
    scripting: { executeScript: vi.fn(async (injection: Injection) => {
      injections.push(injection);
      return injection.files?.[0] === 'content.js' ? [{ result: await content() }] : [{}];
    }) },
    runtime: { onMessage: {
      addListener: vi.fn((listener: (message: unknown) => void) => { progressListeners.push(listener); }),
      removeListener: vi.fn((listener: (message: unknown) => void) => {
        progressListeners.splice(progressListeners.indexOf(listener), 1);
      }),
    } },
  });
  return { storage, injections, progressListeners };
}

const saved = (storage: Record<string, unknown>) => storage[STORAGE_KEYS.STATS] as OrderData;
const orderIds = (data: OrderData) => data.orders.map(order => order.orderId);
const requestOf = (injections: Injection[]) => injections.find(injection => injection.func)!.args![0] as Record<string, unknown>;
const text = (id: string) => document.getElementById(id)!.textContent;

beforeEach(() => {
  document.body.innerHTML = `
    <div id="loading"><p id="loadingText"></p><p id="loadingHint">Lần đầu có thể mất 1–2 phút.</p></div>
    <div id="noData" class="hidden"><p></p></div>
    <div id="content" class="hidden"></div><span id="fetchedAt"></span><span id="lastUpdated"></span>
    <select id="filterYear"><option value=""></option></select>
    <button id="btnRefresh"></button><button id="btnFullReload"></button>
  `;
  state.allOrdersData = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('unified order fetch', () => {
  it('does a full fetch when nothing is cached and saves the result with the current schema version', async () => {
    const fresh = makeData([makeOrder('A', 3, 100_000, 2), makeOrder('B', 4, 0, 1)]);
    const { storage, injections } = installChrome({}, () => ({ success: true, data: fresh }));

    await fetchOrders('auto');

    expect(requestOf(injections)).toEqual({ mode: 'full' });
    expect(saved(storage)).toMatchObject({ schemaVersion: SCHEMA_VERSION, totalCount: 3, totalAmount: 100_000 });
    expect(orderIds(saved(storage))).toEqual(['A', 'B']);
    expect(saved(storage).cachedAt).toBeTruthy();
    expect(state.allOrdersData).toEqual(saved(storage));
    expect(document.getElementById('loading')!.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('content')!.classList.contains('hidden')).toBe(false);
  });

  it('injects the bridge, then sets the request in the page, then runs the content script', async () => {
    const { injections } = installChrome({}, () => ({ success: true, data: makeData([]) }));

    await fetchOrders('auto');

    expect(injections.map(i => i.files?.[0] ?? 'set-request')).toEqual(['bridge.js', 'set-request', 'content.js']);
    expect(injections.map(i => i.world)).toEqual(['ISOLATED', 'MAIN', 'MAIN']);
    // The injected function really hands the request to the page for content.js to read.
    const setRequest = injections[1];
    setRequest.func!(...setRequest.args!);
    expect((window as unknown as { shopeeStatXRequest: unknown }).shopeeStatXRequest).toEqual({ mode: 'full' });
  });

  it('runs incrementally on a current cache, sending known orders and merging the fresh ones in', async () => {
    const cached = makeData([makeOrder('A', 3, 100_000), makeOrder('B', 8, 50_000)], { schemaVersion: SCHEMA_VERSION });
    const fresh = makeData([makeOrder('NEW', 3, 30_000), makeOrder('B', 3, 50_000)]);
    const { storage, injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: fresh }));

    await fetchOrders('auto');

    expect(requestOf(injections)).toEqual({
      mode: 'incremental',
      knownOrders: [{ orderId: 'A', statusCode: 3 }, { orderId: 'B', statusCode: 8 }],
    });
    const result = saved(storage);
    expect(orderIds(result)).toEqual(['NEW', 'B', 'A']);
    expect(result.orders.find(o => o.orderId === 'B')!.statusCode).toBe(3);
    expect(result).toMatchObject({ totalAmount: 180_000, totalCount: 3, schemaVersion: SCHEMA_VERSION });
    expect(document.querySelector('.toast')!.textContent).toContain('Đã thêm 1 đơn hàng mới');
  });

  it('keeps cancelled and returned orders out of the merged total', async () => {
    const cached = makeData([makeOrder('A', 3, 100_000)], { schemaVersion: SCHEMA_VERSION });
    const fresh = makeData([makeOrder('C', 4, 0), makeOrder('R', 12, 0)]);
    const { storage } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: fresh }));

    await fetchOrders('auto');

    expect(saved(storage)).toMatchObject({ totalAmount: 100_000, totalCount: 3 });
  });

  it('does a full fetch on request even when the cache is current', async () => {
    const cached = makeData([makeOrder('A', 3)], { schemaVersion: SCHEMA_VERSION });
    const { injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: makeData([makeOrder('A', 3)]) }));

    await fetchOrders('full');

    expect(requestOf(injections)).toEqual({ mode: 'full' });
  });

  it('upgrades a refresh to a full fetch when the cache predates the current schema, so old orders gain the new fields', async () => {
    const cached = makeData([makeOrder('A', 3)], { schemaVersion: SCHEMA_VERSION - 1 });
    const { injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: makeData([makeOrder('A', 3)]) }));

    await fetchOrders('incremental');

    expect(requestOf(injections)).toEqual({ mode: 'full' });
  });

  it('does a full fetch when the cache is current but holds no orders, since there is nothing to stop at', async () => {
    const cached = makeData([], { schemaVersion: SCHEMA_VERSION });
    const { injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: makeData([]) }));

    await fetchOrders('auto');

    expect(requestOf(injections)).toEqual({ mode: 'full' });
  });

  it('runs incrementally on request when the refresh button is used', async () => {
    const cached = makeData([makeOrder('A', 3)], { schemaVersion: SCHEMA_VERSION });
    const { injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: true, data: makeData([]) }));

    await fetchOrders('incremental');

    expect(requestOf(injections)).toMatchObject({ mode: 'incremental' });
  });
});

describe('unified order fetch: stale caches and failures', () => {
  it('rebuilds a cache written by an older version with one full fetch and explains why', async () => {
    const cached = makeData([makeOrder('A', 3)], { schemaVersion: SCHEMA_VERSION - 1 });
    let hintWhileFetching = '';
    const { storage, injections } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => {
      hintWhileFetching = text('loadingHint')!;
      return { success: true, data: makeData([makeOrder('A', 3)]) };
    });

    await fetchOrders('auto');

    expect(requestOf(injections)).toEqual({ mode: 'full' });
    expect(hintWhileFetching).toContain('Cập nhật dữ liệu để có thêm thông tin mới');
    expect(saved(storage).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('treats a cache with no schema version as stale', async () => {
    const { injections } = installChrome({ [STORAGE_KEYS.STATS]: makeData([makeOrder('A', 3)]) }, () => ({ success: true, data: makeData([]) }));
    await fetchOrders('auto');
    expect(requestOf(injections)).toEqual({ mode: 'full' });
  });

  it('keeps the existing cache and keeps showing it when a fetch fails with nothing to salvage', async () => {
    const cached = makeData([makeOrder('A', 3)], { schemaVersion: SCHEMA_VERSION });
    const { storage } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: false, error: 'busy' }));

    await fetchOrders('full');

    expect(saved(storage)).toBe(cached);
    expect(document.getElementById('content')!.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('loading')!.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('.toast')!.textContent).toContain('busy');
  });

  it('saves the orders that did arrive, reports how many, and leaves the cache marked stale so the next load retries', async () => {
    const cached = makeData([makeOrder('OLD', 3)], { schemaVersion: SCHEMA_VERSION - 1 });
    const partial = makeData([makeOrder('N1', 3), makeOrder('N2', 3)]);
    const { storage } = installChrome({ [STORAGE_KEYS.STATS]: cached }, () => ({ success: false, error: 'busy', partial }));

    await fetchOrders('auto');

    expect(orderIds(saved(storage))).toEqual(['N1', 'N2', 'OLD']);
    expect(saved(storage).schemaVersion).toBe(SCHEMA_VERSION - 1);
    expect(state.allOrdersData).toEqual(saved(storage));
    const toast = document.querySelector('.toast')!.textContent!;
    expect(toast).toContain('busy');
    expect(toast).toContain('Đã lưu 2 đơn hàng');
  });

  it('shows the error on the empty state when the very first fetch fails with nothing', async () => {
    const { storage } = installChrome({}, () => ({ success: false, error: 'busy' }));

    await fetchOrders('auto');

    expect(storage[STORAGE_KEYS.STATS]).toBeUndefined();
    expect(document.getElementById('noData')!.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('#noData p')!.textContent).toBe('busy');
  });

  it('reports a missing result and a missing Shopee tab', async () => {
    installChrome({}, () => undefined);
    await fetchOrders('auto');
    expect(document.querySelector('#noData p')!.textContent).toBe('Không nhận được dữ liệu từ Shopee');

    installChrome({ [STORAGE_KEYS.TAB_ID]: undefined }, () => undefined);
    await fetchOrders('auto');
    expect(document.querySelector('#noData p')!.textContent).toBe('Không tìm thấy tab Shopee');
  });
});

describe('unified order fetch: progress and re-entry', () => {
  const progress = (count: number, source = 'shopee-stats') => ({ source, type: 'progress', count });
  const pendingContent = () => {
    let release!: (result: ContentResult) => void;
    const promise = new Promise<ContentResult>(resolve => { release = resolve; });
    return { promise, release };
  };

  it('shows how many orders have been fetched, ignores messages from other sources, and stops listening afterwards', async () => {
    vi.useFakeTimers();
    const pending = pendingContent();
    const { progressListeners } = installChrome({}, () => pending.promise);

    const run = fetchOrders('auto');
    await vi.advanceTimersByTimeAsync(0);
    expect(text('loadingText')).toBe('Đang kết nối với Shopee...');

    progressListeners.forEach(listener => listener(progress(240)));
    expect(text('loadingText')).toBe('Đã tải 240 đơn hàng...');
    progressListeners.forEach(listener => listener(progress(999, 'someone-else')));
    expect(text('loadingText')).toBe('Đã tải 240 đơn hàng...');

    pending.release({ success: true, data: makeData([]) });
    await run;
    expect(progressListeners).toHaveLength(0);
  });

  it('warns after 30 seconds without progress, clears the warning on progress, and leaves no timer behind', async () => {
    vi.useFakeTimers();
    const pending = pendingContent();
    const { progressListeners } = installChrome({}, () => pending.promise);

    const run = fetchOrders('auto');
    await vi.advanceTimersByTimeAsync(29_000);
    expect(text('loadingHint')).toBe('Lần đầu có thể mất 1–2 phút.');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(text('loadingHint')).toContain('Vẫn đang chờ Shopee phản hồi');

    progressListeners.forEach(listener => listener(progress(20)));
    expect(text('loadingHint')).toBe('Lần đầu có thể mất 1–2 phút.');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(text('loadingHint')).toContain('Vẫn đang chờ Shopee phản hồi');

    pending.release({ success: true, data: makeData([]) });
    await run;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('disables both reload buttons while fetching and enables them afterwards', async () => {
    const pending = pendingContent();
    installChrome({}, () => pending.promise);
    const refresh = document.getElementById('btnRefresh') as HTMLButtonElement;
    const full = document.getElementById('btnFullReload') as HTMLButtonElement;

    const run = fetchOrders('auto');
    await Promise.resolve(); await Promise.resolve();
    expect(refresh.disabled && full.disabled).toBe(true);

    pending.release({ success: true, data: makeData([]) });
    await run;
    expect(refresh.disabled || full.disabled).toBe(false);
  });

  it('ignores a second request while one is running, so Shopee is never hit twice at once', async () => {
    const pending = pendingContent();
    const { injections } = installChrome({}, () => pending.promise);

    const first = fetchOrders('auto');
    const second = fetchOrders('full');
    await second;
    pending.release({ success: true, data: makeData([]) });
    await first;

    expect(injections.filter(i => i.files?.[0] === 'content.js')).toHaveLength(1);
  });

  it('can fetch again once the previous run has finished', async () => {
    const { injections } = installChrome({}, () => ({ success: true, data: makeData([]) }));
    await fetchOrders('auto');
    await fetchOrders('auto');
    expect(injections.filter(i => i.files?.[0] === 'content.js')).toHaveLength(2);
  });
});
