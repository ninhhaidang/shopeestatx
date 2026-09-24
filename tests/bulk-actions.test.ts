import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state } from '../src/dashboard/state.js';
import type { Order } from '../src/types/index.js';
import {
  getSelectedOrderIds,
  selectOrder,
  deselectOrder,
  toggleSelectOrder,
  toggleSelectAll,
  clearSelection,
  isSelected,
  getSelectedOrders,
  calculateSelectedTotal,
  updateBulkBar,
  initBulkBar,
  copySelectedOrderIds,
  exportSelectedToExcel,
  exportSelectedToCSV,
  ensureBulkBarInDOM,
} from '../src/dashboard/bulk-actions.js';
import { renderCurrentPage } from '../src/dashboard/table.js';
import { isDrawerOpen } from '../src/dashboard/drawer.js';
import * as utils from '../src/dashboard/utils.js';
import * as exportModule from '../src/dashboard/export.js';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'ORD-001',
    name: 'Áo thun thể thao nam cao cấp',
    productCount: 1,
    subTotal: 250000,
    subTotalFormatted: '250.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop Thể Thao Nam',
    productSummary: 'Áo thun thể thao nam cao cấp (SL: 1, Giá: 250.000 ₫)',
    deliveryDate: '2026-09-20T10:00:00.000Z',
    orderMonth: 9,
    orderYear: 2026,
    ...overrides,
  };
}

