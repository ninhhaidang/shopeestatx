import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import { describe, it, expect, vi } from 'vitest';

const contentScript = readFileSync(resolve(process.cwd(), 'src/content/content.js'), 'utf8');

function makeOrder(label: string | null = 'label_completed') {
  return {
    order_list_detail: {
      info_card: {
        order_id: 'ORDER-1',
        product_count: 2,
        subtotal: 10000000000,
        final_total: 20000000000,
        order_list_cards: [{
          shop_info: { username: 'seller', shop_name: 'Shop' },
          parcel_cards: [{ product_info: { item_groups: [{ items: [{ name: 'Product A', amount: 2, item_price: 5000000000 }] }] } }],
        }],
      },
      status: { list_view_status_label: { text: label }, update_time: 1705320000 },
    },
  };
}

const finalPageResponse = { ok: true, status: 200, json: async () => ({ error: 0, error_msg: 'success', new_data: { next_offset: -1 } }) };

// Past the last page Shopee answers with the final page, so exhausted fixtures do the same.
async function collect(pages: unknown[], httpStatus = 200, request?: unknown) {
  const fetch = vi.fn().mockResolvedValue(finalPageResponse);
  for (const page of pages) {
    fetch.mockResolvedValueOnce({ ok: httpStatus < 400, status: httpStatus, json: async () => page });
  }
  const postMessage = vi.fn();
  // Waits resolve immediately and are recorded, so pacing and back-off are observable without real time.
  const waits: number[] = [];
  const setTimeout = (callback: () => void, ms: number) => { waits.push(ms); callback(); };
  const result = await runInNewContext(contentScript, {
    fetch,
    setTimeout,
    window: { postMessage, shopeeStatXRequest: request },
    localStorage: { getItem: () => null },
    console: { error: vi.fn() },
  });
  return { result, fetch, postMessage, waits };
}

// Incremental mode with nothing cached fetches strictly one page at a time, so call order is deterministic.
const sequential = { mode: 'incremental', knownOrders: [] };

// Scripted fetch outcomes in call order; an Error is a network failure. Anything beyond the script is the final page.
async function collectWithResponses(script: Array<Error | Record<string, unknown>>, request: unknown = sequential) {
  const fetch = vi.fn().mockResolvedValue(finalPageResponse);
  for (const step of script) {
    if (step instanceof Error) fetch.mockRejectedValueOnce(step);
    else fetch.mockResolvedValueOnce(step);
  }
  const waits: number[] = [];
  const result = await runInNewContext(contentScript, {
    fetch,
    setTimeout: (callback: () => void, ms: number) => { waits.push(ms); callback(); },
    window: { postMessage: vi.fn(), shopeeStatXRequest: request },
    localStorage: { getItem: () => null },
    console: { error: vi.fn() },
  });
  return { result, fetch, waits };
}

const offsets = (fetch: { mock: { calls: unknown[][] } }) =>
  fetch.mock.calls.map(([url]) => Number(new URL(url as string).searchParams.get('offset')));

// executeScript injects content.js as a classic script into the tab's shared global,
// so a second injection (retry/refresh without reloading the tab) re-runs in the same scope.
describe('content script re-injection into the same page', () => {
  it('returns data on a second run in the same global, not undefined', async () => {
    const page = { new_data: { order_or_checkout_data: [makeOrder()] } };
    const fetch = vi.fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ new_data: { next_offset: -1 } }) });
    const globalScope = createContext({
      fetch, setTimeout: (callback: () => void) => callback(), window: { postMessage: vi.fn() }, localStorage: { getItem: () => null }, console: { error: vi.fn() },
    });
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page });
    const first = await runInContext(contentScript, globalScope);
    expect(first.success).toBe(true);

    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page });
    const second = await runInContext(contentScript, globalScope);
    expect(second?.success).toBe(true);
  });
});

// Captured from the live endpoint, then scrubbed (strings -> "x", ids/amounts -> 100000),
// so the parser is exercised against the real response shape, not a hand-built one.
const livePage = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/shopee-order-page.json'), 'utf8'));
const liveFinalPage = { error: 0, error_msg: 'success', new_data: { next_offset: -1, translation_status: 0 } };

