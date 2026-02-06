document.addEventListener('DOMContentLoaded', async function () {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const content = document.getElementById('content');
  const noData = document.getElementById('noData');

  // Filter elements
  const filterYear = document.getElementById('filterYear');
  const filterMonth = document.getElementById('filterMonth');
  const filterStatus = document.getElementById('filterStatus');
  const searchBox = document.getElementById('searchBox');
  const btnExport = document.getElementById('btnExport');
  const btnRefresh = document.getElementById('btnRefresh');
  const lastUpdated = document.getElementById('lastUpdated');
  const btnClearFilters = document.getElementById('btnClearFilters');
  const btnResetFilters = document.getElementById('btnResetFilters');

  // Pagination elements
  const pageSize = document.getElementById('pageSize');
  const btnFirstPage = document.getElementById('btnFirstPage');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const btnLastPage = document.getElementById('btnLastPage');
  const pageNumbers = document.getElementById('pageNumbers');

  // Shop chart controls
  const shopCountSelect = document.getElementById('shopCount');
  const shopMetricSelect = document.getElementById('shopMetric');
  const shopCountDisplay = document.getElementById('shopCountDisplay');

  // Store all orders data
  let allOrdersData = null;
  let filteredOrders = [];
  let monthlyChart = null;
  let shopChart = null;
  let currentSort = { field: null, direction: 'asc' };
  let searchTimeout = null;
  let currentPage = 1;
  let itemsPerPage = 20;
  let selectedDay = null; // Track selected day when filtering by month
  let shopCount = 5; // Default number of shops to show
  let shopMetric = 'amount'; // Default metric: amount, orders, or products

  // Check if we need to fetch data
  const urlParams = new URLSearchParams(window.location.search);
  const shouldFetch = urlParams.get('fetch') === 'true';

  if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  // Event listeners
  filterYear.addEventListener('change', () => { selectedDay = null; currentPage = 1; applyFilters(); });
  filterMonth.addEventListener('change', () => { selectedDay = null; currentPage = 1; applyFilters(); });
  filterStatus.addEventListener('change', () => { currentPage = 1; applyFilters(); });
  btnExport.addEventListener('click', exportToExcel);
  btnRefresh.addEventListener('click', refreshData);
  btnClearFilters.addEventListener('click', clearAllFilters);
  btnResetFilters.addEventListener('click', clearAllFilters);

  // Pagination
  pageSize.addEventListener('change', function () {
    itemsPerPage = this.value === 'all' ? Infinity : parseInt(this.value);
    currentPage = 1;
    renderCurrentPage();
  });
  btnFirstPage.addEventListener('click', () => { currentPage = 1; renderCurrentPage(); });
  btnPrevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderCurrentPage(); } });
  btnNextPage.addEventListener('click', () => { const totalPages = Math.ceil(filteredOrders.length / itemsPerPage); if (currentPage < totalPages) { currentPage++; renderCurrentPage(); } });
  btnLastPage.addEventListener('click', () => { currentPage = Math.ceil(filteredOrders.length / itemsPerPage); renderCurrentPage(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Focus search with '/'
    if (e.key === '/' && document.activeElement !== searchBox) {
      e.preventDefault();
      searchBox.focus();
    }
    // Clear search with 'Escape'
    if (e.key === 'Escape' && document.activeElement === searchBox) {
      searchBox.value = '';
      applyFilters();
      searchBox.blur();
    }
    // Refresh with 'r'
    if (e.key === 'r' && document.activeElement === document.body) {
      refreshData();
    }
  });

  // Search with debounce
  searchBox.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    currentPage = 1;
    searchTimeout = setTimeout(applyFilters, 300);
  });

  // Sort headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', function () {
      const field = this.dataset.sort;
      handleSort(field);
    });
  });

  // Shop chart controls
  shopCountSelect.addEventListener('change', function () {
    shopCount = parseInt(this.value);
    shopCountDisplay.textContent = shopCount;

    // Clear search filter if searching for a shop
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(filteredOrders);
    }
  });

  shopMetricSelect.addEventListener('change', function () {
    shopMetric = this.value;

    // Clear search filter if searching for a shop
    if (searchBox.value.trim()) {
      searchBox.value = '';
      applyFilters();
    } else {
      renderCharts(filteredOrders);
    }
  });

  async function fetchDataFromShopee() {
    try {
      const storage = await chrome.storage.local.get(['shopeeTabId']);
      const tabId = storage.shopeeTabId;

      if (!tabId) {
        throw new Error('Không tìm thấy tab Shopee');
      }

      loadingText.textContent = 'Đang kết nối với Shopee...';

      chrome.runtime.onMessage.addListener(function (message) {
        if (message.source === 'shopee-stats' && message.type === 'progress') {
          const fetchedText = message.fetched ? ` (+${message.fetched})` : '';
          loadingText.textContent = `Đang lấy dữ liệu...${fetchedText} (${message.count} đơn hàng)`;
        }
      });

      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['bridge.js'],
        world: 'ISOLATED'
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js'],
        world: 'MAIN'
      });

      const result = results[0]?.result;

      if (!result) {
        throw new Error('Không nhận được dữ liệu từ Shopee');
      }

      if (!result.success) {
        throw new Error(result.error || 'Có lỗi xảy ra khi lấy dữ liệu');
      }

      // Save to cache with timestamp
      const cacheData = {
        ...result.data,
        cachedAt: new Date().toISOString()
      };
      await chrome.storage.local.set({ shopeeStats: cacheData });
      allOrdersData = result.data;
      initializeUI(result.data);
      updateLastUpdatedTime(cacheData.cachedAt);

    } catch (error) {
      console.error('Fetch error:', error);
      loading.classList.add('hidden');
      noData.classList.remove('hidden');
      noData.querySelector('p').textContent = error.message;
    }
  }

  function loadDataFromStorage() {
    chrome.storage.local.get(['shopeeStats'], function (result) {
      loading.classList.add('hidden');

      const data = result.shopeeStats;
      if (!data || !data.orders || data.orders.length === 0) {
        noData.classList.remove('hidden');
        return;
      }

      allOrdersData = data;
      initializeUI(data);
      updateLastUpdatedTime(data.cachedAt);
    });
  }

  function refreshData() {
    window.location.href = 'results.html?fetch=true';
  }

  function updateLastUpdatedTime(timestamp) {
    if (!timestamp) return;

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let timeText;
    if (minutes < 1) timeText = 'vừa xong';
    else if (minutes < 60) timeText = `${minutes} phút trước`;
    else if (hours < 24) timeText = `${hours} giờ trước`;
    else timeText = `${days} ngày trước`;

    lastUpdated.textContent = `Cập nhật: ${timeText}`;
  }

  function initializeUI(data) {
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    // Populate year filter (exclude null years)
    const years = [...new Set(data.orders.map(o => o.orderYear).filter(y => y !== null))].sort((a, b) => b - a);
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      filterYear.appendChild(option);
    });

    // Format date
    if (data.fetchedAt) {
      const date = new Date(data.fetchedAt);
      document.getElementById('fetchedAt').textContent = `Cập nhật: ${date.toLocaleString('vi-VN')}`;
    }

    // Initial render
    applyFilters();
  }

  function applyFilters() {
    if (!allOrdersData) return;

    const year = filterYear.value;
    const month = filterMonth.value;
    const status = filterStatus.value;
    const searchTerm = searchBox.value.toLowerCase().trim();

    let filtered = allOrdersData.orders.filter(order => {
      // If filtering by year/month, exclude orders without delivery date
      if (year && (!order.orderYear || order.orderYear != year)) return false;
      if (month && (!order.orderMonth || order.orderMonth != month)) return false;

      // Filter by day if selected (only when month filter is active)
      if (selectedDay !== null && month) {
        if (!order.deliveryDate) return false;
        const date = new Date(order.deliveryDate);
        if (date.getDate() != selectedDay) return false;
      }

      if (status && order.statusCode != status) return false;

      // Search filter
      if (searchTerm) {
        const searchableText = [
          order.orderId?.toString(),
          order.name,
          order.shopName,
          order.productSummary,
          order.status
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    });

    // Apply sorting
    if (currentSort.field) {
      filtered = sortOrders(filtered, currentSort.field, currentSort.direction);
    }

    filteredOrders = filtered;
    currentPage = 1;

    // Update active filters chips
    updateActiveFilters();

    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    const ordersTable = document.getElementById('ordersTable');
    const paginationContainer = document.getElementById('paginationContainer');

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      ordersTable.classList.add('hidden');
      paginationContainer.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      ordersTable.classList.remove('hidden');
      paginationContainer.classList.remove('hidden');
    }

    renderData(filtered);
    renderCharts(filtered);
    renderCurrentPage();
  }

  function updateActiveFilters() {
    const year = filterYear.value;
    const month = filterMonth.value;
    const status = filterStatus.value;
    const searchTerm = searchBox.value.trim();

    const activeFiltersContainer = document.getElementById('activeFiltersContainer');
    const activeFiltersDiv = document.getElementById('activeFilters');
    const chips = [];

    if (year) chips.push({ label: `Năm ${year}`, type: 'year' });
    if (month) chips.push({ label: `Tháng ${month}`, type: 'month' });
    if (selectedDay !== null && month) chips.push({ label: `Ngày ${selectedDay}`, type: 'day' });
    if (status) {
      const statusText = filterStatus.options[filterStatus.selectedIndex].text;
      chips.push({ label: statusText, type: 'status' });
    }
    if (searchTerm) chips.push({ label: `Tìm: "${searchTerm}"`, type: 'search' });

    if (chips.length > 0) {
      activeFiltersContainer.classList.remove('hidden');
      activeFiltersDiv.innerHTML = chips.map(chip =>
        `<span class="filter-chip" data-type="${chip.type}">
          ${chip.label}
          <span class="chip-remove" data-filter-type="${chip.type}">&times;</span>
        </span>`
      ).join('');

      // Add click event listeners to all chip-remove buttons
      activeFiltersDiv.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const type = this.getAttribute('data-filter-type');
          removeFilter(type);
        });
      });
    } else {
      activeFiltersContainer.classList.add('hidden');
    }
  }

  function clearAllFilters() {
    filterYear.value = '';
    filterMonth.value = '';
    filterStatus.value = '';
    searchBox.value = '';
    selectedDay = null;
    currentPage = 1;
    applyFilters();
  }

  // Make removeFilter global
  window.removeFilter = function (type) {
    if (type === 'year') filterYear.value = '';
    if (type === 'month') filterMonth.value = '';
    if (type === 'day') selectedDay = null;
    if (type === 'status') filterStatus.value = '';
    if (type === 'search') searchBox.value = '';
    currentPage = 1;
    applyFilters();
  };

  function handleSort(field) {
    // Toggle sort direction
    if (currentSort.field === field) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.field = field;
      currentSort.direction = 'asc';
    }

    // Update UI indicators
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('asc', 'desc');
    });

    const activeHeader = document.querySelector(`th[data-sort="${field}"]`);
    if (activeHeader) {
      activeHeader.classList.add(currentSort.direction);
    }

    applyFilters();
  }

  function sortOrders(orders, field, direction) {
    const sorted = [...orders].sort((a, b) => {
      let aVal, bVal;

      switch (field) {
        case 'deliveryDate':
          aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
          bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
          break;
        case 'subTotal':
          aVal = a.subTotal || 0;
          bVal = b.subTotal || 0;
          break;
        case 'status':
          aVal = a.statusCode || 0;
          bVal = b.statusCode || 0;
          break;
        default:
          return 0;
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }

  function renderData(orders) {
    // Calculate totals for filtered data
    let totalProducts = 0;
    let totalAmount = 0;

    orders.forEach(order => {
      totalProducts += order.productCount;
      if (order.statusCode !== 4 && order.statusCode !== 12) {
        totalAmount += order.subTotal;
      }
    });

    document.getElementById('totalOrders').textContent = orders.length.toLocaleString('vi-VN');
    document.getElementById('totalProducts').textContent = totalProducts.toLocaleString('vi-VN');
    document.getElementById('totalAmount').textContent = formatVND(totalAmount);

    // Time comparison calculations
    renderTimeComparison(allOrdersData.orders);
  }

  function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = itemsPerPage === Infinity ? filteredOrders.length : Math.min(start + itemsPerPage, filteredOrders.length);
    const pageOrders = filteredOrders.slice(start, end);

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
            filterStatus.value = filterValue;
            applyFilters();
          } else if (filterType === 'shop') {
            // Apply shop search
            searchBox.value = filterValue;
            applyFilters();
          } else if (filterType === 'date') {
            // Apply date filter
            const dateData = JSON.parse(filterValue);
            filterYear.value = dateData.year;
            filterMonth.value = dateData.month;
            selectedDay = dateData.day;
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

  function updatePaginationInfo() {
    const totalItems = filteredOrders.length;
    const totalPages = itemsPerPage === Infinity ? 1 : Math.ceil(totalItems / itemsPerPage);
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = itemsPerPage === Infinity ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

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
      if (currentPage > 3) {
        pageNumbersDiv.appendChild(document.createTextNode('...'));
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbersDiv.appendChild(createPageButton(i));
      }
      if (currentPage < totalPages - 2) {
        pageNumbersDiv.appendChild(document.createTextNode('...'));
      }
      if (totalPages > 1) {
        pageNumbersDiv.appendChild(createPageButton(totalPages));
      }
    }

    // Update button states
    document.getElementById('btnFirstPage').disabled = currentPage === 1;
    document.getElementById('btnPrevPage').disabled = currentPage === 1;
    document.getElementById('btnNextPage').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('btnLastPage').disabled = currentPage === totalPages || totalPages === 0;
  }

  function createPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.className = 'btn-page-num' + (pageNum === currentPage ? ' active' : '');
    btn.textContent = pageNum;
    btn.addEventListener('click', () => {
      currentPage = pageNum;
      renderCurrentPage();
    });
    return btn;
  }

  function renderCharts(orders) {
    // Monthly/Daily spending chart
    const chartData = {};
    const hasMonthFilter = filterMonth.value !== '';

    // For chart display, we want to show ALL days in the month
    // even when a specific day is selected (day filter only affects table)
    const chartOrders = hasMonthFilter && selectedDay !== null
      ? allOrdersData.orders.filter(order => {
        const year = filterYear.value;
        const month = filterMonth.value;
        const status = filterStatus.value;
        const searchTerm = searchBox.value.toLowerCase().trim();

        // Apply same filters as main filter, but exclude selectedDay filter
        if (year && (!order.orderYear || order.orderYear != year)) return false;
        if (month && (!order.orderMonth || order.orderMonth != month)) return false;
        if (status && order.statusCode != status) return false;

        if (searchTerm) {
          const searchableText = [
            order.orderId?.toString(),
            order.name,
            order.shopName,
            order.productSummary,
            order.status
          ].filter(Boolean).join(' ').toLowerCase();
          if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
      })
      : orders;

    chartOrders.forEach(order => {
      if (order.statusCode === 4 || order.statusCode === 12) return;

      let key;
      if (hasMonthFilter && order.deliveryDate) {
        // If filtering by month, group by day
        const date = new Date(order.deliveryDate);
        const day = date.getDate();
        key = `${day}/${order.orderMonth}/${order.orderYear}`;
      } else {
        // Otherwise group by month
        if (!order.orderMonth || !order.orderYear) return;
        key = `${order.orderMonth}/${order.orderYear}`;
      }

      chartData[key] = (chartData[key] || 0) + order.subTotal;
    });

    const sortedKeys = Object.keys(chartData).sort((a, b) => {
      const parts1 = a.split('/').map(Number);
      const parts2 = b.split('/').map(Number);

      if (hasMonthFilter) {
        // day/month/year
        const [d1, m1, y1] = parts1;
        const [d2, m2, y2] = parts2;
        return y1 - y2 || m1 - m2 || d1 - d2;
      } else {
        // month/year
        const [m1, y1] = parts1;
        const [m2, y2] = parts2;
        return y1 - y2 || m1 - m2;
      }
    });

    // Format labels based on filter type
    const chartLabels = hasMonthFilter
      ? sortedKeys.map(k => {
        const [day, month] = k.split('/');
        return `${day}/${month}`;
      })
      : sortedKeys;

    const monthlyValues = sortedKeys.map(k => chartData[k]);

    // Prepare backgroundColor array (highlight selected day if applicable)
    const backgroundColors = monthlyValues.map((value, index) => {
      if (hasMonthFilter && selectedDay !== null) {
        const key = sortedKeys[index];
        const [day] = key.split('/').map(Number);
        return day === selectedDay ? '#ff6b3d' : '#ee4d2d';
      }
      return '#ee4d2d';
    });

    // Update chart title
    const chartTitle = document.querySelector('.chart-box h3');
    if (chartTitle) {
      chartTitle.textContent = hasMonthFilter ? 'Chi tiêu theo ngày' : 'Chi tiêu theo tháng';
    }

    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(document.getElementById('monthlyChart'), {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Chi tiêu (VNĐ)',
          data: monthlyValues,
          backgroundColor: backgroundColors,
          borderRadius: 4,
          hoverBackgroundColor: '#ff6b3d'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => formatVND(ctx.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => formatVND(value, true)
            }
          }
        },
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) {
            const index = activeElements[0].index;

            if (hasMonthFilter) {
              // When filtering by month, toggle day selection
              const dayLabel = sortedKeys[index];
              const [day] = dayLabel.split('/').map(Number);

              // Toggle selected day
              if (selectedDay === day) {
                selectedDay = null; // Deselect
              } else {
                selectedDay = day; // Select
              }

              // Reapply filters
              applyFilters();
            } else {
              // When not filtering by month, select month
              const monthLabel = sortedKeys[index];
              const [monthNum, year] = monthLabel.split('/');

              // Set filters
              filterYear.value = year;
              filterMonth.value = monthNum;

              // Apply filters
              applyFilters();

              // Scroll to table
              document.getElementById('ordersTable').scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      }
    });

    // Top shops chart
    const shopData = {};
    orders.forEach(order => {
      if (order.statusCode === 4 || order.statusCode === 12) return;
      const shop = order.shopName.split(' - ')[1] || order.shopName;

      if (!shopData[shop]) {
        shopData[shop] = { amount: 0, orders: 0, products: 0 };
      }

      shopData[shop].amount += order.subTotal;
      shopData[shop].orders += 1;
      shopData[shop].products += order.productCount;
    });

    // Sort and get top shops based on selected metric
    const topShops = Object.entries(shopData)
      .sort((a, b) => b[1][shopMetric] - a[1][shopMetric])
      .slice(0, shopCount);

    // Format tooltip based on metric
    let tooltipFormatter;
    if (shopMetric === 'amount') {
      tooltipFormatter = ctx => `${ctx.label}: ${formatVND(ctx.raw)}`;
    } else if (shopMetric === 'orders') {
      tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} đơn`;
    } else {
      tooltipFormatter = ctx => `${ctx.label}: ${ctx.raw} sản phẩm`;
    }

    if (shopChart) shopChart.destroy();
    shopChart = new Chart(document.getElementById('shopChart'), {
      type: 'doughnut',
      data: {
        labels: topShops.map(s => s[0].substring(0, 20)),
        datasets: [{
          data: topShops.map(s => s[1][shopMetric]),
          backgroundColor: ['#ee4d2d', '#ff7043', '#ffab91', '#ffccbc', '#fbe9e7', '#ffe0b2', '#ffd180', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'],
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: tooltipFormatter
            }
          }
        },
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) {
            const index = activeElements[0].index;
            const shopName = topShops[index][0];

            // Search for shop name
            searchBox.value = shopName;

            // Apply filters
            applyFilters();

            // Scroll to table
            document.getElementById('ordersTable').scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }

  function exportToExcel() {
    if (!allOrdersData) return;

    const year = filterYear.value;
    const month = filterMonth.value;
    const status = filterStatus.value;

    let filtered = allOrdersData.orders.filter(order => {
      if (year && order.orderYear != year) return false;
      if (month && order.orderMonth != month) return false;
      if (status && order.statusCode != status) return false;
      return true;
    });

    const data = filtered.map((order, index) => ({
      'STT': index + 1,
      'Mã đơn hàng': order.orderId,
      'Ngày giao hàng': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có',
      'Trạng thái': order.status,
      'Tên sản phẩm': order.name,
      'Số lượng': order.productCount,
      'Tổng tiền': order.subTotal,
      'Người bán': order.shopName,
      'Chi tiết': order.productSummary
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng Shopee');

    const fileName = `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function formatVND(number, short = false) {
    if (short && number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderTimeComparison(allOrders) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastYear = currentYear - 1;

    // Filter completed orders only
    const completedOrders = allOrders.filter(o => o.statusCode !== 4 && o.statusCode !== 12);

    // Current month
    const currentMonthOrders = completedOrders.filter(o =>
      o.orderMonth === currentMonth && o.orderYear === currentYear
    );
    const currentMonthTotal = currentMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

    // Last month
    const lastMonthOrders = completedOrders.filter(o =>
      o.orderMonth === lastMonth && o.orderYear === lastMonthYear
    );
    const lastMonthTotal = lastMonthOrders.reduce((sum, o) => sum + o.subTotal, 0);

    // Current year
    const currentYearOrders = completedOrders.filter(o => o.orderYear === currentYear);
    const currentYearTotal = currentYearOrders.reduce((sum, o) => sum + o.subTotal, 0);

    // Last year
    const lastYearOrders = completedOrders.filter(o => o.orderYear === lastYear);
    const lastYearTotal = lastYearOrders.reduce((sum, o) => sum + o.subTotal, 0);

    // Average order value
    const avgOrderValue = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => sum + o.subTotal, 0) / completedOrders.length
      : 0;

    // Calculate changes
    const monthChange = lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
      : null;

    const yearChange = lastYearTotal > 0
      ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1)
      : null;

    // Update UI
    document.getElementById('currentMonthAmount').textContent = formatVND(currentMonthTotal);
    document.getElementById('currentYearAmount').textContent = formatVND(currentYearTotal);
    document.getElementById('avgOrderValue').textContent = formatVND(avgOrderValue);

    // Month comparison
    const monthCompEl = document.getElementById('monthComparison');
    if (monthChange !== null) {
      const arrow = monthChange >= 0 ? '↑' : '↓';
      const color = monthChange >= 0 ? '#f44336' : '#4caf50';
      monthCompEl.innerHTML = `<span style="color: ${color}">${arrow} ${Math.abs(monthChange)}% so với tháng trước</span>`;
    } else {
      monthCompEl.textContent = 'Chưa có dữ liệu tháng trước';
    }

    // Year comparison
    const yearCompEl = document.getElementById('yearComparison');
    if (yearChange !== null) {
      const arrow = yearChange >= 0 ? '↑' : '↓';
      const color = yearChange >= 0 ? '#f44336' : '#4caf50';
      yearCompEl.innerHTML = `<span style="color: ${color}">${arrow} ${Math.abs(yearChange)}% so với năm ngoái</span>`;
    } else {
      yearCompEl.textContent = 'Chưa có dữ liệu năm ngoái';
    }

    // Average comparison (show count)
    const avgCompEl = document.getElementById('avgComparison');
    avgCompEl.textContent = `${completedOrders.length} đơn hàng hoàn thành`;
  }

});
