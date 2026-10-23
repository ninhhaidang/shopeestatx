import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import type * as CategoryModule from '../src/dashboard/categories';
import { state } from '../src/dashboard/state';
import { EVENTS } from '../src/config';
import type { Order, OrderData } from '../src/types';

vi.mock('../src/dashboard/charts', () => ({ renderCharts: vi.fn() }));
vi.mock('../src/dashboard/categories', async importOriginal => {
  const actual = await importOriginal<typeof CategoryModule>();
  return { ...actual, renderCategoryChart: vi.fn() };
});
vi.mock('../src/dashboard/budget', () => ({
  loadBudgetConfig: () => Promise.resolve({}),
  setCachedBudgetConfig: vi.fn(),
  getCachedBudgetConfig: () => ({ monthlyLimit: 0, alertThreshold: 0.8, enabled: false }),
  saveBudgetConfig: vi.fn(),
}));
vi.mock('../src/dashboard/data', () => ({
  isExtensionContext: () => false,
  loadMockData: async () => { state.allOrdersData = fixture; },
  loadDataFromStorage: vi.fn(), refreshData: vi.fn(), reloadAllData: vi.fn(),
}));

const orders: Order[] = [
  { orderId: 'a', name: 'Sách', productCount: 1, subTotal: 100_000,
    subTotalFormatted: '100.000 ₫', status: 'Hoàn thành', statusCode: 3,
    shopName: 'Shop A', productSummary: 'Sách', deliveryDate: '2025-01-15T00:00:00.000Z', orderMonth: 1, orderYear: 2025 },
  { orderId: 'b', name: 'Áo', productCount: 1, subTotal: 0,
    subTotalFormatted: '0 ₫', status: 'Đã hủy', statusCode: 4,
    shopName: 'Shop B', productSummary: 'Áo', deliveryDate: '2025-01-16T00:00:00.000Z', orderMonth: 1, orderYear: 2025 },
];
const fixture: OrderData = {
  orders, totalCount: 2, totalAmount: 100_000,
  totalAmountFormatted: '100.000 ₫', fetchedAt: '2025-01-20T00:00:00.000Z',
};

it('updates orders once per filter action and still accepts a heatmap filter request', async () => {
  const html = readFileSync(resolve(process.cwd(), 'src/dashboard/results.html'), 'utf8');
  document.body.innerHTML = html.match(/<body>([\s\S]*?)<\/body>/)![1];
  state.allOrdersData = fixture;
  state.filteredOrders = orders;
  state.dateRange = { start: null, end: null };
  state.selectedDay = null;
  state.currentSort = { field: null, direction: 'asc' };
  // Import after installing the DOM: the controller registers DOMContentLoaded at module load.

  await import('../src/dashboard/results');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await vi.waitFor(() => expect(document.getElementById('btnExport')?.getAttribute('aria-haspopup')).toBe('true'));
  const status = document.getElementById('filterStatus') as HTMLSelectElement;
  const changed = vi.fn();
  document.addEventListener(EVENTS.APPLY_FILTERS, changed);

  status.value = '3';
  status.dispatchEvent(new Event('change'));
  expect(state.filteredOrders.map(order => order.orderId)).toEqual(['a']);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(document.getElementById('pageTotal')?.textContent).toBe('1');
  const firstDate = document.querySelector<SVGElement>('.heatmap-cell[data-date]')?.dataset.date;
  const year = document.getElementById('filterYear') as HTMLSelectElement;
  year.add(new Option('2020', '2020'));
  year.value = '2020';
  year.dispatchEvent(new Event('change'));
  expect(document.querySelector<SVGElement>('.heatmap-cell[data-date]')?.dataset.date).toMatch(/^2019-12-/);
  year.value = '';
  year.dispatchEvent(new Event('change'));
  expect(document.querySelector<SVGElement>('.heatmap-cell[data-date]')?.dataset.date).toBe(firstDate);

  status.value = '';
  document.dispatchEvent(new CustomEvent(EVENTS.FILTERS_REQUESTED));
  expect(state.filteredOrders.map(order => order.orderId)).toEqual(['a', 'b']);
  expect(changed).toHaveBeenCalledTimes(4);
  expect(document.getElementById('pageTotal')?.textContent).toBe('2');
  document.removeEventListener(EVENTS.APPLY_FILTERS, changed);
});

afterEach(() => {
  document.body.innerHTML = '';
  state.allOrdersData = null;
});