describe('content script against live response shapes', () => {
  it('parses a real order page followed by the real final page', async () => {
    const { result } = await collect([livePage, liveFinalPage]);
    expect(result.success).toBe(true);
    expect(result.data.orders).toHaveLength(1);
    expect(result.data.orders[0]).toMatchObject({ statusCode: 3, productCount: 1, subTotal: 1 });
  });
});

const pageOf = (...items: unknown[]) => ({ error: 0, new_data: { order_or_checkout_data: items, next_offset: 20 } });
const orderWithId = (id: string) => { const o = makeOrder(); o.order_list_detail.info_card.order_id = id; return o; };

describe('content script request pacing and retries', () => {
  it('spaces successive page requests by at least 400ms plus up to 200ms of jitter', async () => {
    const { waits } = await collect([pageOf(orderWithId('A')), pageOf(orderWithId('B')), end]);
    expect(waits.length).toBeGreaterThanOrEqual(2);
    for (const wait of waits) {
      expect(wait).toBeGreaterThanOrEqual(400);
      expect(wait).toBeLessThanOrEqual(600);
    }
  });

  it('retries a 429 with 2s back-off and then succeeds', async () => {
    const { result, fetch, waits } = await collectWithResponses([
      { ok: false, status: 429, json: async () => ({}) },
      { ok: true, status: 200, json: async () => pageOf(makeOrder()) },
    ]);
    expect(result.success).toBe(true);
    expect(result.data.orders).toHaveLength(1);
    expect(waits).toContain(2000);
    expect(offsets(fetch).slice(0, 2)).toEqual([0, 0]);
  });

  it('retries a Shopee error code, then network failures, with 2s, 5s and 10s back-off before giving up', async () => {
    const { result, waits } = await collectWithResponses([
      { ok: true, status: 200, json: async () => ({ error: 90309999, error_msg: 'busy' }) },
      new Error('network down'),
      { ok: true, status: 200, json: async () => ({ error: 90309999, error_msg: 'busy' }) },
      { ok: true, status: 200, json: async () => ({ error: 90309999, error_msg: 'busy' }) },
    ]);
    expect(result).toEqual({ success: false, error: 'busy' });
    expect(waits.filter(wait => wait >= 2000)).toEqual([2000, 5000, 10000]);
  });

  it('does not retry a 403, which retrying cannot fix', async () => {
    const { result, fetch } = await collectWithResponses([
      { ok: false, status: 403, json: async () => ({}) },
    ]);
    expect(result).toEqual({ success: false, error: 'Failed to fetch orders (HTTP 403)' });
    expect(offsets(fetch).filter(offset => offset === 0)).toHaveLength(1);
  });

  it('hands back the orders fetched so far when a later page keeps failing', async () => {
    const busy = { ok: true, status: 200, json: async () => ({ error: 90309999, error_msg: 'busy' }) };
    const { result } = await collectWithResponses([
      { ok: true, status: 200, json: async () => pageOf(orderWithId('A')) },
      busy, busy, busy, busy,
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toBe('busy');
    expect(result.partial.orders.map((o: { orderId: string }) => o.orderId)).toEqual(['A']);
  });
});

const orderWith = (id: string, label = 'label_completed') => {
  const o = makeOrder(label); o.order_list_detail.info_card.order_id = id; return o;
};
const incremental = (...known: Array<[string, number]>) => ({
  mode: 'incremental', knownOrders: known.map(([orderId, statusCode]) => ({ orderId, statusCode })),
});

describe('content script incremental mode', () => {
  it('stops after the first page when every order on it is already known and in a final state', async () => {
    const { result, fetch } = await collect(
      [pageOf(orderWith('A'), orderWith('B')), pageOf(orderWith('C'))],
      200, incremental(['A', 3], ['B', 4]),
    );
    expect(offsets(fetch)).toEqual([0]);
    expect(result.data.orders.map((o: { orderId: string }) => o.orderId)).toEqual(['A', 'B']);
  });

  it('keeps going while a page holds a new order, then stops at the first fully settled page', async () => {
    const { result, fetch } = await collect(
      [pageOf(orderWith('NEW')), pageOf(orderWith('A')), pageOf(orderWith('C'))],
      200, incremental(['A', 3]),
    );
    expect(offsets(fetch)).toEqual([0, 20]);
    expect(result.data.orders.map((o: { orderId: string }) => o.orderId)).toEqual(['NEW', 'A']);
  });

  it.each([[7], [8], [9], [0]])('refetches past a known order whose cached status %i is not final', async code => {
    const { result, fetch } = await collect(
      [pageOf(orderWith('A', 'label_completed')), pageOf(orderWith('B')), pageOf(orderWith('C'))],
      200, incremental(['A', code], ['B', 3]),
    );
    expect(offsets(fetch)).toEqual([0, 20]);
    expect(result.data.orders[0]).toMatchObject({ orderId: 'A', statusCode: 3 });
  });

  it('reads to the end when no page is fully settled', async () => {
    const { result, fetch } = await collect([pageOf(orderWith('NEW1')), pageOf(orderWith('NEW2'))], 200, incremental());
    expect(offsets(fetch)).toEqual([0, 20, 40]);
    expect(result.data.orders).toHaveLength(2);
  });

  it('fetches strictly one page at a time', async () => {
    let inFlight = 0; let peak = 0;
    const fetch = vi.fn(async () => {
      inFlight++; peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
      return { ok: true, status: 200, json: async () => pageOf(orderWith('N' + fetch.mock.calls.length)) };
    });
    let calls = 0;
    const wrapped = vi.fn(async (url: string) => (++calls > 4 ? finalPageResponse : fetch()));
    await runInNewContext(contentScript, {
      fetch: wrapped, setTimeout: (cb: () => void) => cb(),
      window: { postMessage: vi.fn(), shopeeStatXRequest: incremental() },
      localStorage: { getItem: () => null }, console: { error: vi.fn() },
    });
    expect(peak).toBe(1);
  });
});

// A fake Shopee keyed by offset. `latency` maps an offset to how many microtask ticks its response takes,
// so pages can finish out of order, and concurrency is measured as the peak of overlapping requests.
async function collectByOffset(
  pagesByOffset: Record<number, unknown>,
  { latency = {} as Record<number, number>, failing = new Set<number>(), request }: { latency?: Record<number, number>; failing?: Set<number>; request?: unknown } = {},
) {
  let inFlight = 0; let peak = 0;
  const requested: number[] = [];
  const fetch = vi.fn(async (url: string) => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    requested.push(offset);
    inFlight++; peak = Math.max(peak, inFlight);
    for (let tick = 0; tick < (latency[offset] ?? 5); tick++) await Promise.resolve();
    inFlight--;
    if (failing.has(offset)) return { ok: true, status: 200, json: async () => ({ error: 90309999, error_msg: 'busy' }) };
    const page = pagesByOffset[offset];
    return page ? { ok: true, status: 200, json: async () => page } : finalPageResponse;
  });
  const postMessage = vi.fn();
  const result = await runInNewContext(contentScript, {
    fetch, setTimeout: (callback: () => void) => callback(),
    window: { postMessage, shopeeStatXRequest: request },
    localStorage: { getItem: () => null }, console: { error: vi.fn() },
  });
  return { result, requested, peak: () => peak, postMessage };
}
const ids = (data: { orders: Array<{ orderId: string }> }) => data.orders.map(o => o.orderId);

describe('content script full mode', () => {
  const history = { 0: pageOf(orderWith('A')), 20: pageOf(orderWith('B')), 40: pageOf(orderWith('C')), 60: pageOf(orderWith('D')) };

  it('overlaps requests but never runs more than three at once', async () => {
    const { result, peak } = await collectByOffset(history);
    expect(result.success).toBe(true);
    expect(peak()).toBeGreaterThan(1);
    expect(peak()).toBeLessThanOrEqual(3);
  });

  it('returns every order exactly once, newest first, even when later pages finish before earlier ones', async () => {
    const { result } = await collectByOffset(history, { latency: { 0: 40, 20: 20, 40: 1, 60: 1 } });
    expect(ids(result.data)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('reads at most two pages past the end of the history', async () => {
    const { result, requested } = await collectByOffset({ 0: pageOf(orderWith('A')) });
    expect(ids(result.data)).toEqual(['A']);
    expect(Math.max(...requested)).toBeLessThanOrEqual(20 + 2 * 20);
  });

  it('reports a growing total as pages arrive', async () => {
    const { postMessage } = await collectByOffset(history);
    const counts = postMessage.mock.calls.map(([message]) => message.count);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts[counts.length - 1]).toBe(4);
  });

  it('stops claiming new pages once one fails for good, and hands back what arrived', async () => {
    const longHistory = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i * 20, pageOf(orderWith('O' + i))]));
    const { result, requested } = await collectByOffset(longHistory, { failing: new Set([20]) });
    expect(result.success).toBe(false);
    expect(result.error).toBe('busy');
    expect(ids(result.partial)).toContain('O0');
    expect(Math.max(...requested)).toBeLessThan(30 * 20);
  });

  it('is not used in incremental mode', async () => {
    const { peak } = await collectByOffset(history, { request: incremental() });
    expect(peak()).toBe(1);
  });
});

