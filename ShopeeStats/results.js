document.addEventListener('DOMContentLoaded', async function () {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const content = document.getElementById('content');
  const noData = document.getElementById('noData');

  // Filter elements
  const filterYear = document.getElementById('filterYear');
  const filterMonth = document.getElementById('filterMonth');
  const filterStatus = document.getElementById('filterStatus');
  const btnExport = document.getElementById('btnExport');

  // Store all orders data
  let allOrdersData = null;
  let monthlyChart = null;
  let shopChart = null;

  // Check if we need to fetch data
  const urlParams = new URLSearchParams(window.location.search);
  const shouldFetch = urlParams.get('fetch') === 'true';

  if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  // Event listeners
  filterYear.addEventListener('change', applyFilters);
  filterMonth.addEventListener('change', applyFilters);
  filterStatus.addEventListener('change', applyFilters);
  btnExport.addEventListener('click', exportToExcel);

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

      await chrome.storage.local.set({ shopeeStats: result.data });
      allOrdersData = result.data;
      initializeUI(result.data);

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
    });
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

    let filtered = allOrdersData.orders.filter(order => {
      // If filtering by year/month, exclude orders without delivery date
      if (year && (!order.orderYear || order.orderYear != year)) return false;
      if (month && (!order.orderMonth || order.orderMonth != month)) return false;
      if (status && order.statusCode != status) return false;
      return true;
    });

    renderData(filtered);
    renderCharts(filtered);
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

    // Render table
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    orders.forEach(function (order, index) {
      const dateStr = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có';

      // Main row
      const tr = document.createElement('tr');
      tr.className = 'order-row';
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${order.orderId}</td>
        <td>${dateStr}</td>
        <td><span class="status-badge status-${order.statusCode}">${order.status}</span></td>
        <td title="${escapeHtml(order.name)}">${escapeHtml(order.name)}</td>
        <td>${order.subTotalFormatted}</td>
      `;

      // Expanded detail row
      const detailRow = document.createElement('tr');
      detailRow.className = 'detail-row';
      detailRow.innerHTML = `
        <td colspan="6">
          <div class="detail-content">
            <div class="detail-item"><strong>Số lượng:</strong> ${order.productCount}</div>
            <div class="detail-item"><strong>Người bán:</strong> ${escapeHtml(order.shopName)}</div>
            <div class="detail-item"><strong>Chi tiết:</strong> ${escapeHtml(order.productSummary)}</div>
          </div>
        </td>
      `;

      // Toggle expand/collapse
      tr.addEventListener('click', function () {
        tr.classList.toggle('expanded');
        detailRow.classList.toggle('show');
      });

      tableBody.appendChild(tr);
      tableBody.appendChild(detailRow);
    });
  }

  function renderCharts(orders) {
    // Monthly spending chart
    const monthlyData = {};
    orders.forEach(order => {
      if (order.statusCode === 4 || order.statusCode === 12) return;
      const key = `${order.orderMonth}/${order.orderYear}`;
      monthlyData[key] = (monthlyData[key] || 0) + order.subTotal;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y1 - y2 || m1 - m2;
    });

    const monthlyValues = sortedMonths.map(k => monthlyData[k]);

    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(document.getElementById('monthlyChart'), {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [{
          label: 'Chi tiêu (VNĐ)',
          data: monthlyValues,
          backgroundColor: '#ee4d2d',
          borderRadius: 4
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
        }
      }
    });

    // Top shops chart
    const shopData = {};
    orders.forEach(order => {
      if (order.statusCode === 4 || order.statusCode === 12) return;
      const shop = order.shopName.split(' - ')[1] || order.shopName;
      shopData[shop] = (shopData[shop] || 0) + order.subTotal;
    });

    const topShops = Object.entries(shopData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (shopChart) shopChart.destroy();
    shopChart = new Chart(document.getElementById('shopChart'), {
      type: 'doughnut',
      data: {
        labels: topShops.map(s => s[0].substring(0, 20)),
        datasets: [{
          data: topShops.map(s => s[1]),
          backgroundColor: ['#ee4d2d', '#ff7043', '#ffab91', '#ffccbc', '#fbe9e7']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${formatVND(ctx.raw)}`
            }
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
});
