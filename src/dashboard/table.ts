// Table rendering, pagination, and expandable row details
import type { Order } from '../types/index.js';
import { state } from './state.js';
import { escapeHtml } from './utils.js';
import { t } from '../i18n/index.js';
import { formatDate, formatDateTime } from '../i18n/format.js';
import { applyFilters } from './filters.js';
import {
  ICON_CHECK_CIRCLE, ICON_X_CIRCLE, ICON_CLOCK, ICON_TRUCK,
  ICON_CREDIT_CARD, ICON_ARROW_UTURN_LEFT, ICON_QUESTION_MARK_CIRCLE,
  ICON_CHEVRON_DOWN,
} from './icons.js';
import { getOrderUrl } from '../config.js';

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
    const dateStr = order.deliveryDate ? formatDate(new Date(order.deliveryDate)) : t('table.noDate');

    let statusIcon = '';
    let statusClass = `status-${order.statusCode}`;

    switch (order.statusCode) {
      case 3: statusIcon = ICON_CHECK_CIRCLE; break;
      case 4: statusIcon = ICON_X_CIRCLE; statusClass += ' status-cancelled'; break;
      case 7: statusIcon = ICON_CLOCK; statusClass += ' status-shipping'; break;
      case 8: statusIcon = ICON_TRUCK; statusClass += ' status-shipping'; break;
      case 9: statusIcon = ICON_CREDIT_CARD; break;
      case 12: statusIcon = ICON_ARROW_UTURN_LEFT; statusClass += ' status-return'; break;
      default: statusIcon = ICON_QUESTION_MARK_CIRCLE;
    }

    const tr = document.createElement('tr');
    tr.className = 'order-row';
    const safeOrderId = escapeHtml(String(order.orderId));
    tr.innerHTML = `
        <td><span class="expand-icon">${ICON_CHEVRON_DOWN}</span> ${globalIndex}</td>
        <td><a href="${getOrderUrl(safeOrderId)}" class="order-link" target="_blank" onclick="event.stopPropagation()">${safeOrderId}</a></td>
        <td>${escapeHtml(dateStr)}</td>
        <td><span class="status-badge ${statusClass}">${statusIcon} ${escapeHtml(order.status)}</span></td>
        <td title="${escapeHtml(order.name)}">${escapeHtml(order.name)}</td>
        <td style="text-align: center;">${order.productCount}</td>
        <td>${escapeHtml(order.subTotalFormatted)}</td>
      `;

    // Left column: Order Information
    const orderInfoItems: string[] = [];
    orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.orderId')}:</strong> ${safeOrderId}</div>`);
    orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.status')}:</strong> <span class="detail-value-clickable" data-filter="status" data-value="${order.statusCode}">${statusIcon} ${escapeHtml(order.status)}</span></div>`);

    // Order date
    const orderDateStr = formatOrderDate(order.orderMonth, order.orderYear);
    if (orderDateStr !== '-') {
      orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.orderDate') || 'Order Date'}:</strong> ${orderDateStr}</div>`);
    }

    // Delivery date with clickable filter
    if (order.deliveryDate) {
      const fullDate = formatDateTime(new Date(order.deliveryDate));
      const dateObj = new Date(order.deliveryDate);
      const dateData = JSON.stringify({ year: dateObj.getFullYear(), month: dateObj.getMonth() + 1, day: dateObj.getDate() });
      orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.deliveryDate')}:</strong> <span class="detail-value-clickable" data-filter="date" data-value='${dateData}'>${fullDate}</span></div>`);

      // Days to deliver
      const daysToDeliver = calculateDaysToDeliver(order.orderMonth, order.orderYear, order.deliveryDate);
      if (daysToDeliver !== null) {
        orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.daysToDeliver') || 'Days to Deliver'}:</strong> ${daysToDeliver} ${t('table.detail.days') || 'days'}</div>`);
      }
    }

    orderInfoItems.push(`<div class="detail-item"><strong>${t('table.detail.seller')}:</strong> <span class="detail-value-clickable" data-filter="shop" data-value="${escapeHtml(order.shopName)}">${escapeHtml(order.shopName)}</span></div>`);

    // Right column: Product Details
    const productItems: string[] = [];
    productItems.push(`<div class="detail-item"><strong>${t('table.detail.productName')}:</strong> ${escapeHtml(order.name)}</div>`);
    productItems.push(`<div class="detail-item"><strong>${t('table.detail.quantity')}:</strong> ${order.productCount}</div>`);
    productItems.push(`<div class="detail-item"><strong>${t('table.detail.total')}:</strong> ${escapeHtml(order.subTotalFormatted)}</div>`);
    productItems.push(`<div class="detail-item"><strong>${t('table.detail.productDetail')}:</strong> ${escapeHtml(order.productSummary)}</div>`);

    const detailRow = document.createElement('tr');
    detailRow.className = 'detail-row';
    detailRow.innerHTML = `
        <td colspan="7">
          <div class="detail-content">
            <div class="detail-section">
              <div class="detail-section-header">${t('table.detail.orderInfo') || 'ORDER INFORMATION'}</div>
              ${orderInfoItems.join('')}
            </div>
            <div class="detail-section">
              <div class="detail-section-header">${t('table.detail.productDetails') || 'PRODUCT DETAILS'}</div>
              ${productItems.join('')}
            </div>
          </div>
        </td>
      `;

    tr.addEventListener('click', function (e: MouseEvent) {
      if ((e.target as HTMLElement).classList.contains('detail-value-clickable')) return;
      tr.classList.toggle('expanded');
      detailRow.classList.toggle('show');
    });

    detailRow.querySelectorAll('.detail-value-clickable').forEach(el => {
      el.addEventListener('click', function (this: HTMLElement, e: Event) {
        e.stopPropagation();
        const filterType = this.dataset.filter;
        const filterValue = this.dataset.value;

        if (filterType === 'status') {
          (document.getElementById('filterStatus') as HTMLSelectElement).value = filterValue!;
          applyFilters();
        } else if (filterType === 'shop') {
          (document.getElementById('searchBox') as HTMLInputElement).value = filterValue!;
          applyFilters();
        } else if (filterType === 'date') {
          try {
            const dateData = JSON.parse(filterValue!);
            (document.getElementById('filterYear') as HTMLSelectElement).value = dateData.year;
            (document.getElementById('filterMonth') as HTMLSelectElement).value = dateData.month;
            state.selectedDay = dateData.day;
            applyFilters();
          } catch { /* malformed date attribute — ignore click */ }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tableBody.appendChild(tr);
    tableBody.appendChild(detailRow);
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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function formatOrderDate(month: number | null, year: number | null): string {
  if (!month || !year) return '-';
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function calculateDaysToDeliver(
  orderMonth: number | null,
  orderYear: number | null,
  deliveryDate: string | null
): number | null {
  if (!orderMonth || !orderYear || !deliveryDate) return null;

  const orderDate = new Date(orderYear, orderMonth - 1, 1);
  const delivery = new Date(deliveryDate);
  const diffTime = delivery.getTime() - orderDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}
