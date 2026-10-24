import { MESSAGE_SOURCE, STORAGE_KEYS } from '../config.js';
import { mergeOrderData } from '../dashboard/merge.js';
import type { OrderData } from '../types/index.js';
import type { DashboardHost } from './host';

/** Same injection sequence as the old dashboard: bridge (ISOLATED) then content script (MAIN). One order-list read, nothing else. */
async function scanShopee(tabId: number): Promise<OrderData> {
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
  if (!result) throw new Error('Không nhận được dữ liệu từ Shopee');
  if (!result.success || !result.data) throw new Error(result.error || 'Có lỗi xảy ra khi lấy dữ liệu');
  return result.data;
}

export const chromeHost: DashboardHost = {
  scanOnOpen: new URLSearchParams(window.location.search).get('fetch') === 'true',

  async loadCached() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.STATS);
    return (stored[STORAGE_KEYS.STATS] as OrderData | undefined) ?? null;
  },

  async refresh(onProgress) {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.TAB_ID]);
    const tabId = stored[STORAGE_KEYS.TAB_ID] as number | undefined;
    if (!tabId) throw new Error('Không tìm thấy tab Shopee. Vui lòng mở Shopee và thử lại.');

    const listener = (message: { source?: string; type?: string; count?: number }) => {
      if (message.source === MESSAGE_SOURCE && message.type === 'progress' && typeof message.count === 'number') {
        onProgress(message.count);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    try {
      const fresh = await scanShopee(tabId);
      const merged = mergeOrderData((stored[STORAGE_KEYS.STATS] as OrderData | undefined) ?? null, fresh, new Date());
      await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: merged.data });
      return merged;
    } finally {
      chrome.runtime.onMessage.removeListener(listener);
    }
  },
};
