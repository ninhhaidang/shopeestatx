import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictMonthEnd } from '../src/dashboard/predictions';
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

describe('predictMonthEnd', () => {
  beforeEach(() => {
    // Fix "now" to 2025-01-15 (day 15 of 31-day month)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('predicts month-end spending based on current daily pace', () => {
    // 15 days in, 300k spent → ~20k/day → 31*20k = 620k for full month
    const orders: Order[] = [
      makeOrder({ subTotal: 150_000, orderMonth: 1, orderYear: 2025 }),
      makeOrder({ subTotal: 150_000, orderMonth: 1, orderYear: 2025 }),
    ];
    const prediction = predictMonthEnd(orders);
    // 300k / 15 days * 31 days = 620k
    expect(prediction).toBe(620_000);
  });

  it('ignores cancelled orders (statusCode 4)', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 500_000, statusCode: 4, orderMonth: 1, orderYear: 2025 }),
      makeOrder({ subTotal: 150_000, statusCode: 3, orderMonth: 1, orderYear: 2025 }),
    ];
    const prediction = predictMonthEnd(orders);
    // Only 150k counts; 150k / 15 * 31 = 310k
    expect(prediction).toBe(310_000);
  });

  it('ignores returned orders (statusCode 12)', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 500_000, statusCode: 12, orderMonth: 1, orderYear: 2025 }),
      makeOrder({ subTotal: 300_000, statusCode: 3, orderMonth: 1, orderYear: 2025 }),
    ];
    const prediction = predictMonthEnd(orders);
    expect(prediction).toBe(620_000); // 300k / 15 * 31
  });

  it('ignores orders from other months', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 900_000, orderMonth: 12, orderYear: 2024 }),
      makeOrder({ subTotal: 150_000, orderMonth: 1, orderYear: 2025 }),
    ];
    const prediction = predictMonthEnd(orders);
    expect(prediction).toBe(310_000); // Only Jan 2025 counts
  });

  it('returns 0 when no orders this month', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 500_000, orderMonth: 12, orderYear: 2024 }),
    ];
    expect(predictMonthEnd(orders)).toBe(0);
  });

  it('returns 0 for empty order list', () => {
    expect(predictMonthEnd([])).toBe(0);
  });

  it('rounds the prediction to nearest integer', () => {
    const orders: Order[] = [
      makeOrder({ subTotal: 100_000, orderMonth: 1, orderYear: 2025 }),
    ];
    const prediction = predictMonthEnd(orders);
    expect(Number.isInteger(prediction)).toBe(true);
  });
});
