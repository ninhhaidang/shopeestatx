/**
 * ShopeeStatX/src/dashboard/bulk-actions.ts
 *
 * Batch Selection & Elevated Floating Bulk Action Bar for Tab 3 Order Management.
 * Manages order selection set, dynamic spend summation, scoped exports,
 * and 1-click clipboard ID copying with toast notifications.
 */

import type { Order } from '../types/index.js';
import { state } from './state.js';
import { formatCurrency, showToast } from './utils.js';
import { exportToExcel, exportToCSV } from './export.js';

/** Module-scoped set of selected order IDs */
const selectedOrderIds = new Set<string>();

/**
 * Returns the active Set of selected order IDs (read-only reference).
 */
export function getSelectedOrderIds(): Set<string> {
  return selectedOrderIds;
}

/**
 * Checks whether an order ID is currently selected.
 */
export function isSelected(orderId: string): boolean {
  return selectedOrderIds.has(orderId);
}

/**
 * Selects an order by its ID.
 */
export function selectOrder(orderId: string): void {
  selectedOrderIds.add(orderId);
}

/**
 * Deselects an order by its ID.
 */
export function deselectOrder(orderId: string): void {
  selectedOrderIds.delete(orderId);
}

/**
 * Toggles the selection state of an order ID.
 */
export function toggleSelectOrder(orderId: string, checked?: boolean): void {
  const shouldSelect = checked !== undefined ? checked : !selectedOrderIds.has(orderId);
  if (shouldSelect) {
    selectedOrderIds.add(orderId);
  } else {
    selectedOrderIds.delete(orderId);
  }
}

/**
 * Toggles selection for all filtered orders.
 * If checked is true, adds all filtered orders; if false, clears all selections.
 */
export function toggleSelectAll(checked: boolean, orders?: Order[]): void {
  const targetOrders = orders || state.filteredOrders || [];
  if (checked) {
    for (const order of targetOrders) {
      selectedOrderIds.add(order.orderId);
    }
  } else {
    selectedOrderIds.clear();
  }
}

/**
 * Clears all currently selected orders.
 */
export function clearSelection(): void {
  selectedOrderIds.clear();
}

/**
 * Resolves and returns the full Order objects corresponding to all selected IDs.
 * Searches state.allOrdersData?.orders and state.filteredOrders.
 */
export function getSelectedOrders(orders?: Order[]): Order[] {
  const pool = orders || state.allOrdersData?.orders || state.filteredOrders || [];
  return pool.filter(order => selectedOrderIds.has(order.orderId));
}

/**
 * Dynamically computes cumulative monetary sum of all currently selected orders.
 */
export function calculateSelectedTotal(orders?: Order[]): number {
  if (selectedOrderIds.size === 0) return 0;
  const pool = orders || state.allOrdersData?.orders || state.filteredOrders || [];
  let total = 0;
  for (const order of pool) {
    if (selectedOrderIds.has(order.orderId)) {
      total += order.subTotal || 0;
    }
  }
  return total;
}

/**
 * Ensures floating bulk action bar markup exists in DOM.
 */
export function ensureBulkBarInDOM(): void {
  let bar = document.getElementById('floatingBulkBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'floatingBulkBar';
    bar.className = 'floating-bulk-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Thao tác hàng loạt');
    bar.innerHTML = `
      <div class="bulk-info">
        Đã chọn <span id="bulkCount" class="bulk-count">0</span> đơn hàng
        (Tổng: <span id="bulkSum" class="bulk-sum">0 ₫</span>)
      </div>
      <div class="bulk-actions">
        <button id="btnBulkExportExcel" type="button" class="btn-bulk btn-bulk-primary" title="Xuất file Excel cho các đơn đã chọn" aria-label="Xuất file Excel cho các đơn đã chọn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>Xuất Excel</span>
        </button>
        <button id="btnBulkExportCsv" type="button" class="btn-bulk btn-bulk-subtle" title="Xuất file CSV cho các đơn đã chọn" aria-label="Xuất file CSV cho các đơn đã chọn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="17" font-size="6" font-family="sans-serif" font-weight="bold" fill="currentColor">CSV</text></svg>
          <span>Xuất CSV</span>
        </button>
        <button id="btnBulkCopyIds" type="button" class="btn-bulk btn-bulk-subtle" title="Sao chép danh sách mã đơn" aria-label="Sao chép danh sách mã đơn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Sao chép mã</span>
        </button>
        <button id="btnBulkClear" type="button" class="btn-bulk btn-bulk-cancel" title="Bỏ chọn tất cả đơn hàng" aria-label="Bỏ chọn tất cả đơn hàng">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <span>Bỏ chọn</span>
        </button>
      </div>
    `;
    document.body.appendChild(bar);
  }
}

