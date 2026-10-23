import { describe, it, expect } from 'vitest';
import { UNCATEGORIZED, getCategoryBreakdown, listCategories, orderHasCategory } from '../src/dashboard/categories';
import { generateInsights } from '../src/dashboard/insights';
import type { CategoryMap, Order, OrderItem } from '../src/types';

const item = (itemId: number, unitPrice: number, quantity = 1): OrderItem => ({ itemId, name: `Item ${itemId}`, variation: '', quantity, unitPrice });

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '123',
    name: 'Test Product',
    productCount: 1,
    subTotal: 100_000,
    subTotalFormatted: '100.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'shopee - Test Shop',
    productSummary: 'Test Product (SL: 1)',
    deliveryDate: '2025-01-15T00:00:00.000Z',
    orderMonth: 1,
    orderYear: 2025,
    ...overrides,
  };
}

// Shopee's category tree runs root -> leaf; the chart works at the root.
const tree = (...names: string[]) => ({ path: names.map((name, i) => ({ catid: 1000 + i, name })), fetchedAt: '2026-01-01T00:00:00.000Z' });
const categories: CategoryMap = {
  '1': tree('Điện Thoại & Phụ Kiện', 'Phụ kiện', 'Khác'),
  '2': tree('Thời Trang Nam', 'Áo'),
  '3': tree('Điện Thoại & Phụ Kiện', 'Ốp lưng'),
  '4': { path: [], fetchedAt: '2026-01-01T00:00:00.000Z' }, // Shopee knows the product but it has no category
};

describe('getCategoryBreakdown', () => {
  it('groups spending by the root of the real Shopee category, not by product text', () => {
    const orders = [
      makeOrder({ name: 'Áo thun', items: [item(1, 200_000)] }),
      makeOrder({ name: 'Laptop', items: [item(2, 300_000)] }),
    ];
    expect(getCategoryBreakdown(orders, categories)).toEqual({
      'Điện Thoại & Phụ Kiện': { amount: 200_000, count: 1 },
      'Thời Trang Nam': { amount: 300_000, count: 1 },
    });
  });

  it('merges products with different leaf categories under the same root', () => {
    const orders = [makeOrder({ items: [item(1, 100_000)] }), makeOrder({ items: [item(3, 50_000)] })];
    expect(getCategoryBreakdown(orders, categories)).toEqual({ 'Điện Thoại & Phụ Kiện': { amount: 150_000, count: 2 } });
  });

  it('splits a multi-item order across the categories of its items, price times quantity each', () => {
    const orders = [makeOrder({ items: [item(1, 100_000, 2), item(2, 70_000)] })];
    expect(getCategoryBreakdown(orders, categories)).toEqual({
      'Điện Thoại & Phụ Kiện': { amount: 200_000, count: 1 },
      'Thời Trang Nam': { amount: 70_000, count: 1 },
    });
  });

  it('counts an order once per category even when several of its items share it', () => {
    const orders = [makeOrder({ items: [item(1, 10_000), item(3, 20_000)] })];
    expect(getCategoryBreakdown(orders, categories)['Điện Thoại & Phụ Kiện']).toEqual({ amount: 30_000, count: 1 });
  });

  it('puts products with no known category, or no category at all, under "Chưa phân loại"', () => {
    const orders = [makeOrder({ items: [item(999, 40_000), item(4, 60_000)] })];
    expect(getCategoryBreakdown(orders, categories)).toEqual({ [UNCATEGORIZED]: { amount: 100_000, count: 1 } });
  });

  it('puts orders cached without items under "Chưa phân loại" using the order total', () => {
    expect(getCategoryBreakdown([makeOrder({ subTotal: 250_000 })], categories)).toEqual({
      [UNCATEGORIZED]: { amount: 250_000, count: 1 },
    });
  });

  it.each([4, 12])('excludes orders with status %i', statusCode => {
    const orders = [makeOrder({ statusCode: statusCode as Order['statusCode'], items: [item(1, 500_000)] }), makeOrder({ items: [item(1, 100_000)] })];
    expect(getCategoryBreakdown(orders, categories)['Điện Thoại & Phụ Kiện'].amount).toBe(100_000);
  });

  it('returns an empty object for no orders', () => {
    expect(getCategoryBreakdown([], categories)).toEqual({});
  });

  it('reflects category data that arrives later without touching the orders', () => {
    const orders = [makeOrder({ items: [item(1, 100_000)] })];
    const later: CategoryMap = {};
    expect(getCategoryBreakdown(orders, later)).toEqual({ [UNCATEGORIZED]: { amount: 100_000, count: 1 } });
    later['1'] = categories['1'];
    expect(getCategoryBreakdown(orders, later)).toEqual({ 'Điện Thoại & Phụ Kiện': { amount: 100_000, count: 1 } });
  });
});

describe('category filter', () => {
  const orders = [
    makeOrder({ orderId: 'phone', items: [item(1, 1)] }),
    makeOrder({ orderId: 'mixed', items: [item(2, 1), item(999, 1)] }),
    makeOrder({ orderId: 'legacy' }),
  ];

  it('matches an order that has at least one item in the category', () => {
    expect(orders.filter(o => orderHasCategory(o, categories, 'Thời Trang Nam')).map(o => o.orderId)).toEqual(['mixed']);
  });

  it('matches "Chưa phân loại" for orders with an unclassified item or no items', () => {
    expect(orders.filter(o => orderHasCategory(o, categories, UNCATEGORIZED)).map(o => o.orderId)).toEqual(['mixed', 'legacy']);
  });

  it('lists only the categories present in the data, sorted, with "Chưa phân loại" last', () => {
    expect(listCategories(orders, categories)).toEqual(['Điện Thoại & Phụ Kiện', 'Thời Trang Nam', UNCATEGORIZED]);
    expect(listCategories([orders[0]], categories)).toEqual(['Điện Thoại & Phụ Kiện']);
  });
});

describe('generateInsights category reuse', () => {
  const orders = [
    makeOrder({ items: [item(1, 300_000)], subTotal: 300_000 }),
    makeOrder({ items: [item(2, 100_000)], subTotal: 100_000 }),
    makeOrder({ items: [item(2, 900_000)], subTotal: 900_000, statusCode: 4 }),
    makeOrder({ items: [item(2, 900_000)], subTotal: 900_000, statusCode: 12 }),
  ];

  it('reports the top category from the supplied breakdown', () => {
    const breakdown = getCategoryBreakdown(orders, categories);
    expect(generateInsights(orders, orders, breakdown)).toContain(
      'Danh mục "Điện Thoại & Phụ Kiện" chiếm 75% tổng chi tiêu trong kết quả lọc.',
    );
  });

  it('prefers the first-seen category when spending ties', () => {
    const tied = [makeOrder({ items: [item(2, 100_000)] }), makeOrder({ items: [item(1, 100_000)] })];
    expect(generateInsights(tied, tied, getCategoryBreakdown(tied, categories))).toContain(
      'Danh mục "Thời Trang Nam" chiếm 50% tổng chi tiêu trong kết quả lọc.',
    );
  });

  it.each([
    { orders: [] as Order[] },
    { orders: [makeOrder({ statusCode: 4 }), makeOrder({ statusCode: 12 })] },
    { orders: [makeOrder({ subTotal: 0 })] },
  ])('omits category insights without positive eligible spending (%#)', ({ orders: list }) => {
    const insights = generateInsights(list, list, getCategoryBreakdown(list, categories));
    expect(insights.some(insight => insight.startsWith('Danh mục'))).toBe(false);
  });
});
