import { describe, it, expect } from 'vitest';
import type { Order } from '../src/types/index.js';
import { FilterEngine, resolveAuthoritativeDate } from '../src/dashboard/filter-engine.js';
import type { FilterCriteria } from '../src/types/index.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'ORD-1001',
    name: 'Áo thun polo nam cao cấp',
    productCount: 1,
    subTotal: 150000,
    subTotalFormatted: '150.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Thời Trang Nam Official',
    productSummary: 'Áo thun polo nam cao cấp (SL: 1)',
    deliveryDate: null,
    orderMonth: null,
    orderYear: null,
    ...overrides,
  };
}

describe('FilterEngine - AuthoritativeDate Resolution', () => {
  it('prioritizes deliveryDate when present and valid', () => {
    const order = makeOrder({
      deliveryDate: '2025-05-20T14:30:00.000Z',
      orderPlacementDate: '2025-05-18T10:00:00.000Z',
      orderYear: 2025,
      orderMonth: 5,
    });
    const resolved = resolveAuthoritativeDate(order);
    expect(resolved).not.toBeNull();
    expect(resolved?.toISOString()).toBe('2025-05-20T14:30:00.000Z');
  });

  it('falls back to orderPlacementDate when deliveryDate is null', () => {
    const order = makeOrder({
      deliveryDate: null,
      orderPlacementDate: '2025-04-10T08:00:00.000Z',
      orderYear: 2025,
      orderMonth: 4,
    });
    const resolved = resolveAuthoritativeDate(order);
    expect(resolved).not.toBeNull();
    expect(resolved?.toISOString()).toBe('2025-04-10T08:00:00.000Z');
  });

  it('falls back to orderId unix timestamp when deliveryDate and orderPlacementDate are absent', () => {
    // 1737000000 = 2025-01-16T04:00:00.000Z
    const timestampSec = 1737000000;
    const order = makeOrder({
      orderId: `${timestampSec}987654`,
      deliveryDate: null,
      orderPlacementDate: null,
    });
    const resolved = resolveAuthoritativeDate(order);
    expect(resolved).not.toBeNull();
    expect(resolved?.getTime()).toBe(timestampSec * 1000);
  });

  it('rejects orderId timestamps in the future or before 2020', () => {
    // Future timestamp: 2500000000 (year 2049)
    const futureOrder = makeOrder({
      orderId: '2500000000123456',
      deliveryDate: null,
      orderYear: 2024,
      orderMonth: 6,
    });
    const resolvedFuture = resolveAuthoritativeDate(futureOrder);
    // Should skip future orderId and fall back to orderYear/orderMonth
    expect(resolvedFuture).not.toBeNull();
    expect(resolvedFuture?.getFullYear()).toBe(2024);
    expect(resolvedFuture?.getMonth()).toBe(5); // 0-based month 5 = June

    // Pre-2020 timestamp: 1500000000 (year 2017)
    const oldOrder = makeOrder({
      orderId: '1500000000123456',
      deliveryDate: null,
    });
    const resolvedOld = resolveAuthoritativeDate(oldOrder);
    expect(resolvedOld).toBeNull();
  });

  it('falls back to orderYear and orderMonth when exact timestamps are unavailable', () => {
    const order = makeOrder({
      orderId: 'CUSTOM-ORDER-ID',
      deliveryDate: null,
      orderYear: 2024,
      orderMonth: 11,
    });
    const resolved = resolveAuthoritativeDate(order);
    expect(resolved).not.toBeNull();
    expect(resolved?.getFullYear()).toBe(2024);
    expect(resolved?.getMonth()).toBe(10); // November
    expect(resolved?.getDate()).toBe(1);
  });

  it('returns null when no valid date sources exist', () => {
    const order = makeOrder({
      orderId: 'INVALID_ID',
      deliveryDate: null,
      orderYear: null,
      orderMonth: null,
    });
    expect(resolveAuthoritativeDate(order)).toBeNull();
  });
});

