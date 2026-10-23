import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderCurrentPage } from '../src/dashboard/table';
import { state } from '../src/dashboard/state';
import { applyFilters } from '../src/dashboard/filters';
import type { Order } from '../src/types';

vi.mock('../src/dashboard/filters', () => ({ applyFilters: vi.fn() }));

function makeOrder(orderId: string): Order {
  return {
    orderId, name: 'Test product', productCount: 1, subTotal: 100_000,
    subTotalFormatted: '100.000 ₫', status: 'Hoàn thành', statusCode: 3,
    shopName: 'Test shop', productSummary: 'Test product',
    deliveryDate: '2025-01-15T00:00:00.000Z', orderMonth: 1, orderYear: 2025,
  };
}

describe('table pagination', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <table><tbody id="tableBody"></tbody></table>
      <span id="pageStart"></span><span id="pageEnd"></span><span id="pageTotal"></span>
      <div id="pageNumbers"></div>
      <button id="btnFirstPage"></button><button id="btnPrevPage"></button>
      <button id="btnNextPage"></button><button id="btnLastPage"></button>
    `;
    state.filteredOrders = [makeOrder('first'), makeOrder('second'), makeOrder('third')];
    state.currentPage = 1;
    state.itemsPerPage = Infinity;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    state.filteredOrders = [];
    state.currentPage = 1;
    state.itemsPerPage = 20;
    state.selectedDay = null;
    document.body.innerHTML = '';
  });

  it('numbers every row and shows finite totals when displaying all orders', () => {
    renderCurrentPage();

    expect(Array.from(document.querySelectorAll('.order-row .col-stt'), el => el.textContent?.trim()))
      .toEqual(['1', '2', '3']);
    expect(document.getElementById('pageStart')?.textContent).toBe('1');
    expect(document.getElementById('pageEnd')?.textContent).toBe('3');
    expect(document.getElementById('pageTotal')?.textContent).toBe('3');
    for (const button of document.querySelectorAll<HTMLButtonElement>('button[id]')) {
      expect(button.disabled).toBe(true);
    }
  });

  it('builds only summary rows until an order is opened, then reuses its details', () => {
    renderCurrentPage();
    const body = document.getElementById('tableBody')!;
    const rows = body.querySelectorAll<HTMLTableRowElement>('.order-row');
    expect(body.children).toHaveLength(3);
    expect(body.querySelector('.detail-content')).toBeNull();

    rows[1].querySelector<HTMLElement>('.col-stt')!.click();
    const detail = rows[1].nextElementSibling!;
    expect(body.children).toHaveLength(4);
    expect(detail.classList.contains('show')).toBe(true);
    expect(rows[1].classList.contains('expanded')).toBe(true);
    expect(detail.querySelector('.order-link')?.textContent).toBe('second');
    expect(detail.nextElementSibling).toBe(rows[2]);
    expect(body.querySelectorAll('.detail-content')).toHaveLength(1);

    rows[1].click();
    expect(detail.classList.contains('show')).toBe(false);
    expect(rows[1].classList.contains('expanded')).toBe(false);
    rows[1].click();
    expect(rows[1].nextElementSibling).toBe(detail);
    expect(detail.classList.contains('show')).toBe(true);
    expect(body.children).toHaveLength(4);

    rows[0].click();
    expect(body.querySelectorAll('.detail-content')).toHaveLength(2);
    renderCurrentPage();
    expect(body.children).toHaveLength(3);
    expect(body.querySelector('.detail-content')).toBeNull();
  });

  it('does not expand an order when its link is clicked', () => {
    renderCurrentPage();
    const link = document.querySelector<HTMLAnchorElement>('.order-link')!;
    link.addEventListener('click', event => event.preventDefault());
    link.click();
    expect(document.querySelector('.expanded')).toBeNull();
    expect(document.querySelector('.detail-content')).toBeNull();
  });

  it('keeps status, shop, and date filters working in lazily opened details', () => {
    document.body.insertAdjacentHTML('beforeend', `
      <select id="filterStatus"><option value="">All</option><option value="3">Completed</option></select>
      <input id="searchBox">
      <select id="filterYear"><option value="">All</option><option value="2025">2025</option></select>
      <select id="filterMonth"><option value="">All</option><option value="1">January</option></select>
    `);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    state.filteredOrders[0].deliveryDate = '2025-01-15T12:00:00';
    renderCurrentPage();
    const row = document.querySelector<HTMLTableRowElement>('.order-row')!;
    row.click();
    const detail = row.nextElementSibling!;

    detail.querySelector<HTMLElement>('[data-filter="status"]')!.click();
    expect(document.querySelector<HTMLSelectElement>('#filterStatus')!.value).toBe('3');
    detail.querySelector<HTMLElement>('[data-filter="shop"]')!.click();
    expect(document.querySelector<HTMLInputElement>('#searchBox')!.value).toBe('Test shop');
    detail.querySelector<HTMLElement>('[data-filter="date"]')!.click();
    expect(document.querySelector<HTMLSelectElement>('#filterYear')!.value).toBe('2025');
    expect(document.querySelector<HTMLSelectElement>('#filterMonth')!.value).toBe('1');
    expect(state.selectedDay).toBe(15);
    expect(applyFilters).toHaveBeenCalledTimes(3);
    expect(detail.classList.contains('show')).toBe(true);
  });

  it('keeps finite-page offsets when navigating subsequent pages', () => {
    state.itemsPerPage = 2;
    state.currentPage = 2;
    renderCurrentPage();

    expect(Array.from(document.querySelectorAll('.order-row .col-stt'), el => el.textContent?.trim()))
      .toEqual(['3']);
    expect(document.getElementById('pageStart')?.textContent).toBe('3');
    expect(document.getElementById('pageEnd')?.textContent).toBe('3');
  });

  it('shows zero range for an empty all-orders view', () => {
    state.filteredOrders = [];
    renderCurrentPage();

    expect(document.querySelectorAll('.order-row')).toHaveLength(0);
    expect(document.getElementById('pageStart')?.textContent).toBe('0');
    expect(document.getElementById('pageEnd')?.textContent).toBe('0');
  });
});
