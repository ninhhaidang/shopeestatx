import { describe, it, expect, vi } from 'vitest';
import { categorizeOrder, getCategoryBreakdown } from '../src/dashboard/categories';
import { generateInsights } from '../src/dashboard/insights';
import type { Order } from '../src/types';

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

describe('categorizeOrder', () => {
  it.each([
    ['Núm vú silicone', 'Mẹ & Bé'],
    ['num vu silicone', 'Mẹ & Bé'],
    ['Sạc không dây', 'Điện tử'],
    ['Thước', 'Sách & Văn phòng'],
  ])('matches normalized keyword in %s', (name, category) => {
    expect(categorizeOrder(makeOrder({ name, productSummary: name }))).toBe(category);
  });

  it('categorizes electronics by product name', () => {
    const order = makeOrder({ productSummary: 'Tai nghe bluetooth Sony (SL: 1)', name: 'Tai nghe Sony' });
    expect(categorizeOrder(order)).toBe('Điện tử');
  });

  it('categorizes fashion by product name', () => {
    const order = makeOrder({ productSummary: 'Áo thun nam trắng (SL: 2)', name: 'Áo thun' });
    expect(categorizeOrder(order)).toBe('Thời trang');
  });

  it('categorizes beauty products', () => {
    const order = makeOrder({ productSummary: 'Kem dưỡng ẩm Neutrogena 50ml (SL: 1)', name: 'Kem Neutrogena' });
    expect(categorizeOrder(order)).toBe('Sắc đẹp');
  });

  it('categorizes food items', () => {
    const order = makeOrder({ productSummary: 'Bánh mì sandwich (SL: 3)', name: 'Bánh mì' });
    expect(categorizeOrder(order)).toBe('Thực phẩm');
  });

  it('categorizes home items', () => {
    const order = makeOrder({ productSummary: 'Đèn LED phòng ngủ (SL: 1)', name: 'Đèn LED' });
    expect(categorizeOrder(order)).toBe('Nhà cửa');
  });

  it('categorizes health products', () => {
    const order = makeOrder({ productSummary: 'Vitamin C 1000mg (SL: 1)', name: 'Vitamin C' });
    expect(categorizeOrder(order)).toBe('Sức khỏe');
  });

  it('categorizes sports items', () => {
    const order = makeOrder({ productSummary: 'Thảm yoga 6mm (SL: 1)', name: 'Thảm yoga' });
    expect(categorizeOrder(order)).toBe('Thể thao');
  });

  it('categorizes books and stationery', () => {
    const order = makeOrder({ productSummary: 'Sách học tiếng Anh (SL: 1)', name: 'Sách' });
    expect(categorizeOrder(order)).toBe('Sách & Văn phòng');
  });

  it('falls back to Khác for unknown products', () => {
    const order = makeOrder({ productSummary: 'Xyzxyz unknown item (SL: 1)', name: 'Unknown', shopName: 'shopee - Random Shop' });
    expect(categorizeOrder(order)).toBe('Khác');
  });

  it('matches English keywords too', () => {
    const order = makeOrder({ productSummary: 'Wireless keyboard mechanical (SL: 1)', name: 'Keyboard' });
    expect(categorizeOrder(order)).toBe('Điện tử');
  });

  it('is case-insensitive', () => {
    const order = makeOrder({ productSummary: 'LAPTOP Gaming ASUS (SL: 1)', name: 'LAPTOP' });
    expect(categorizeOrder(order)).toBe('Điện tử');
  });

  it.each([' Laptop ', '-Laptop-', '.Laptop.', ',Laptop,', '(Laptop)'])('matches existing boundaries in %s', name => {
    expect(categorizeOrder(makeOrder({ name, productSummary: '', shopName: '' }))).toBe('Điện tử');
  });

  it.each(['xxlaptopyy', '/Laptop/', '_Laptop_'])('does not broaden word boundaries in %s', name => {
    expect(categorizeOrder(makeOrder({ name, productSummary: '', shopName: '' }))).toBe('Khác');
  });

  it('keeps category priority when several categories match', () => {
    expect(categorizeOrder(makeOrder({ name: 'Laptop baby', productSummary: '', shopName: '' }))).toBe('Mẹ & Bé');
  });

  it('does not retain a category when order text changes', () => {
    const order = makeOrder({ name: 'Laptop', productSummary: '', shopName: '' });
    expect(categorizeOrder(order)).toBe('Điện tử');
    order.name = 'Vitamin';
    expect(categorizeOrder(order)).toBe('Sức khỏe');
  });
});