/**
 * Synchronizes the Floating Bulk Action Bar and header #checkAll state with current selection.
 */
export function updateBulkBar(): void {
  const bar = document.getElementById('floatingBulkBar');
  const countEl = document.getElementById('bulkCount');
  const sumEl = document.getElementById('bulkSum');
  const checkAll = document.getElementById('checkAll') as HTMLInputElement | null;

  const count = selectedOrderIds.size;
  const sum = calculateSelectedTotal();

  if (countEl) {
    countEl.textContent = String(count);
  }
  if (sumEl) {
    sumEl.textContent = formatCurrency(sum);
  }

  if (bar) {
    const isTab3Active = state.activeTab === 3 || !document.getElementById('tabOrders');
    if (count > 0 && isTab3Active) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }

  // Update checkAll header checkbox
  if (checkAll) {
    const orders = state.filteredOrders || [];
    if (orders.length === 0 || count === 0) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
    } else {
      const allSelected = orders.every(o => selectedOrderIds.has(o.orderId));
      const someSelected = orders.some(o => selectedOrderIds.has(o.orderId));

      if (allSelected) {
        checkAll.checked = true;
        checkAll.indeterminate = false;
      } else if (someSelected) {
        checkAll.checked = false;
        checkAll.indeterminate = true;
      } else {
        checkAll.checked = false;
        checkAll.indeterminate = false;
      }
    }
  }
}

/**
 * Copies newline-separated selected Order IDs to clipboard with toast notification.
 */
export async function copySelectedOrderIds(): Promise<string> {
  const count = selectedOrderIds.size;
  if (count === 0) return '';

  const ids = Array.from(selectedOrderIds).join('\n');
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(ids);
      showToast(`Đã sao chép ${count} mã đơn hàng vào clipboard!`);
    } catch (err) {
      console.error('Failed to copy selected order IDs to clipboard:', err);
      showToast('Không thể sao chép mã đơn hàng');
    }
  } else {
    showToast(`Đã sao chép ${count} mã đơn hàng vào clipboard!`);
  }

  return ids;
}

/**
 * Exports strictly the currently selected orders to Excel (.xlsx).
 */
export function exportSelectedToExcel(): void {
  const selected = getSelectedOrders();
  if (selected.length === 0) return;
  exportToExcel(selected);
}

/**
 * Exports strictly the currently selected orders to CSV (.csv).
 */
export function exportSelectedToCSV(): void {
  const selected = getSelectedOrders();
  if (selected.length === 0) return;
  exportToCSV(selected);
}

/**
 * Initializes the bulk action bar event handlers and wires action buttons.
 */
export function initBulkBar(): void {
  ensureBulkBarInDOM();

  const btnExcel = document.getElementById('btnBulkExportExcel');
  if (btnExcel && !btnExcel.dataset.bound) {
    btnExcel.addEventListener('click', () => exportSelectedToExcel());
    btnExcel.dataset.bound = 'true';
  }

  const btnCsv = document.getElementById('btnBulkExportCsv');
  if (btnCsv && !btnCsv.dataset.bound) {
    btnCsv.addEventListener('click', () => exportSelectedToCSV());
    btnCsv.dataset.bound = 'true';
  }

  const btnCopy = document.getElementById('btnBulkCopyIds');
  if (btnCopy && !btnCopy.dataset.bound) {
    btnCopy.addEventListener('click', () => copySelectedOrderIds());
    btnCopy.dataset.bound = 'true';
  }

  const btnClear = document.getElementById('btnBulkClear');
  if (btnClear && !btnClear.dataset.bound) {
    btnClear.addEventListener('click', () => {
      clearSelection();
      // Uncheck all row checkboxes in DOM if present
      const checkboxes = document.querySelectorAll<HTMLInputElement>('#tableBody input.table-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = false;
      });
      updateBulkBar();
    });
    btnClear.dataset.bound = 'true';
  }

  // Header checkAll change listener
  const checkAll = document.getElementById('checkAll') as HTMLInputElement | null;
  if (checkAll && !checkAll.dataset.bound) {
    checkAll.addEventListener('change', (e: Event) => {
      const checked = (e.target as HTMLInputElement).checked;
      toggleSelectAll(checked);
      // Sync row checkboxes in DOM
      const checkboxes = document.querySelectorAll<HTMLInputElement>('#tableBody input.table-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = checked;
      });
      updateBulkBar();
    });
    checkAll.dataset.bound = 'true';
  }
}
