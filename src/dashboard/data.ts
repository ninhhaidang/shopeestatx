// Data fetching, caching, and initialization
import type { OrderData } from '../types/index.js';
import { state } from './state.js';
import { applyFilters } from './filters.js';

export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.scripting;
}

export async function loadMockData(): Promise<void> {
  try {
    const { mockData } = await import('./mock-data.js');
    state.allOrdersData = mockData;
    initializeUI(mockData);
    updateLastUpdatedTime(mockData.cachedAt);
  } catch (error) {
    console.error('Mock data load error:', error);
    document.getElementById('loading')!.classList.add('hidden');
    const noData = document.getElementById('noData')!;
    noData.classList.remove('hidden');
    noData.querySelector('p')!.textContent = 'Không thể tải dữ liệu demo: ' + (error as Error).message;
  }
}

export async function fetchDataFromShopee(): Promise<void> {
  const btnRefresh = document.getElementById('btnRefresh') as HTMLButtonElement | null;
  if (btnRefresh) { btnRefresh.disabled = true; btnRefresh.style.opacity = '0.6'; }

  try {
    const storage = await chrome.storage.local.get(['shopeeTabId']);
    const tabId = storage.shopeeTabId;

    if (!tabId) {
      throw new Error('Không tìm thấy tab Shopee');
    }

    document.getElementById('loadingText')!.textContent = 'Đang kết nối với Shopee...';

    chrome.runtime.onMessage.addListener(function (message: { source: string; type: string; count: number; fetched?: number }) {
      if (message.source === 'shopee-stats' && message.type === 'progress') {
        const fetchedText = message.fetched ? ` (+${message.fetched})` : '';
        document.getElementById('loadingText')!.textContent = `Đang lấy dữ liệu...${fetchedText} (${message.count} đơn hàng)`;
      }
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['bridge.js'],
      world: 'ISOLATED' as chrome.scripting.ExecutionWorld,
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
      world: 'MAIN' as chrome.scripting.ExecutionWorld,
    });

    const result = results[0]?.result as { success: boolean; data?: OrderData; error?: string } | undefined;

    if (!result) {
      throw new Error('Không nhận được dữ liệu từ Shopee');
    }

    if (!result.success) {
      throw new Error(result.error || 'Có lỗi xảy ra khi lấy dữ liệu');
    }

    const cacheData: OrderData = {
      ...result.data!,
      cachedAt: new Date().toISOString(),
    };
    await chrome.storage.local.set({ shopeeStats: cacheData });
    state.allOrdersData = result.data!;
    initializeUI(result.data!);
    updateLastUpdatedTime(cacheData.cachedAt);

  } catch (error) {
    console.error('Fetch error:', error);
    document.getElementById('loading')!.classList.add('hidden');
    const noData = document.getElementById('noData')!;
    noData.classList.remove('hidden');
    noData.querySelector('p')!.textContent = (error as Error).message;
  } finally {
    if (btnRefresh) { btnRefresh.disabled = false; btnRefresh.style.opacity = ''; }
  }
}

export function loadDataFromStorage(): void {
  chrome.storage.local.get(['shopeeStats'], function (result: { shopeeStats?: OrderData }) {
    document.getElementById('loading')!.classList.add('hidden');

    const data = result.shopeeStats;
    if (!data || !data.orders || data.orders.length === 0) {
      document.getElementById('noData')!.classList.remove('hidden');
      return;
    }

    state.allOrdersData = data;
    initializeUI(data);
    updateLastUpdatedTime(data.cachedAt);
  });
}

export function refreshData(): void {
  // Delegates to incremental-fetch.ts to keep data.ts under 200 lines
  import('./incremental-fetch.js').then(m => m.incrementalFetch());
}

export function updateLastUpdatedTime(timestamp: string | undefined): void {
  if (!timestamp) return;

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  let timeText: string;
  if (minutes < 1) timeText = 'vừa xong';
  else if (minutes < 60) timeText = `${minutes} phút trước`;
  else if (hours < 24) timeText = `${hours} giờ trước`;
  else timeText = `${days} ngày trước`;

  document.getElementById('lastUpdated')!.textContent = `Cập nhật: ${timeText}`;
}

export function initializeUI(data: OrderData): void {
  document.getElementById('loading')!.classList.add('hidden');
  document.getElementById('content')!.classList.remove('hidden');

  const years = [...new Set(data.orders.map(o => o.orderYear).filter((y): y is number => y !== null))].sort((a, b) => b - a);
  const filterYear = document.getElementById('filterYear') as HTMLSelectElement;
  // Clear existing options (keep the "Tất cả năm" default), then repopulate
  while (filterYear.options.length > 1) filterYear.remove(1);
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    filterYear.appendChild(option);
  });

  if (data.fetchedAt) {
    const date = new Date(data.fetchedAt);
    document.getElementById('fetchedAt')!.textContent = `Cập nhật: ${date.toLocaleString('vi-VN')}`;
  }

  applyFilters();
}
