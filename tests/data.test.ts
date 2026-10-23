import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeUI } from '../src/dashboard/data';
import { applyFilters } from '../src/dashboard/filters';
import type { Order, OrderData } from '../src/types';

vi.mock('../src/dashboard/filters', () => ({ applyFilters: vi.fn() }));

const order: Order = {
  orderId: '123', name: 'Test product', productCount: 1, subTotal: 100_000,
  subTotalFormatted: '100.000 ₫', status: 'Hoàn thành', statusCode: 3,
  shopName: 'Test shop', productSummary: 'Test product',
  deliveryDate: '2025-01-15T00:00:00.000Z', orderMonth: 1, orderYear: 2025,
};
const data: OrderData = {
  orders: [order], totalCount: 1, totalAmount: 100_000,
  totalAmountFormatted: '100.000 ₫', fetchedAt: '2025-01-15T00:00:00.000Z',
};

describe('dashboard data initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loading"></div><div id="noData">Previous fetch failed</div>
      <div id="content" class="hidden"></div><span id="fetchedAt"></span>
      <select id="filterYear"><option value="">All years</option>
        <option value="2025">2025</option><option value="2024">2024</option>
      </select>
    `;
    vi.clearAllMocks();
  });

  afterEach(() => { document.body.innerHTML = ''; });

  it('removes stale error state after a successful retry', () => {
    initializeUI(data);

    expect(document.getElementById('noData')!.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('loading')!.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('content')!.classList.contains('hidden')).toBe(false);
    expect(applyFilters).toHaveBeenCalledOnce();
  });

  it('preserves an existing year selection when refreshing orders', () => {
    const select = document.getElementById('filterYear') as HTMLSelectElement;
    select.value = '2025';
    initializeUI(data);

    expect(select.value).toBe('2025');
    expect(Array.from(select.options, option => option.value)).toEqual(['', '2025']);
  });

  it('falls back to all years if refreshed data no longer contains selected year', () => {
    const select = document.getElementById('filterYear') as HTMLSelectElement;
    select.value = '2024';
    initializeUI(data);

    expect(select.value).toBe('');
    expect(select.selectedIndex).toBe(0);
  });
});