describe('Tab 3 Bulk Actions & Scoped Batch Export (Issue #13)', () => {
  let mockOrders: Order[];

  beforeEach(() => {
    mockOrders = [
      createMockOrder({ orderId: 'ORD-001', subTotal: 250000, shopName: 'Shop A' }),
      createMockOrder({ orderId: 'ORD-002', subTotal: 450000, shopName: 'Shop B' }),
      createMockOrder({ orderId: 'ORD-003', subTotal: 150000, shopName: 'Shop C' }),
      createMockOrder({ orderId: 'ORD-004', subTotal: 300000, shopName: 'Shop D' }),
    ];

    document.body.innerHTML = `
      <input id="searchBox" value="" />
      <select id="filterStatus"><option value="">Tất cả</option></select>
      <div class="table-container">
        <table id="ordersTable">
          <thead>
            <tr>
              <th width="40" class="col-select"><input type="checkbox" id="checkAll" class="table-checkbox" aria-label="Chọn tất cả"></th>
              <th width="50" class="col-stt">STT</th>
              <th width="110" class="sortable" data-sort="deliveryDate">Ngày giao</th>
              <th width="180">Shop / Người bán</th>
              <th>Sản phẩm</th>
              <th width="140" class="sortable text-center" data-sort="status">Trạng thái</th>
              <th width="110" class="sortable col-amount" data-sort="subTotal">Tổng tiền</th>
              <th width="70" class="text-center">Chi tiết</th>
            </tr>
          </thead>
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

      <!-- Floating Bulk Action Bar -->
      <div id="floatingBulkBar" class="floating-bulk-bar" role="toolbar" aria-label="Thao tác hàng loạt">
        <div class="bulk-info">
          Đã chọn <span id="bulkCount" class="bulk-count">0</span> đơn hàng
          (Tổng: <span id="bulkSum" class="bulk-sum">0 ₫</span>)
        </div>
        <div class="bulk-actions">
          <button id="btnBulkExportExcel" type="button" class="btn-bulk btn-bulk-primary" title="Xuất Excel">Xuất Excel</button>
          <button id="btnBulkExportCsv" type="button" class="btn-bulk btn-bulk-subtle" title="Xuất CSV">Xuất CSV</button>
          <button id="btnBulkCopyIds" type="button" class="btn-bulk btn-bulk-subtle" title="Sao chép mã">Sao chép mã</button>
          <button id="btnBulkClear" type="button" class="btn-bulk btn-bulk-cancel" title="Bỏ chọn">Bỏ chọn</button>
        </div>
      </div>

      <!-- Slide-Over Drawer Elements for integration testing -->
      <div id="drawerBackdrop" class="drawer-backdrop"></div>
      <aside id="orderDrawer" class="drawer-panel" aria-label="Chi tiết đơn hàng" role="dialog" aria-modal="true">
        <span class="drawer-order-id" id="drawerOrderId">--</span>
      </aside>
    `;

    state.filteredOrders = [...mockOrders];
    state.allOrdersData = {
      orders: [...mockOrders],
      statistics: {
        totalOrders: 4,
        totalSpent: 1150000,
        totalProducts: 4,
        totalShipping: 0,
        completedOrders: 4,
        cancelledOrders: 0,
        returnedOrders: 0,
        shippingOrders: 0,
        pendingOrders: 0,
        avgOrderValue: 287500,
        ordersByYear: {},
        ordersByMonth: {},
        ordersByStatus: {},
        topShops: [],
        monthlySpending: {},
      },
      userProfile: { username: 'test_user', avatarUrl: '' },
    };
    state.currentPage = 1;
    state.itemsPerPage = 20;
    state.activeTab = 3;

    clearSelection();
    initBulkBar();

    // Mock URL for exports
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    clearSelection();
    vi.restoreAllMocks();
  });

  describe('Seam 1: Selection State & Dynamic Spending Aggregation', () => {
    it('manages selection set via selectOrder, deselectOrder, toggleSelectOrder, and clearSelection', () => {
      expect(getSelectedOrderIds().size).toBe(0);
      expect(isSelected('ORD-001')).toBe(false);

      selectOrder('ORD-001');
      expect(isSelected('ORD-001')).toBe(true);
      expect(getSelectedOrderIds().has('ORD-001')).toBe(true);
      expect(getSelectedOrderIds().size).toBe(1);

      // Duplicate select does not create duplicate
      selectOrder('ORD-001');
      expect(getSelectedOrderIds().size).toBe(1);

      // Toggle select
      toggleSelectOrder('ORD-002');
      expect(isSelected('ORD-002')).toBe(true);
      expect(getSelectedOrderIds().size).toBe(2);

      toggleSelectOrder('ORD-002', false);
      expect(isSelected('ORD-002')).toBe(false);
      expect(getSelectedOrderIds().size).toBe(1);

      // Deselect
      deselectOrder('ORD-001');
      expect(isSelected('ORD-001')).toBe(false);
      expect(getSelectedOrderIds().size).toBe(0);

      // Select multiple and clear
      selectOrder('ORD-001');
      selectOrder('ORD-002');
      expect(getSelectedOrderIds().size).toBe(2);
      clearSelection();
      expect(getSelectedOrderIds().size).toBe(0);
    });

    it('calculates dynamic aggregate sum for selected orders accurately', () => {
      selectOrder('ORD-001'); // 250,000
      expect(calculateSelectedTotal()).toBe(250000);

      selectOrder('ORD-002'); // 450,000
      expect(calculateSelectedTotal()).toBe(700000);

      selectOrder('ORD-003'); // 150,000
      expect(calculateSelectedTotal()).toBe(850000);

      deselectOrder('ORD-001');
      expect(calculateSelectedTotal()).toBe(600000);
    });

    it('toggleSelectAll selects all filtered orders or clears all selections', () => {
      toggleSelectAll(true);
      expect(getSelectedOrderIds().size).toBe(4);
      expect(isSelected('ORD-001')).toBe(true);
      expect(isSelected('ORD-002')).toBe(true);
      expect(isSelected('ORD-003')).toBe(true);
      expect(isSelected('ORD-004')).toBe(true);
      expect(calculateSelectedTotal()).toBe(1150000);

      toggleSelectAll(false);
      expect(getSelectedOrderIds().size).toBe(0);
      expect(calculateSelectedTotal()).toBe(0);
    });

    it('getSelectedOrders retrieves strictly the Order objects of selected IDs', () => {
      selectOrder('ORD-001');
      selectOrder('ORD-003');

      const selected = getSelectedOrders();
      expect(selected.length).toBe(2);
      expect(selected.map(o => o.orderId)).toEqual(['ORD-001', 'ORD-003']);
      expect(selected[0].shopName).toBe('Shop A');
      expect(selected[1].shopName).toBe('Shop C');
    });
  });

  describe('Seam 2: Table Checkbox Rendering & Event Isolation', () => {
    it('renders row checkboxes for each order with proper checked attribute', () => {
      selectOrder('ORD-002');
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const rows = tableBody.querySelectorAll('tr.order-row');
      expect(rows.length).toBe(4);

      const checkboxes = tableBody.querySelectorAll<HTMLInputElement>('input.table-checkbox');
      expect(checkboxes.length).toBe(4);

      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true); // ORD-002 was selected
      expect(checkboxes[2].checked).toBe(false);
      expect(checkboxes[3].checked).toBe(false);
    });

    it('checking a row checkbox updates selection set and updates bulk bar', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const firstCheckbox = tableBody.querySelector<HTMLInputElement>('input.table-checkbox')!;

      firstCheckbox.checked = true;
      firstCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(isSelected('ORD-001')).toBe(true);
      const bulkCount = document.getElementById('bulkCount')!;
      expect(bulkCount.textContent).toBe('1');
    });

    it('clicking row checkbox or col-select does NOT open the pro-inspector drawer', () => {
      renderCurrentPage();

      const tableBody = document.getElementById('tableBody')!;
      const firstRow = tableBody.querySelectorAll('tr.order-row')[0];
      const checkbox = firstRow.querySelector<HTMLInputElement>('input.table-checkbox')!;

      // Click on checkbox
      checkbox.click();
      expect(isDrawerOpen()).toBe(false);

      // Click on col-select td
      const selectCell = firstRow.querySelector('td.col-select') as HTMLElement;
      selectCell.click();
      expect(isDrawerOpen()).toBe(false);
    });

    it('header checkAll checkbox reflects selection: unchecked, indeterminate, or checked', () => {
      renderCurrentPage();
      const checkAll = document.getElementById('checkAll') as HTMLInputElement;

      // When 0 selected: unchecked, not indeterminate
      expect(checkAll.checked).toBe(false);
      expect(checkAll.indeterminate).toBe(false);

      // When 1 selected out of 4: indeterminate
      selectOrder('ORD-001');
      updateBulkBar();
      expect(checkAll.checked).toBe(false);
      expect(checkAll.indeterminate).toBe(true);

      // When all 4 selected: checked, not indeterminate
      selectOrder('ORD-002');
      selectOrder('ORD-003');
      selectOrder('ORD-004');
      updateBulkBar();
      expect(checkAll.checked).toBe(true);
      expect(checkAll.indeterminate).toBe(false);

      // Clear all: unchecked, not indeterminate
      clearSelection();
      updateBulkBar();
      expect(checkAll.checked).toBe(false);
      expect(checkAll.indeterminate).toBe(false);
    });

    it('toggling header checkAll selects or deselects all filtered orders', () => {
      renderCurrentPage();
      const checkAll = document.getElementById('checkAll') as HTMLInputElement;

      checkAll.checked = true;
      checkAll.dispatchEvent(new Event('change', { bubbles: true }));

      expect(getSelectedOrderIds().size).toBe(4);
      const bulkCount = document.getElementById('bulkCount')!;
      expect(bulkCount.textContent).toBe('4');

      checkAll.checked = false;
      checkAll.dispatchEvent(new Event('change', { bubbles: true }));

      expect(getSelectedOrderIds().size).toBe(0);
      expect(bulkCount.textContent).toBe('0');
    });
  });

  describe('Seam 3: Floating Bulk Action Bar Lifecycle & UI State', () => {
    it('appears with visible class when >= 1 order is selected, and disappears when cleared', () => {
      const bar = document.getElementById('floatingBulkBar')!;
      expect(bar.classList.contains('visible')).toBe(false);

      selectOrder('ORD-001');
      updateBulkBar();
      expect(bar.classList.contains('visible')).toBe(true);

      deselectOrder('ORD-001');
      updateBulkBar();
      expect(bar.classList.contains('visible')).toBe(false);
    });

    it('displays selected order count and dynamically formatted aggregate spend', () => {
      const countEl = document.getElementById('bulkCount')!;
      const sumEl = document.getElementById('bulkSum')!;

      selectOrder('ORD-001'); // 250,000
      selectOrder('ORD-002'); // 450,000
      updateBulkBar();

      expect(countEl.textContent).toBe('2');
      // Format should contain 700.000
      expect(sumEl.textContent).toContain('700.000');

      selectOrder('ORD-003'); // +150,000 = 850,000
      updateBulkBar();
      expect(countEl.textContent).toBe('3');
      expect(sumEl.textContent).toContain('850.000');
    });

    it('clicking btnBulkClear clears selections, unchecks checkAll, and hides bulk bar', () => {
      renderCurrentPage();
      const bar = document.getElementById('floatingBulkBar')!;
      const clearBtn = document.getElementById('btnBulkClear') as HTMLButtonElement;
      const checkAll = document.getElementById('checkAll') as HTMLInputElement;

      selectOrder('ORD-001');
      selectOrder('ORD-002');
      updateBulkBar();
      expect(bar.classList.contains('visible')).toBe(true);

      clearBtn.click();

      expect(getSelectedOrderIds().size).toBe(0);
      expect(bar.classList.contains('visible')).toBe(false);
      expect(checkAll.checked).toBe(false);
      expect(checkAll.indeterminate).toBe(false);
    });
    it('hides floating bulk bar when switching away from Tab 3 and reappears on Tab 3', () => {
      const tabOrders = document.createElement('section');
      tabOrders.id = 'tabOrders';
      document.body.appendChild(tabOrders);

      selectOrder('ORD-001');
      state.activeTab = 3;
      updateBulkBar();
      const bar = document.getElementById('floatingBulkBar')!;
      expect(bar.classList.contains('visible')).toBe(true);

      state.activeTab = 1;
      updateBulkBar();
      expect(bar.classList.contains('visible')).toBe(false);

      state.activeTab = 3;
      updateBulkBar();
      expect(bar.classList.contains('visible')).toBe(true);
    });
  });

  describe('Seam 4: Scoped Batch Export (Excel & CSV)', () => {
    it('exportSelectedToExcel delegates to exportToExcel with strictly selected orders', () => {
      const exportExcelSpy = vi.spyOn(exportModule, 'exportToExcel').mockImplementation(() => {});

      selectOrder('ORD-002');
      selectOrder('ORD-003');

      exportSelectedToExcel();

      expect(exportExcelSpy).toHaveBeenCalledTimes(1);
      const passedOrders = exportExcelSpy.mock.calls[0][0];
      expect(passedOrders).toBeDefined();
      expect(passedOrders?.length).toBe(2);
      expect(passedOrders?.map(o => o.orderId)).toEqual(['ORD-002', 'ORD-003']);
    });

    it('exportSelectedToCSV delegates to exportToCSV with strictly selected orders', () => {
      const exportCsvSpy = vi.spyOn(exportModule, 'exportToCSV').mockImplementation(() => {});

      selectOrder('ORD-001');
      selectOrder('ORD-004');

      exportSelectedToCSV();

      expect(exportCsvSpy).toHaveBeenCalledTimes(1);
      const passedOrders = exportCsvSpy.mock.calls[0][0];
      expect(passedOrders).toBeDefined();
      expect(passedOrders?.length).toBe(2);
      expect(passedOrders?.map(o => o.orderId)).toEqual(['ORD-001', 'ORD-004']);
    });

    it('scoped export does nothing when no orders are selected', () => {
      const exportExcelSpy = vi.spyOn(exportModule, 'exportToExcel').mockImplementation(() => {});
      const exportCsvSpy = vi.spyOn(exportModule, 'exportToCSV').mockImplementation(() => {});

      exportSelectedToExcel();
      exportSelectedToCSV();

      expect(exportExcelSpy).not.toHaveBeenCalled();
      expect(exportCsvSpy).not.toHaveBeenCalled();
    });

    it('exportToCSV with custom orders generates scoped CSV and triggers download', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const selectedSubset = [mockOrders[0], mockOrders[2]];

      exportModule.exportToCSV(selectedSubset);

      expect(appendChildSpy).toHaveBeenCalled();
      const createdLink = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(createdLink.tagName).toBe('A');
      expect(createdLink.download).toMatch(/^shopee-stats-.*\.csv$/);
    });
  });

  describe('Seam 5: 1-Click Clipboard Copy of Order IDs', () => {
    it('copies newline-separated order IDs to clipboard and shows toast feedback', async () => {
      const showToastSpy = vi.spyOn(utils, 'showToast').mockImplementation(() => {});
      let writtenText = '';

      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation((text: string) => {
            writtenText = text;
            return Promise.resolve();
          }),
        },
      });

      selectOrder('ORD-001');
      selectOrder('ORD-003');

      await copySelectedOrderIds();

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(writtenText).toBe('ORD-001\nORD-003');
      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('2 mã đơn'));
    });

    it('handles single order copy gracefully', async () => {
      vi.spyOn(utils, 'showToast').mockImplementation(() => {});
      let writtenText = '';

      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation((text: string) => {
            writtenText = text;
            return Promise.resolve();
          }),
        },
      });

      selectOrder('ORD-004');

      await copySelectedOrderIds();

      expect(writtenText).toBe('ORD-004');
    });

    it('does not copy or call clipboard when no orders are selected', async () => {
      const writeTextMock = vi.fn();
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

      await copySelectedOrderIds();

      expect(writeTextMock).not.toHaveBeenCalled();
    });
    it('shows error toast if clipboard write fails', async () => {
      const showToastSpy = vi.spyOn(utils, 'showToast').mockImplementation(() => {});
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
        },
      });

      selectOrder('ORD-001');
      await copySelectedOrderIds();

      expect(showToastSpy).toHaveBeenCalledWith('Không thể sao chép mã đơn hàng');
    });
  });

  describe('Seam 6: DOM Structure in results.html and Accessibility', () => {
    it('results.html contains floating bulk action bar and header select checkbox', () => {
      const htmlPath = path.resolve(__dirname, '../src/dashboard/results.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const bulkBar = doc.getElementById('floatingBulkBar');
      expect(bulkBar).not.toBeNull();
      expect(bulkBar?.getAttribute('role')).toBe('toolbar');
      expect(bulkBar?.getAttribute('aria-label')).toBeTruthy();

      expect(doc.getElementById('bulkCount')).not.toBeNull();
      expect(doc.getElementById('bulkSum')).not.toBeNull();
      expect(doc.getElementById('btnBulkExportExcel')).not.toBeNull();
      expect(doc.getElementById('btnBulkExportCsv')).not.toBeNull();
      expect(doc.getElementById('btnBulkCopyIds')).not.toBeNull();
      expect(doc.getElementById('btnBulkClear')).not.toBeNull();

      const checkAll = doc.getElementById('checkAll');
      expect(checkAll).not.toBeNull();
      expect(checkAll?.getAttribute('type')).toBe('checkbox');
    });
  });
});
