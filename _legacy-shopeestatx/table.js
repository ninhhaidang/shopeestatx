// ShopeeStatX/table.js
import { state } from './state.js';
import { escapeHtml, formatVND } from './utils.js';
import { applyFilters } from './filters.js'; // Circular import — safe: applyFilters called only inside click event handlers, not at eval time

export function renderCurrentPage() {
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = state.itemsPerPage === Infinity ? state.filteredOrders.length : Math.min(start + state.itemsPerPage, state.filteredOrders.length);
  const pageOrders = state.filteredOrders.slice(start, end);

  // Render table
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  pageOrders.forEach(function (order, index) {
    const globalIndex = start + index + 1;
    const dateStr = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có';

    // Status badge with icon
    let statusIcon = '';
    let statusClass = `status-${order.statusCode}`;

    // Heroicons Outline SVG constants
    const ICON_CHECK_CIRCLE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75L11.25 15L15 9.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>';
    const ICON_X_CIRCLE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.75 9.75L14.25 14.25M14.25 9.75L9.75 14.25M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>';
    const ICON_CLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V12H16.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>';
    const ICON_TRUCK = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 18.75C8.25 19.5784 7.57843 20.25 6.75 20.25C5.92157 20.25 5.25 19.5784 5.25 18.75M8.25 18.75C8.25 17.9216 7.57843 17.25 6.75 17.25C5.92157 17.25 5.25 17.9216 5.25 18.75M8.25 18.75H14.25M5.25 18.75H3.375C2.75368 18.75 2.25 18.2463 2.25 17.625V14.2504M19.5 18.75C19.5 19.5784 18.8284 20.25 18 20.25C17.1716 20.25 16.5 19.5784 16.5 18.75M19.5 18.75C19.5 17.9216 18.8284 17.25 18 17.25C17.1716 17.25 16.5 17.9216 16.5 18.75M19.5 18.75L20.625 18.75C21.2463 18.75 21.7537 18.2457 21.7154 17.6256C21.5054 14.218 20.3473 11.0669 18.5016 8.43284C18.1394 7.91592 17.5529 7.60774 16.9227 7.57315H14.25M16.5 18.75H14.25M14.25 7.57315V6.61479C14.25 6.0473 13.8275 5.56721 13.263 5.50863C11.6153 5.33764 9.94291 5.25 8.25 5.25C6.55709 5.25 4.88466 5.33764 3.23698 5.50863C2.67252 5.56721 2.25 6.0473 2.25 6.61479V14.2504M14.25 7.57315V14.2504M14.25 18.75V14.2504M14.25 14.2504H2.25"/></svg>';
    const ICON_CREDIT_CARD = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 8.25H21.75M2.25 9H21.75M5.25 14.25H11.25M5.25 16.5H8.25M4.5 19.5H19.5C20.7426 19.5 21.75 18.4926 21.75 17.25V6.75C21.75 5.50736 20.7426 4.5 19.5 4.5H4.5C3.25736 4.5 2.25 5.50736 2.25 6.75V17.25C2.25 18.4926 3.25736 19.5 4.5 19.5Z"/></svg>';
    const ICON_ARROW_UTURN_LEFT = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15L3 9M3 9L9 3M3 9H15C18.3137 9 21 11.6863 21 15C21 18.3137 18.3137 21 15 21H12"/></svg>';
    const ICON_QUESTION_MARK_CIRCLE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.87891 7.51884C11.0505 6.49372 12.95 6.49372 14.1215 7.51884C15.2931 8.54397 15.2931 10.206 14.1215 11.2312C13.9176 11.4096 13.6917 11.5569 13.4513 11.6733C12.7056 12.0341 12.0002 12.6716 12.0002 13.5V14.25M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 17.25H12.0075V17.2575H12V17.25Z"/></svg>';

    switch (order.statusCode) {
      case 3: statusIcon = ICON_CHECK_CIRCLE; break; // Hoàn thành
      case 4: statusIcon = ICON_X_CIRCLE; statusClass += ' status-cancelled'; break; // Đã hủy
      case 7: statusIcon = ICON_CLOCK; statusClass += ' status-shipping'; break; // Chờ vận chuyển
      case 8: statusIcon = ICON_TRUCK; statusClass += ' status-shipping'; break; // Đang giao
      case 9: statusIcon = ICON_CREDIT_CARD; break; // Chờ thanh toán
      case 12: statusIcon = ICON_ARROW_UTURN_LEFT; statusClass += ' status-return'; break; // Trả hàng
      default: statusIcon = ICON_QUESTION_MARK_CIRCLE;
    }

    // Main row
    const tr = document.createElement('tr');
    tr.className = 'order-row';
    tr.innerHTML = `
        <td>${globalIndex}</td>
        <td><a href="https://shopee.vn/user/purchase/order/${order.orderId}" class="order-link" target="_blank" onclick="event.stopPropagation()">${order.orderId}</a></td>
        <td>${dateStr}</td>
        <td><span class="status-badge ${statusClass}">${statusIcon} ${order.status}</span></td>
        <td title="${escapeHtml(order.name)}">${escapeHtml(order.name)}</td>
        <td style="text-align: center;">${order.productCount}</td>
        <td>${order.subTotalFormatted}</td>
      `;

    // Build order details with clickable filters
    const detailItems = [];

    // Mã đơn hàng
    detailItems.push(`<div class="detail-item"><strong>Mã đơn hàng:</strong> ${order.orderId}</div>`);

    // Tên sản phẩm
    detailItems.push(`<div class="detail-item"><strong>Tên sản phẩm:</strong> ${escapeHtml(order.name)}</div>`);

    // Số lượng sản phẩm
    detailItems.push(`<div class="detail-item"><strong>Số lượng sản phẩm:</strong> ${order.productCount}</div>`);

    // Tổng tiền
    detailItems.push(`<div class="detail-item"><strong>Tổng tiền:</strong> ${order.subTotalFormatted}</div>`);

    // Trạng thái (clickable)
    detailItems.push(`<div class="detail-item"><strong>Trạng thái:</strong> <span class="detail-value-clickable" data-filter="status" data-value="${order.statusCode}">${order.status}</span></div>`);

    // Người bán (clickable)
    detailItems.push(`<div class="detail-item"><strong>Người bán:</strong> <span class="detail-value-clickable" data-filter="shop" data-value="${escapeHtml(order.shopName)}">${escapeHtml(order.shopName)}</span></div>`);

    // Ngày giao hàng (clickable if available)
    if (order.deliveryDate) {
      const fullDate = new Date(order.deliveryDate).toLocaleString('vi-VN');
      const dateObj = new Date(order.deliveryDate);
      const dateData = JSON.stringify({ year: dateObj.getFullYear(), month: dateObj.getMonth() + 1, day: dateObj.getDate() });
      detailItems.push(`<div class="detail-item"><strong>Ngày giao hàng:</strong> <span class="detail-value-clickable" data-filter="date" data-value='${dateData}'>${fullDate}</span></div>`);
    }

    // Chi tiết sản phẩm
    detailItems.push(`<div class="detail-item"><strong>Chi tiết sản phẩm:</strong> ${escapeHtml(order.productSummary)}</div>`);

    // Expanded detail row
    const detailRow = document.createElement('tr');
    detailRow.className = 'detail-row';
    detailRow.innerHTML = `
        <td colspan="7">
          <div class="detail-content">
            ${detailItems.join('')}
          </div>
        </td>
      `;

    // Toggle expand/collapse
    tr.addEventListener('click', function (e) {
      // Prevent toggle if clicking on a clickable filter
      if (e.target.classList.contains('detail-value-clickable')) {
        return;
      }
      tr.classList.toggle('expanded');
      detailRow.classList.toggle('show');
    });

    // Add click handlers for clickable filters
    detailRow.querySelectorAll('.detail-value-clickable').forEach(el => {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        const filterType = this.dataset.filter;
        const filterValue = this.dataset.value;

        if (filterType === 'status') {
          // Apply status filter
          document.getElementById('filterStatus').value = filterValue;
          applyFilters();
        } else if (filterType === 'shop') {
          // Apply shop search
          document.getElementById('searchBox').value = filterValue;
          applyFilters();
        } else if (filterType === 'date') {
          // Apply date filter
          const dateData = JSON.parse(filterValue);
          document.getElementById('filterYear').value = dateData.year;
          document.getElementById('filterMonth').value = dateData.month;
          state.selectedDay = dateData.day;
          applyFilters();
        }

        // Scroll to top to see filters
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tableBody.appendChild(tr);
    tableBody.appendChild(detailRow);
  });

  // Update pagination info
  updatePaginationInfo();
}

export function updatePaginationInfo() {
  const totalItems = state.filteredOrders.length;
  const totalPages = state.itemsPerPage === Infinity ? 1 : Math.ceil(totalItems / state.itemsPerPage);
  const start = totalItems === 0 ? 0 : (state.currentPage - 1) * state.itemsPerPage + 1;
  const end = state.itemsPerPage === Infinity ? totalItems : Math.min(state.currentPage * state.itemsPerPage, totalItems);

  document.getElementById('pageStart').textContent = start;
  document.getElementById('pageEnd').textContent = end;
  document.getElementById('pageTotal').textContent = totalItems;

  // Update page numbers
  const pageNumbersDiv = document.getElementById('pageNumbers');
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

  // Update button states
  document.getElementById('btnFirstPage').disabled = state.currentPage === 1;
  document.getElementById('btnPrevPage').disabled = state.currentPage === 1;
  document.getElementById('btnNextPage').disabled = state.currentPage === totalPages || totalPages === 0;
  document.getElementById('btnLastPage').disabled = state.currentPage === totalPages || totalPages === 0;
}

export function createPageButton(pageNum) {
  const btn = document.createElement('button');
  btn.className = 'btn-page-num' + (pageNum === state.currentPage ? ' active' : '');
  btn.textContent = pageNum;
  btn.addEventListener('click', () => {
    state.currentPage = pageNum;
    renderCurrentPage();
  });
  return btn;
}
