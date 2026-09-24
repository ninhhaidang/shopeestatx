import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../src/dashboard/state.js';
import type { Order, FilterCriteria } from '../src/types/index.js';
import { updateEmptyState, clearAllFilters, applyFilters } from '../src/dashboard/filters.js';

function createMockOrder(id: string): Order {
  return {
    orderId: id,
    name: `Sản phẩm ${id}`,
    productCount: 1,
    subTotal: 100000,
    subTotalFormatted: '100.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop A',
    productSummary: `Sản phẩm ${id}`,
    deliveryDate: '2026-09-20T10:00:00.000Z',
    orderMonth: 9,
    orderYear: 2026,
  };
}

describe('Contextual Friendly Empty State & 1-Click Reset (Issue #14)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterYear"><option value="">Tất cả năm</option><option value="2026" selected>2026</option></select>
      <select id="filterMonth"><option value="" selected>Tất cả tháng</option><option value="9">Tháng 9</option></select>
      <select id="filterStatus"><option value="" selected>Tất cả</option><option value="Hoàn thành">Hoàn thành</option></select>
      <select id="filterCategory"><option value="" selected>Tất cả danh mục</option><option value="electronics">Điện tử</option></select>
      <input id="searchBox" value="" />
      <div id="activeFilters"></div>
      <button id="btnClearFilters">Xóa</button>

      <div class="table-container">
        <div id="emptyState" class="empty-state hidden">
          <div class="empty-icon"></div>
          <div class="empty-title">Không tìm thấy đơn hàng nào</div>
          <div class="empty-message">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
          <button id="btnResetFilters" class="btn-reset">Đặt lại bộ lọc</button>
        </div>
        <table id="ordersTable" class="modern-table">
          <tbody id="tableBody"></tbody>
        </table>
        <div id="paginationContainer">
          <span id="pageStart">0</span>
          <span id="pageEnd">0</span>
          <span id="pageTotal">0</span>
          <div id="pageNumbers"></div>
          <button id="btnFirstPage"></button>
          <button id="btnPrevPage"></button>
          <button id="btnNextPage"></button>
          <button id="btnLastPage"></button>
        </div>
      </div>
    `;

    state.allOrdersData = {
      user: null,
      orders: [createMockOrder('ORD-1'), createMockOrder('ORD-2')],
      totalCount: 2,
      totalAmount: 200000,
      totalAmountFormatted: '200.000 ₫',
      fetchedAt: '2026-09-24T00:00:00.000Z',
    };
    state.filteredOrders = [...state.allOrdersData.orders];
    state.criteria = {
      time: { kind: 'all' },
      searchTerm: null,
      status: null,
      category: null,
    };
  });

  describe('Seam 4: Contextual Empty State & 1-Click Reset Action', () => {
    it('shows emptyState and hides ordersTable when filtered orders count is 0', () => {
      const criteria: FilterCriteria = {
        time: { kind: 'all' },
        searchTerm: 'nonexistent-item',
        status: null,
        category: null,
      };

      updateEmptyState(0, criteria);

      const emptyState = document.getElementById('emptyState')!;
      const ordersTable = document.getElementById('ordersTable')!;
      const paginationContainer = document.getElementById('paginationContainer')!;

      expect(emptyState.classList.contains('hidden')).toBe(false);
      expect(ordersTable.classList.contains('hidden')).toBe(true);
      expect(paginationContainer.classList.contains('hidden')).toBe(true);
    });

    it('contextualizes empty message with active search term', () => {
      const criteria: FilterCriteria = {
        time: { kind: 'all' },
        searchTerm: 'Áo khoác gió',
        status: null,
        category: null,
      };

      updateEmptyState(0, criteria);

      const emptyMessage = document.querySelector('#emptyState .empty-message')!;
      expect(emptyMessage.textContent).toContain('Áo khoác gió');
    });

    it('contextualizes empty message with active filter criteria (status, category, year)', () => {
      const criteria: FilterCriteria = {
        time: { kind: 'year', year: 2025 },
        status: 'Đã hủy',
        category: 'electronics',
      };

      updateEmptyState(0, criteria);

      const emptyMessage = document.querySelector('#emptyState .empty-message')!;
      expect(emptyMessage.textContent).toMatch(/Đã hủy|electronics|2025/);
    });

    it('hides emptyState and displays ordersTable when orders exist', () => {
      const criteria: FilterCriteria = { time: { kind: 'all' } };
      updateEmptyState(2, criteria);

      const emptyState = document.getElementById('emptyState')!;
      const ordersTable = document.getElementById('ordersTable')!;
      const paginationContainer = document.getElementById('paginationContainer')!;

      expect(emptyState.classList.contains('hidden')).toBe(true);
      expect(ordersTable.classList.contains('hidden')).toBe(false);
      expect(paginationContainer.classList.contains('hidden')).toBe(false);
    });

    it('clicking single-click reset button invokes clearAllFilters and resets state', () => {
      state.criteria = {
        time: { kind: 'year', year: 2026 },
        searchTerm: 'search query',
        status: 'Hoàn thành',
      };

      const searchBox = document.getElementById('searchBox') as HTMLInputElement;
      searchBox.value = 'search query';

      const btnReset = document.getElementById('btnResetFilters')!;
      btnReset.addEventListener('click', clearAllFilters);
      btnReset.click();

      expect(searchBox.value).toBe('');
      expect(state.criteria.searchTerm).toBeNull();
      expect(state.criteria.status).toBeNull();
      expect(state.criteria.category).toBeNull();
      expect(state.criteria.time).toEqual({ kind: 'all' });
    });
  });
});
