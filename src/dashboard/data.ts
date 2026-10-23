// Data fetching, caching, and initialization
import type { CategoryMap, OrderData } from '../types/index.js';
import { state } from './state.js';
import { applyFilters } from './filters.js';
import { STORAGE_KEYS } from '../config.js';

export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.scripting;
}

export async function loadMockData(): Promise<void> {
  try {
    const { mockData, mockCategories } = await import('./mock-data.js');
    state.categories = mockCategories;
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

export function loadDataFromStorage(): void {
  chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.CATEGORIES], function (result: Record<string, unknown>) {
    // Check for storage errors
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      document.getElementById('loading')!.classList.add('hidden');
      document.getElementById('noData')!.classList.remove('hidden');
      return;
    }

    try {
      document.getElementById('loading')!.classList.add('hidden');

      const data = result[STORAGE_KEYS.STATS] as OrderData | undefined;
      if (!data || !data.orders || data.orders.length === 0) {
        document.getElementById('noData')!.classList.remove('hidden');
        return;
      }

      state.categories = (result[STORAGE_KEYS.CATEGORIES] as CategoryMap | undefined) ?? {};
      state.allOrdersData = data;
      initializeUI(data);
      updateLastUpdatedTime(data.cachedAt);
    } catch (err) {
      console.error('Failed to load data:', err);
      document.getElementById('noData')!.classList.remove('hidden');
    }
  });
}

export function refreshData(): void {
  import('./fetch-orders.js').then(m => m.fetchOrders('incremental'));
}

export function reloadAllData(): void {
  import('./fetch-orders.js').then(m => m.fetchOrders('full'));
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
  document.getElementById('noData')!.classList.add('hidden');
  document.getElementById('content')!.classList.remove('hidden');

  // Render user info in header
  if (data.user) {
    const userInfoEl = document.getElementById('userInfo');
    const userAvatarEl = document.getElementById('userAvatar') as HTMLImageElement;
    const userNameEl = document.getElementById('userName');

    if (userInfoEl && userAvatarEl && userNameEl) {
      userAvatarEl.hidden = !data.user.avatar;
      userAvatarEl.onerror = () => { userAvatarEl.hidden = true; };
      if (data.user.avatar) userAvatarEl.src = data.user.avatar;
      userNameEl.textContent = data.user.username || data.user.name || '';
      userInfoEl.classList.remove('hidden');
    }
  }

  const years = [...new Set(data.orders.map(o => o.orderYear).filter((y): y is number => y !== null))].sort((a, b) => b - a);
  const filterYear = document.getElementById('filterYear') as HTMLSelectElement;
  const selectedYear = filterYear.value;
  // Clear existing options (keep the "Tất cả năm" default), then repopulate
  while (filterYear.options.length > 1) filterYear.remove(1);
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    filterYear.appendChild(option);
  });
  filterYear.value = years.some(year => String(year) === selectedYear) ? selectedYear : '';

  if (data.fetchedAt) {
    const date = new Date(data.fetchedAt);
    document.getElementById('fetchedAt')!.textContent = `Cập nhật: ${date.toLocaleString('vi-VN')}`;
  }

  applyFilters();
}