describe('content script extra order fields', () => {
  it('keeps variation, per-item price and quantity, product and shop ids, and parcel count', async () => {
    const order = orderWith('A');
    const card = order.order_list_detail.info_card.order_list_cards[0] as any;
    card.shop_info.shop_id = 777;
    Object.assign(card.parcel_cards[0].product_info.item_groups[0].items[0], { item_id: 555, model_name: 'Red, XL' });
    (order.order_list_detail as any).shipping = { num_parcels: 2, tracking_info: { ctime: 1705320000 } };
    const { result } = await collect([pageOf(order), end]);
    expect(result.data.orders[0]).toMatchObject({
      shopId: 777,
      parcelCount: 2,
      items: [{ itemId: 555, name: 'Product A', variation: 'Red, XL', quantity: 2, unitPrice: 50000 }],
    });
    expect(result.data.orders[0].productSummary).toContain('Product A');
  });

  it('includes every item of a split shipment, in order', async () => {
    const order = orderWith('A');
    order.order_list_detail.info_card.order_list_cards[0].parcel_cards.push({
      product_info: { item_groups: [{ items: [{ name: 'Product B', amount: 1, item_price: 1000000000 }] }] },
    } as any);
    const { result } = await collect([pageOf(order), end]);
    expect(result.data.orders[0].items.map((i: { name: string }) => i.name)).toEqual(['Product A', 'Product B']);
  });

  it('falls back to safe defaults when Shopee omits them (legacy payloads)', async () => {
    const detail = makeOrder().order_list_detail;
    const card = detail.info_card.order_list_cards[0];
    const legacy = {
      list_type: 3,
      info_card: { ...detail.info_card, order_list_cards: [{ product_info: card.parcel_cards[0].product_info }] },
    };
    const { result } = await collect([{ data: { order_data: { details_list: [legacy] } } }, end]);
    expect(result.data.orders[0]).toMatchObject({ shopId: null, parcelCount: null });
    expect(result.data.orders[0].items[0]).toMatchObject({ itemId: null, variation: '' });
  });

  it('carries the new fields in the real captured response', async () => {
    const { result } = await collect([livePage, liveFinalPage]);
    expect(result.data.orders[0]).toMatchObject({ shopId: 100000, parcelCount: 1 });
    expect(result.data.orders[0].items[0]).toMatchObject({ itemId: 100000, variation: 'x', quantity: 1, unitPrice: 1 });
  });
});

