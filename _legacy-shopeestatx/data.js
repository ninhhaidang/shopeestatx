// ShopeeStatX/data.js
import { state } from './state.js';
import { applyFilters } from './filters.js';

// Detect if running inside Chrome Extension context
export function isExtensionContext() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.scripting;
}

// Load mock data for preview/development outside extension
export async function loadMockData() {
  try {
    const { mockData } = await import('./mock-data.js');
    state.allOrdersData = mockData;
    initializeUI(mockData);
    updateLastUpdatedTime(mockData.cachedAt);
  } catch (error) {
    console.error('Mock data load error:', error);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('noData').classList.remove('hidden');
    document.getElementById('noData').querySelector('p').textContent = 'Không thể tải dữ liệu demo: ' + error.message;
  }
}

export async function fetchDataFromShopee() {
  try {
    const storage = await chrome.storage.local.get(['shopeeTabId']);
    const tabId = storage.shopeeTabId;

    if (!tabId) {
      throw new Error('Không tìm thấy tab Shopee');
    }

    document.getElementById('loadingText').textContent = 'Đang kết nối với Shopee...';

    chrome.runtime.onMessage.addListener(function (message) {
      if (message.source === 'shopee-stats' && message.type === 'progress') {
        const fetchedText = message.fetched ? ` (+${message.fetched})` : '';
        document.getElementById('loadingText').textContent = `Đang lấy dữ liệu...${fetchedText} (${message.count} đơn hàng)`;
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
    state.allOrdersData = result.data;
    initializeUI(result.data);
    updateLastUpdatedTime(cacheData.cachedAt);

  } catch (error) {
    console.error('Fetch error:', error);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('noData').classList.remove('hidden');
    document.getElementById('noData').querySelector('p').textContent = error.message;
  }
}

export function loadDataFromStorage() {
  chrome.storage.local.get(['shopeeStats'], function (result) {
    document.getElementById('loading').classList.add('hidden');

    const data = result.shopeeStats;
    if (!data || !data.orders || data.orders.length === 0) {
      document.getElementById('noData').classList.remove('hidden');
      return;
    }

    state.allOrdersData = data;
    initializeUI(data);
    updateLastUpdatedTime(data.cachedAt);
  });
}

export function refreshData() {
  window.location.href = 'results.html?fetch=true';
}

export function updateLastUpdatedTime(timestamp) {
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

  document.getElementById('lastUpdated').textContent = `Cập nhật: ${timeText}`;
}

export function initializeUI(data) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');

  // Populate year filter (exclude null years)
  const years = [...new Set(data.orders.map(o => o.orderYear).filter(y => y !== null))].sort((a, b) => b - a);
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    document.getElementById('filterYear').appendChild(option);
  });

  // Format date
  if (data.fetchedAt) {
    const date = new Date(data.fetchedAt);
    document.getElementById('fetchedAt').textContent = `Cập nhật: ${date.toLocaleString('vi-VN')}`;
  }

  // Initial render
  applyFilters();
}
