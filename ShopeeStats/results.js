document.addEventListener('DOMContentLoaded', async function() {
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const content = document.getElementById('content');
  const noData = document.getElementById('noData');

  // Check if we need to fetch data
  const urlParams = new URLSearchParams(window.location.search);
  const shouldFetch = urlParams.get('fetch') === 'true';

  if (shouldFetch) {
    await fetchDataFromShopee();
  } else {
    loadDataFromStorage();
  }

  async function fetchDataFromShopee() {
    try {
      // Get shopee tab ID
      const storage = await chrome.storage.local.get(['shopeeTabId']);
      const tabId = storage.shopeeTabId;

      if (!tabId) {
        throw new Error('Không tìm thấy tab Shopee');
      }

      loadingText.textContent = 'Đang kết nối với Shopee...';

      // Listen for progress messages
      chrome.runtime.onMessage.addListener(function(message) {
        if (message.source === 'shopee-stats' && message.type === 'progress') {
          loadingText.textContent = `Đang lấy dữ liệu... (${message.count} đơn hàng)`;
        }
      });

      // First inject bridge script (ISOLATED world) to receive progress messages
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['bridge.js'],
        world: 'ISOLATED'
      });

      // Execute fetch script in shopee tab (MAIN world)
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

      // Save data and render
      await chrome.storage.local.set({ shopeeStats: result.data });
      renderData(result.data);

    } catch (error) {
      console.error('Fetch error:', error);
      loading.classList.add('hidden');
      noData.classList.remove('hidden');
      noData.querySelector('p').textContent = error.message;
    }
  }

  function loadDataFromStorage() {
    chrome.storage.local.get(['shopeeStats'], function(result) {
      loading.classList.add('hidden');

      const data = result.shopeeStats;
      if (!data || !data.orders || data.orders.length === 0) {
        noData.classList.remove('hidden');
        return;
      }

      renderData(data);
    });
  }

  function renderData(data) {
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    // Update summary
    document.getElementById('totalOrders').textContent = data.orders.length.toLocaleString('vi-VN');
    document.getElementById('totalProducts').textContent = data.totalCount.toLocaleString('vi-VN');
    document.getElementById('totalAmount').textContent = data.totalAmountFormatted;

    // Format date
    if (data.fetchedAt) {
      const date = new Date(data.fetchedAt);
      document.getElementById('fetchedAt').textContent = `Cập nhật: ${date.toLocaleString('vi-VN')}`;
    }

    // Render table
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    data.orders.forEach(function(order, index) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td title="${escapeHtml(order.name)}">${escapeHtml(order.name)}</td>
        <td>${order.productCount}</td>
        <td>${order.subTotalFormatted}</td>
        <td><span class="status-badge status-${order.statusCode}">${order.status}</span></td>
        <td title="${escapeHtml(order.shopName)}">${escapeHtml(order.shopName)}</td>
        <td title="${escapeHtml(order.productSummary)}">${escapeHtml(order.productSummary)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
