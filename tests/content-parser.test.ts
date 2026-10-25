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

async function collect(pages: unknown[], httpStatus = 200, getItem: (key: string) => string | null = () => null) {
  const fetch = vi.fn();
  for (const page of pages) {
    fetch.mockResolvedValueOnce({ ok: httpStatus < 400, status: httpStatus, json: async () => page });
  }
  const postMessage = vi.fn();
  const result = await runInNewContext(contentScript, {
    fetch,
    window: { postMessage },
    localStorage: { getItem },
    console: { error: vi.fn() },
  });
  return { result, fetch, postMessage };
}

// executeScript injects content.js as a classic script into the tab's shared global,
// so a second injection (retry/refresh without reloading the tab) re-runs in the same scope.
describe('content script re-injection into the same page', () => {
  it('returns data on a second run in the same global, not undefined', async () => {
    const page = { new_data: { order_or_checkout_data: [makeOrder()] } };
    const fetch = vi.fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ new_data: { next_offset: -1 } }) });
    const globalScope = createContext({
      fetch, window: { postMessage: vi.fn() }, localStorage: { getItem: () => null }, console: { error: vi.fn() },
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

const end = { new_data: { order_or_checkout_data: [] } };

describe('content script order collection', () => {
  it('follows returned short-page cursors and consumes a nonempty terminal page', async () => {
    const second = makeOrder();
    second.order_list_detail.info_card.order_id = 'ORDER-2';
    const { result, fetch } = await collect([
      { new_data: { next_offset: 7, order_or_checkout_data: [makeOrder()] } },
      { new_data: { next_offset: -1, order_or_checkout_data: [second] } },
    ]);
    expect(result.success).toBe(true);
    expect(result.data.orders).toHaveLength(2);
    expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get('offset'))).toEqual(['0', '7']);
  });

  it('continues an empty cursor page until explicit terminal cursor', async () => {
    const { result, fetch } = await collect([
      { new_data: { next_offset: 4, order_or_checkout_data: [] } },
      { new_data: { next_offset: -1, order_or_checkout_data: [makeOrder()] } },
    ]);
    expect(result.data.orders).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([0, -2, '20', null, 1.5])('fails without partial data for invalid cursor %j', async (next_offset) => {
    const { result } = await collect([{ new_data: { next_offset, order_or_checkout_data: [makeOrder()] } }]);
    expect(result).toMatchObject({ success: false });
    expect(result.error).toContain('cursor');
    expect(result.data).toBeUndefined();
  });

  it('discards earlier pages when a later cursor does not advance', async () => {
    const { result } = await collect([
      { new_data: { next_offset: 7, order_or_checkout_data: [makeOrder()] } },
      { new_data: { next_offset: 7, order_or_checkout_data: [makeOrder()] } },
    ]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('cursor');
    expect(result.data).toBeUndefined();
  });

  it('keeps last duplicate order and computes totals from unique latest rows', async () => {
    const changed = makeOrder('label_cancelled');
    changed.order_list_detail.info_card.product_count = 3;
    const { result } = await collect([
      { new_data: { next_offset: 3, order_or_checkout_data: [makeOrder()] } },
      { new_data: { next_offset: -1, order_or_checkout_data: [changed] } },
    ]);
    expect(result.data.orders).toHaveLength(1);
    expect(result.data.orders[0].statusCode).toBe(4);
    expect(result.data).toMatchObject({ totalCount: 3, totalAmount: 0 });
  });

  it('normalizes numeric order and stable shop IDs to strings', async () => {
    const item = makeOrder();
    Object.assign(item.order_list_detail.info_card, { order_id: 12345 });
    Object.assign(item.order_list_detail.info_card.order_list_cards[0].shop_info, { shop_id: 42 });
    const { result } = await collect([{ new_data: { next_offset: -1, order_or_checkout_data: [item] } }]);
    expect(result.data.orders[0]).toMatchObject({ orderId: '12345', shopId: '42' });
  });

  it.each(['ORDER-1', '170532000012345'])('keeps delivery unknown without tracking time for %s', async (orderId) => {
    const item = makeOrder();
    item.order_list_detail.info_card.order_id = orderId;
    if (orderId !== 'ORDER-1') Reflect.deleteProperty(item.order_list_detail.status, 'update_time');
    const { result } = await collect([{ new_data: { next_offset: -1, order_or_checkout_data: [item] } }]);
    expect(result.data.orders[0]).toMatchObject({ deliveryDate: null, orderMonth: null, orderYear: null });
  });

  it('uses valid basic profile when mini-session JSON is malformed', async () => {
    const { result } = await collect([end], 200, key => key === 'mini-session' ? '{' : JSON.stringify({ username: 'fallback', portrait: 'portrait' }));
    expect(result.data.user).toMatchObject({ username: 'fallback', avatar: 'https://cf.shopee.vn/file/portrait' });
  });

  it.each<[
    { id?: string | number; uid?: string; name: string } | null,
    { id?: string | number; uid?: string; name: string } | null,
  ]>([
    [{ id: 42, name: 'before' }, { id: '42', name: 'after' }],
    [{ id: 42, name: 'before' }, { uid: 'different-source', name: 'after' }],
    [{ id: 42, name: 'before' }, null],
    [null, { id: 43, name: 'after' }],
  ])('keeps starting profile when identity is equal or incomparable: %j -> %j', async (starting, ending) => {
    let user = starting;
    const result = await runInNewContext(contentScript, {
      fetch: async () => {
        user = ending;
        return { ok: true, json: async () => ({ new_data: { next_offset: -1, order_or_checkout_data: [makeOrder()] } }) };
      },
      window: { postMessage: vi.fn() },
      localStorage: { getItem: (key: string) => key === 'mini-session' && user ? JSON.stringify({ user }) : null },
      console: { error: vi.fn() },
    });
    expect(result.success).toBe(true);
    if (starting) expect(result.data.user).toMatchObject({ userId: starting.id, name: starting.name });
    else expect(result.data.user).toBeNull();
  });

  it.each(['while fetching', 'at completion'])('rejects detectable account changes %s without partial data', async (phase) => {
    let account = 'first';
    const fetch = vi.fn(async () => {
      if (phase === 'while fetching') account = 'second';
      return {
        ok: true,
        json: async () => {
          if (phase === 'at completion') account = 'second';
          return { new_data: { next_offset: -1, order_or_checkout_data: [makeOrder()] } };
        },
      };
    });
    const result = await runInNewContext(contentScript, {
      fetch,
      window: { postMessage: vi.fn() },
      localStorage: { getItem: (key: string) => key === 'mini-session' ? JSON.stringify({ user: { id: account, name: account } }) : null },
      console: { error: vi.fn() },
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/account.*chang/i);
    expect(result.data).toBeUndefined();
  });

  it('captures starting scan token for progress even when global token changes', async () => {
    const postMessage = vi.fn();
    const window = { postMessage, __shopeestatxScanId: 'scan-first' };
    const result = await runInNewContext(contentScript, {
      fetch: async () => {
        window.__shopeestatxScanId = 'scan-second';
        return { ok: true, json: async () => ({ new_data: { next_offset: -1, order_or_checkout_data: [makeOrder()] } }) };
      },
      window,
      localStorage: { getItem: () => null },
      console: { error: vi.fn() },
    });
    expect(result.success).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ source: 'shopee-stats', type: 'progress', count: 1, scanId: 'scan-first' }, '*');
  });

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
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(postMessage).toHaveBeenCalledWith({ source: 'shopee-stats', type: 'progress', count: 2, scanId: '' }, '*');
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

  it('does not publish partial history when a later page reports an API error', async () => {
    const { result } = await collect([
      { new_data: { order_or_checkout_data: [makeOrder()] } },
      { error: 19, error_msg: 'Session expired' },
    ]);
    expect(result).toEqual({ success: false, error: 'Session expired' });
    expect(result).not.toHaveProperty('data');
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

describe('excluded orders keep their original amount as a refund', () => {
  it('does not charge a cancelled order but records its amount as refundAmount', async () => {
    const { result } = await collect([{ new_data: { order_or_checkout_data: [makeOrder('label_cancelled')] } }, end]);
    expect(result.data.orders[0]).toMatchObject({ subTotal: 0, refundAmount: 100000 });
    expect(result.data.totalAmount).toBe(0);
  });

  it('records no refund for a completed order', async () => {
    const { result } = await collect([{ new_data: { order_or_checkout_data: [makeOrder()] } }, end]);
    expect(result.data.orders[0]).toMatchObject({ subTotal: 100000, refundAmount: 0 });
  });
});

describe('structured items and items total', () => {
  it('records itemsTotal as item price times quantity and a structured item list', async () => {
    const { result } = await collect([{ new_data: { order_or_checkout_data: [makeOrder()] } }, end]);
    expect(result.data.orders[0].itemsTotal).toBe(100000);
    expect(result.data.orders[0].items).toEqual([{ name: 'Product A', quantity: 2, unitPrice: 50000 }]);
  });

  it('sums items across every parcel of a split shipment', async () => {
    const item = makeOrder();
    item.order_list_detail.info_card.order_list_cards[0].parcel_cards.push({
      product_info: { item_groups: [{ items: [{ name: 'Product B', amount: 3, item_price: 1000000000 }] }] },
    });
    const { result } = await collect([{ new_data: { order_or_checkout_data: [item] } }, end]);
    expect(result.data.orders[0].itemsTotal).toBe(130000);
    expect(result.data.orders[0].items.map((i: { name: string }) => i.name)).toEqual(['Product A', 'Product B']);
  });
});

// Same response shape as the live page, with a discounted item, a paid-less-than-items order and a
// cancelled order that still carries its subtotal. Amounts are arbitrary, not from a real account.
const discountPage = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/shopee-order-page-discounts.json'), 'utf8'));

describe('content script against discounted and cancelled live shapes', () => {
  it('reads paid amount, items total and refund from the real field layout', async () => {
    const { result } = await collect([discountPage, liveFinalPage]);
    const [discounted, voucher, cancelledOrder] = result.data.orders;
    expect(discounted).toMatchObject({ subTotal: 80000, itemsTotal: 80000, refundAmount: 0 });
    expect(voucher).toMatchObject({ subTotal: 140000, itemsTotal: 175000, refundAmount: 0 });
    expect(cancelledOrder).toMatchObject({ subTotal: 0, refundAmount: 175000 });
    expect(result.data.totalAmount).toBe(220000);
  });
});
