/** ShopeeStatX/src/dashboard/table.ts — Order Table Rendering and Pagination */
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { escapeHtml } from './utils.js';
import { t } from '../i18n/index.js';
import { formatDate } from '../i18n/format.js';
import { applyFilters, handleDrillDown } from './filters.js';
import { openDrawer } from './drawer.js';
import {
  ICON_CHECK_CIRCLE, ICON_X_CIRCLE, ICON_CLOCK, ICON_TRUCK,
  ICON_CREDIT_CARD, ICON_ARROW_UTURN_LEFT, ICON_QUESTION_MARK_CIRCLE,
} from './icons.js';
export function renderCurrentPage(): void {
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = state.itemsPerPage === Infinity
    ? state.filteredOrders.length
    : Math.min(start + state.itemsPerPage, state.filteredOrders.length);
  const pageOrders = state.filteredOrders.slice(start, end);

  const tableBody = document.getElementById('tableBody')!;
  tableBody.innerHTML = '';

  pageOrders.forEach((order: Order, index: number) => {
    const globalIndex = start + index + 1;
    const dateStr = order.deliveryDate
      ? formatDate(new Date(order.deliveryDate))
      : (order.orderPlacementDate ? formatDate(new Date(order.orderPlacementDate)) : t('table.noDate'));

    let statusIcon = '';
    let statusClass = `status-${order.statusCode}`;

    switch (order.statusCode) {
      case 3:
        statusIcon = ICON_CHECK_CIRCLE;
        statusClass += ' status-completed badge-completed';
        break;
      case 4:
        statusIcon = ICON_X_CIRCLE;
        statusClass += ' status-cancelled badge-cancelled';
        break;
      case 7:
        statusIcon = ICON_CLOCK;
        statusClass += ' status-shipping badge-shipping';
        break;
      case 8:
        statusIcon = ICON_TRUCK;
        statusClass += ' status-shipping badge-shipping';
        break;
      case 9:
        statusIcon = ICON_CREDIT_CARD;
        statusClass += ' status-pending';
        break;
      case 12:
        statusIcon = ICON_ARROW_UTURN_LEFT;
        statusClass += ' status-return';
        break;
      default:
        statusIcon = ICON_QUESTION_MARK_CIRCLE;
    }

    // Compute multi-item badge count
    let extraCount = 0;
    if (order.productCount > 1) {
      extraCount = order.productCount - 1;
    } else if (order.items && order.items.length > 1) {
      extraCount = order.items.length - 1;
    }
    const extraBadge = extraCount > 0 ? `<span class="items-pill">+${extraCount} món</span>` : '';

    const tr = document.createElement('tr');
    tr.className = 'order-row';
    tr.setAttribute('data-order-id', order.orderId);

    let dateAttrs = '';
    let dateClass = 'col-date';
    if (order.deliveryDate) {
      const dateObj = new Date(order.deliveryDate);
      const dateData = JSON.stringify({
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        day: dateObj.getDate(),
      });
      dateAttrs = `data-filter="date" data-value='${escapeHtml(dateData)}'`;
      dateClass += ' detail-value-clickable';
    }

    tr.innerHTML = `
      <td class="col-stt">${globalIndex}</td>
      <td class="${dateClass}" ${dateAttrs}>${escapeHtml(dateStr)}</td>
      <td class="col-shop">
        <div class="shop-cell">
          <span class="shop-icon" aria-hidden="true">🏪</span>
          <button type="button" class="shop-link-filter" aria-label="Lọc theo shop ${escapeHtml(order.shopName)}" title="Bấm để lọc theo shop ${escapeHtml(order.shopName)}">${escapeHtml(order.shopName)}</button>
        </div>
      </td>
      <td class="col-product" title="${escapeHtml(order.name)}">
        <span class="product-name">${escapeHtml(order.name)}</span>${extraBadge}
      </td>
      <td class="col-status text-center"><span class="status-badge ${statusClass}">${statusIcon} <span>${escapeHtml(order.status)}</span></span></td>
      <td class="col-amount">${escapeHtml(order.subTotalFormatted)}</td>
      <td class="col-action text-center">
        <button type="button" class="btn-inspect" aria-label="Xem chi tiết đơn hàng ${escapeHtml(order.orderId)}" title="Xem chi tiết đơn hàng">Xem ➔</button>
      </td>
    `;

    // Row click opens the pro-inspector drawer
    tr.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.shop-link-filter') || target.closest('.detail-value-clickable') || target.closest('a')) {
        return;
      }
      openDrawer(order);
    });

    // Shop click filters by shop name
    const shopBtn = tr.querySelector('.shop-link-filter');
    shopBtn?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const searchBox = document.getElementById('searchBox') as HTMLInputElement | null;
      if (searchBox) {
        searchBox.value = order.shopName;
      }
      state.currentPage = 1;
      applyFilters();
    });

    // Inspect button click opens drawer
    const inspectBtn = tr.querySelector('.btn-inspect');
    inspectBtn?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      openDrawer(order);
    });

    // Date click drill-down
    const dateCell = tr.querySelector('.detail-value-clickable[data-filter="date"]') as HTMLElement | null;
    dateCell?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      try {
        const dateData = JSON.parse(dateCell.dataset.value!);
        handleDrillDown({
          time: {
            kind: 'day',
            year: Number(dateData.year),
            month: Number(dateData.month),
            day: Number(dateData.day),
          },
        });
      } catch { /* malformed date — ignore */ }
    });

    tableBody.appendChild(tr);
  });

  updatePaginationInfo();
}