describe('FilterEngine - Temporal Filtering (TimeCriteria)', () => {
  const orders: Order[] = [
    makeOrder({
      orderId: 'ORD-2024-JAN',
      deliveryDate: '2024-01-15T10:00:00.000Z',
      orderYear: 2024,
      orderMonth: 1,
    }),
    makeOrder({
      orderId: 'ORD-2024-NOV-11',
      deliveryDate: '2024-11-11T12:00:00.000Z',
      orderYear: 2024,
      orderMonth: 11,
    }),
    makeOrder({
      orderId: 'ORD-2024-CANCELLED',
      deliveryDate: null,
      orderYear: 2024,
      orderMonth: 11,
      statusCode: 4,
      status: 'Đã hủy',
    }),
    makeOrder({
      orderId: 'ORD-2025-MAR',
      deliveryDate: '2025-03-25T15:00:00.000Z',
      orderYear: 2025,
      orderMonth: 3,
    }),
  ];

  it('returns all orders when TimeCriteria is "all"', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'all' },
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(4);
  });

  it('filters by calendar year including orders with fallback orderYear', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'year', year: 2024 },
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(3);
    expect(result.map(o => o.orderId)).toEqual([
      'ORD-2024-JAN',
      'ORD-2024-NOV-11',
      'ORD-2024-CANCELLED',
    ]);
  });

  it('filters by specific month including orders with fallback orderYear and orderMonth', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'month', year: 2024, month: 11 },
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(o => o.orderId)).toEqual([
      'ORD-2024-NOV-11',
      'ORD-2024-CANCELLED',
    ]);
  });

  it('filters by exact day and excludes orders lacking specific day information', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'day', year: 2024, month: 11, day: 11 },
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].orderId).toBe('ORD-2024-NOV-11');
  });

  it('filters by date range with inclusive boundaries', () => {
    const start = new Date(2024, 10, 1, 0, 0, 0, 0);
    const end = new Date(2024, 10, 30, 23, 59, 59, 999);
    const criteria: FilterCriteria = {
      time: { kind: 'range', start, end },
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(o => o.orderId)).toContain('ORD-2024-NOV-11');
    expect(result.map(o => o.orderId)).toContain('ORD-2024-CANCELLED');
  });

  it('does not mutate the original orders array', () => {
    const copy = [...orders];
    FilterEngine.evaluate(orders, { time: { kind: 'year', year: 2025 } });
    expect(orders).toEqual(copy);
  });
});

describe('FilterEngine - Multi-Criteria Filtering', () => {
  const orders: Order[] = [
    makeOrder({
      orderId: 'ORD-101',
      name: 'Áo thun cotton thoáng mát',
      shopName: 'Thời Trang GenZ',
      productSummary: 'Áo thun cotton (SL: 1)',
      statusCode: 3,
      status: 'Hoàn thành',
      deliveryDate: '2024-06-10T10:00:00.000Z',
      orderYear: 2024,
      orderMonth: 6,
    }),
    makeOrder({
      orderId: 'ORD-102',
      name: 'Chuột không dây gaming logitech',
      shopName: 'Công Nghệ Số Official',
      productSummary: 'Chuột máy tính không dây (SL: 1)',
      statusCode: 3,
      status: 'Hoàn thành',
      deliveryDate: '2024-06-15T12:00:00.000Z',
      orderYear: 2024,
      orderMonth: 6,
    }),
    makeOrder({
      orderId: 'ORD-103',
      name: 'Bàn phím cơ bluetooth',
      shopName: 'Công Nghệ Số Official',
      productSummary: 'Bàn phím cơ (SL: 1)',
      statusCode: 4,
      status: 'Đã hủy',
      deliveryDate: null,
      orderYear: 2024,
      orderMonth: 6,
    }),
    makeOrder({
      orderId: 'ORD-104',
      name: 'Quần jean nam ống rộng',
      shopName: 'Thời Trang GenZ',
      productSummary: 'Quần jean nam (SL: 1)',
      statusCode: 7,
      status: 'Chờ vận chuyển',
      deliveryDate: '2024-07-01T08:00:00.000Z',
      orderYear: 2024,
      orderMonth: 7,
    }),
  ];

  it('filters by status code when specified', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'all' },
      status: '3',
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(o => o.orderId)).toEqual(['ORD-101', 'ORD-102']);
  });

  it('filters by category keyword matching', () => {
    // 'Chuột' and 'Bàn phím' categorize as 'Điện tử'
    const criteria: FilterCriteria = {
      time: { kind: 'all' },
      category: 'Điện tử',
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(o => o.orderId)).toEqual(['ORD-102', 'ORD-103']);
  });

  it('filters by free-text search term across shopName, name, or orderId', () => {
    const criteriaShop: FilterCriteria = {
      time: { kind: 'all' },
      searchTerm: 'Công Nghệ Số',
    };
    const resultShop = FilterEngine.evaluate(orders, criteriaShop);
    expect(resultShop).toHaveLength(2);
    expect(resultShop.map(o => o.orderId)).toEqual(['ORD-102', 'ORD-103']);

    const criteriaId: FilterCriteria = {
      time: { kind: 'all' },
      searchTerm: 'ord-104',
    };
    const resultId = FilterEngine.evaluate(orders, criteriaId);
    expect(resultId).toHaveLength(1);
    expect(resultId[0].orderId).toBe('ORD-104');
  });

  it('evaluates intersection (AND) of time, status, category, and search term', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'month', year: 2024, month: 6 },
      status: '3',
      category: 'Điện tử',
      searchTerm: 'chuột',
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].orderId).toBe('ORD-102');
  });

  it('returns empty array when criteria intersection has no matches', () => {
    const criteria: FilterCriteria = {
      time: { kind: 'year', year: 2024 },
      status: '4', // Cancelled
      category: 'Thời trang',
    };
    const result = FilterEngine.evaluate(orders, criteria);
    expect(result).toHaveLength(0);
  });
});