describe('getCategoryBreakdown', () => {
  it('aggregates orders by category', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 200_000, productSummary: 'Tai nghe (SL: 1)', name: 'Tai nghe' }),
      makeOrder({ subTotal: 300_000, productSummary: 'Áo thun (SL: 1)', name: 'Áo thun' }),
      makeOrder({ subTotal: 150_000, productSummary: 'Laptop case (SL: 1)', name: 'Case laptop' }),
    ];
    const breakdown = getCategoryBreakdown(orders);
    expect(breakdown['Điện tử'].amount).toBeGreaterThanOrEqual(200_000);
    expect(breakdown['Thời trang'].amount).toBe(300_000);
  });

  it('excludes cancelled orders (statusCode 4)', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 500_000, statusCode: 4, productSummary: 'Laptop (SL: 1)', name: 'Laptop' }),
      makeOrder({ subTotal: 100_000, statusCode: 3, productSummary: 'Laptop (SL: 1)', name: 'Laptop' }),
    ];
    const breakdown = getCategoryBreakdown(orders);
    expect(breakdown['Điện tử'].amount).toBe(100_000);
  });

  it('excludes returned orders (statusCode 12)', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 500_000, statusCode: 12, productSummary: 'Áo (SL: 1)', name: 'Áo' }),
    ];
    const breakdown = getCategoryBreakdown(orders);
    expect(breakdown['Thời trang']).toBeUndefined();
  });

  it('returns empty object for empty orders', () => {
    expect(getCategoryBreakdown([])).toEqual({});
  });

  it('counts orders per category correctly', () => {
    const orders: Order[] = [
      makeOrder({ productSummary: 'Vitamin (SL: 1)', name: 'Vitamin' }),
      makeOrder({ productSummary: 'Vitamin C (SL: 1)', name: 'Vitamin C' }),
    ];
    const breakdown = getCategoryBreakdown(orders);
    expect(breakdown['Sức khỏe'].count).toBe(2);
  });

  it('recomputes totals and categories after orders change', () => {
    const order = makeOrder({ name: 'Laptop', productSummary: '', shopName: '' });
    const orders = [order];
    const original = getCategoryBreakdown(orders);
    order.name = 'Vitamin';
    order.subTotal = 250_000;
    expect(getCategoryBreakdown(orders)).toEqual({ 'Sức khỏe': { amount: 250_000, count: 1 } });
    expect(original).toEqual({ 'Điện tử': { amount: 100_000, count: 1 } });
    order.statusCode = 4;
    expect(getCategoryBreakdown(orders)).toEqual({});
  });
});

describe('generateInsights category reuse', () => {
  it('preserves insights with a supplied filtered breakdown', () => {
    const orders = [
      makeOrder({ name: 'Laptop', productSummary: '', subTotal: 300_000 }),
      makeOrder({ name: 'Vitamin', productSummary: '', subTotal: 100_000 }),
      makeOrder({ name: 'Vitamin', productSummary: '', subTotal: 900_000, statusCode: 4 }),
      makeOrder({ name: 'Vitamin', productSummary: '', subTotal: 900_000, statusCode: 12 }),
    ];
    const allOrders = [...orders, makeOrder({ name: 'Vitamin', productSummary: '', subTotal: 5_000_000 })];
    const breakdown = getCategoryBreakdown(orders);
    const expected = generateInsights(orders, allOrders);
    expect(expected).toContain('Danh mục "Điện tử" chiếm 75% tổng chi tiêu trong kết quả lọc.');
    expect(generateInsights(orders, allOrders, breakdown)).toEqual(expected);
    expect(breakdown).toEqual({
      'Điện tử': { amount: 300_000, count: 1 },
      'Sức khỏe': { amount: 100_000, count: 1 },
    });
  });

  it('does not read product text again when a breakdown is supplied', () => {
    const productSummary = vi.fn(() => 'Laptop');
    const order = makeOrder({ name: 'Laptop' });
    Object.defineProperty(order, 'productSummary', { get: productSummary });
    const breakdown = getCategoryBreakdown([order]);
    productSummary.mockClear();

    expect(generateInsights([order], [order], breakdown)).toContain(
      'Danh mục "Điện tử" chiếm 100% tổng chi tiêu trong kết quả lọc.',
    );
    expect(productSummary).not.toHaveBeenCalled();
  });

  it('preserves first-seen category order for tied spending', () => {
    const orders = [
      makeOrder({ name: 'Vitamin', productSummary: '' }),
      makeOrder({ name: 'Laptop', productSummary: '' }),
    ];
    const breakdown = getCategoryBreakdown(orders);
    expect(generateInsights(orders, orders, breakdown)).toEqual(generateInsights(orders, orders));
    expect(generateInsights(orders, orders, breakdown)).toContain(
      'Danh mục "Sức khỏe" chiếm 50% tổng chi tiêu trong kết quả lọc.',
    );
  });

  it.each([
    { orders: [] },
    { orders: [makeOrder({ statusCode: 4 }), makeOrder({ statusCode: 12 })] },
    { orders: [makeOrder({ subTotal: 0 })] },
  ])('omits category insights without positive eligible spending (%#)', ({ orders }) => {
    const insights = generateInsights(orders, orders, getCategoryBreakdown(orders));
    expect(insights).toEqual(generateInsights(orders, orders));
    expect(insights.some(insight => insight.startsWith('Danh mục'))).toBe(false);
  });
});