export function updatePaginationInfo(): void {
  const totalItems = state.filteredOrders.length;
  const totalPages = state.itemsPerPage === Infinity ? 1 : Math.ceil(totalItems / state.itemsPerPage);
  const start = totalItems === 0 ? 0 : (state.currentPage - 1) * state.itemsPerPage + 1;
  const end = state.itemsPerPage === Infinity ? totalItems : Math.min(state.currentPage * state.itemsPerPage, totalItems);

  document.getElementById('pageStart')!.textContent = String(start);
  document.getElementById('pageEnd')!.textContent = String(end);
  document.getElementById('pageTotal')!.textContent = String(totalItems);

  const pageNumbersDiv = document.getElementById('pageNumbers')!;
  pageNumbersDiv.innerHTML = '';

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbersDiv.appendChild(createPageButton(i));
    }
  } else {
    pageNumbersDiv.appendChild(createPageButton(1));
    if (state.currentPage > 3) {
      pageNumbersDiv.appendChild(document.createTextNode('...'));
    }
    for (let i = Math.max(2, state.currentPage - 1); i <= Math.min(totalPages - 1, state.currentPage + 1); i++) {
      pageNumbersDiv.appendChild(createPageButton(i));
    }
    if (state.currentPage < totalPages - 2) {
      pageNumbersDiv.appendChild(document.createTextNode('...'));
    }
    if (totalPages > 1) {
      pageNumbersDiv.appendChild(createPageButton(totalPages));
    }
  }

  (document.getElementById('btnFirstPage') as HTMLButtonElement).disabled = state.currentPage === 1;
  (document.getElementById('btnPrevPage') as HTMLButtonElement).disabled = state.currentPage === 1;
  (document.getElementById('btnNextPage') as HTMLButtonElement).disabled = state.currentPage === totalPages || totalPages === 0;
  (document.getElementById('btnLastPage') as HTMLButtonElement).disabled = state.currentPage === totalPages || totalPages === 0;
}

export function createPageButton(pageNum: number): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'btn-page-num' + (pageNum === state.currentPage ? ' active' : '');
  btn.textContent = String(pageNum);
  btn.addEventListener('click', () => {
    state.currentPage = pageNum;
    renderCurrentPage();
  });
  return btn;
}