const end = { new_data: { order_or_checkout_data: [] } };

describe('content script order collection', () => {
  it.each([
    ['label_completed', 3, 'Hoàn thành'],
    ['LABEL_COMPLETED', 3, 'Hoàn thành'],
    ['label_cancelled', 4, 'Đã hủy'],
    ['cancel', 4, 'Đã hủy'],
    ['label_to_ship', 7, 'Chờ vận chuyển'],
    ['preparing', 7, 'Chờ vận chuyển'],
    ['label_to_receive', 8, 'Đang giao'],
    ['shipping', 8, 'Đang giao'],
    ['unpaid', 9, 'Chờ thanh toán'],
    ['label_return_refund_requested', 12, 'Trả hàng'],
    ['refund', 12, 'Trả hàng'],
    ['some_random_label', 0, 'Không rõ'],
    [null, 0, 'Không rõ'],
    ['', 0, 'Không rõ'],
  ])('normalizes API status %j through the production script', async (label, code, text) => {
    const { result } = await collect([{ new_data: { order_or_checkout_data: [makeOrder(label as string | null)] } }, end]);
    expect(result.success).toBe(true);
    expect(result.data.orders[0]).toMatchObject({ statusCode: code, status: text });
    expect(result.data.totalAmount).toBe(code === 4 || code === 12 ? 0 : 100000);
  });

  it('collects all pages and reports progress before returning totals', async () => {
    const first = makeOrder();
    const second = makeOrder();
    second.order_list_detail.info_card.order_id = 'ORDER-2';
    const { result, fetch, postMessage } = await collect([
      { new_data: { order_or_checkout_data: [first] } },
      { new_data: { order_or_checkout_data: [second] } },
      end,
    ]);
    expect(result.data.orders.map((order: { orderId: string }) => order.orderId)).toEqual(['ORDER-1', 'ORDER-2']);
    expect(result.data).toMatchObject({ totalCount: 4, totalAmount: 200000 });
    // Three workers may claim up to two pages beyond the page that reports the end.
    const requested = offsets(fetch);
    expect(requested.slice(0, 3)).toEqual([0, 20, 40]);
    expect(Math.max(...requested)).toBeLessThanOrEqual(40 + 2 * 20);
    expect(postMessage).toHaveBeenCalledWith({ source: 'shopee-stats', type: 'progress', count: 2 }, '*');
  });

  it('retains legacy response and product-card support', async () => {
    const detail = makeOrder().order_list_detail;
    const card = detail.info_card.order_list_cards[0];
    const legacy = {
      list_type: 3,
      info_card: { ...detail.info_card, order_list_cards: [{ shop_info: card.shop_info, product_info: card.parcel_cards[0].product_info }] },
      shipping: { tracking_info: { ctime: 1705320000 } },
    };
    const { result } = await collect([
      { data: { order_data: { details_list: [legacy] } } },
      { data: { order_data: { details_list: [] } } },
    ]);
    expect(result.data.orders[0]).toMatchObject({ name: 'Product A', statusCode: 3, subTotal: 100000 });
    expect(result.data.orders[0].deliveryDate).toBe(new Date(1705320000 * 1000).toISOString());
  });

  it('returns an error rather than a successful empty history for HTTP failures', async () => {
    const { result } = await collect([end], 403);
    expect(result).toEqual({ success: false, error: 'Failed to fetch orders (HTTP 403)' });
  });

  it.each([null, {}, { new_data: {} }, { new_data: { order_or_checkout_data: {} } }])(
    'rejects invalid success payload %j instead of replacing history with empty data', async page => {
      const { result } = await collect([page]);
      expect(result).toEqual({ success: false, error: 'Invalid order response from Shopee' });
    },
  );

  it('treats the final page (no list, next_offset -1) as end of history', async () => {
    const { result } = await collect([
      { error: 0, new_data: { order_or_checkout_data: [makeOrder()], next_offset: 20 } },
      { error: 0, new_data: { next_offset: -1, translation_status: 0 } },
    ]);
    expect(result.success).toBe(true);
    expect(result.data.orders).toHaveLength(1);
  });

  it('accepts an explicit empty list as an empty history', async () => {
    const { result } = await collect([end]);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ orders: [], totalCount: 0, totalAmount: 0 });
  });

  it('preserves an explicit zero subtotal rather than charging final_total', async () => {
    const item = makeOrder();
    item.order_list_detail.info_card.subtotal = 0;
    const { result } = await collect([{ new_data: { order_or_checkout_data: [item] } }, end]);
    expect(result.data.orders[0].subTotal).toBe(0);
    expect(result.data.totalAmount).toBe(0);
  });

  it('does not count products or money from skipped entries without an order card', async () => {
    const skipped = makeOrder();
    skipped.order_list_detail.info_card.order_list_cards = [];
    const { result } = await collect([{ new_data: { order_or_checkout_data: [skipped, makeOrder()] } }, end]);
    expect(result.data.orders).toHaveLength(1);
    expect(result.data).toMatchObject({ totalCount: 2, totalAmount: 100000 });
  });

  it('includes products from every parcel in split-shipment details', async () => {
    const item = makeOrder();
    item.order_list_detail.info_card.order_list_cards[0].parcel_cards.push({
      product_info: { item_groups: [{ items: [{ name: 'Product B', amount: 1, item_price: 1000000000 }] }] },
    });
    const { result } = await collect([{ new_data: { order_or_checkout_data: [item] } }, end]);
    expect(result.data.orders[0].productSummary).toContain('Product A');
    expect(result.data.orders[0].productSummary).toContain('Product B');
  });
});