describe('FilterEngine - Encapsulated Sorting', () => {
  const orders: Order[] = [
    makeOrder({
      orderId: 'ORD-A',
      subTotal: 300000,
      statusCode: 3,
      deliveryDate: '2024-03-01T00:00:00.000Z',
      orderYear: 2024,
      orderMonth: 3,
    }),
    makeOrder({
      orderId: 'ORD-B',
      subTotal: 100000,
      statusCode: 7,
      deliveryDate: '2024-01-01T00:00:00.000Z',
      orderYear: 2024,
      orderMonth: 1,
    }),
    makeOrder({
      orderId: 'ORD-C',
      subTotal: 200000,
      statusCode: 4,
      deliveryDate: null, // Fallback to 2024-02-01
      orderYear: 2024,
      orderMonth: 2,
    }),
  ];

  it('sorts by subTotal ascending and descending', () => {
    const ascResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'subTotal', direction: 'asc' },
    });
    expect(ascResult.map(o => o.orderId)).toEqual(['ORD-B', 'ORD-C', 'ORD-A']);

    const descResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'subTotal', direction: 'desc' },
    });
    expect(descResult.map(o => o.orderId)).toEqual(['ORD-A', 'ORD-C', 'ORD-B']);
  });

  it('sorts by deliveryDate using authoritative date resolution ascending and descending', () => {
    const ascResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'deliveryDate', direction: 'asc' },
    });
    // Jan (ORD-B), Feb (ORD-C via fallback), Mar (ORD-A)
    expect(ascResult.map(o => o.orderId)).toEqual(['ORD-B', 'ORD-C', 'ORD-A']);

    const descResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'deliveryDate', direction: 'desc' },
    });
    expect(descResult.map(o => o.orderId)).toEqual(['ORD-A', 'ORD-C', 'ORD-B']);
  });

  it('sorts by status (statusCode) ascending and descending', () => {
    const ascResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'status', direction: 'asc' },
    });
    // Status codes: 3 (ORD-A), 4 (ORD-C), 7 (ORD-B)
    expect(ascResult.map(o => o.orderId)).toEqual(['ORD-A', 'ORD-C', 'ORD-B']);

    const descResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'status', direction: 'desc' },
    });
    expect(descResult.map(o => o.orderId)).toEqual(['ORD-B', 'ORD-C', 'ORD-A']);
  });

  it('preserves order when sort field is null or unrecognized', () => {
    const noSortResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: null, direction: 'asc' },
    });
    expect(noSortResult.map(o => o.orderId)).toEqual(['ORD-A', 'ORD-B', 'ORD-C']);

    const unknownFieldResult = FilterEngine.evaluate(orders, {
      time: { kind: 'all' },
      sort: { field: 'unrecognized', direction: 'asc' },
    });
    expect(unknownFieldResult.map(o => o.orderId)).toEqual(['ORD-A', 'ORD-B', 'ORD-C']);
  });

  it('handles null date values deterministically when sorting', () => {
    const withUndated = [
      makeOrder({ orderId: 'NO-DATE', deliveryDate: null, orderYear: null, orderMonth: null }),
      makeOrder({ orderId: 'HAS-DATE', deliveryDate: '2025-06-01T00:00:00.000Z' }),
    ];
    const result = FilterEngine.evaluate(withUndated, {
      time: { kind: 'all' },
      sort: { field: 'deliveryDate', direction: 'asc' },
    });
    // Undated orders sort to the beginning in asc
    expect(result.map(o => o.orderId)).toEqual(['NO-DATE', 'HAS-DATE']);
  });
});
