import { describe, it, expect } from 'vitest';
import { categorizeOrder, getCategoryBreakdown } from '../src/dashboard/categories';
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
});
