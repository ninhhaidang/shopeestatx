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

async function collect(pages: unknown[], httpStatus = 200) {
  const fetch = vi.fn();
  for (const page of pages) {
    fetch.mockResolvedValueOnce({ ok: httpStatus < 400, status: httpStatus, json: async () => page });
  }
  const postMessage = vi.fn();
  const result = await runInNewContext(contentScript, {
    fetch,
    window: { postMessage },
    localStorage: { getItem: () => null },
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
    expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get('offset'))).toEqual(['0', '20', '40']);
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
