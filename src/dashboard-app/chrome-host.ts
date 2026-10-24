import { MESSAGE_SOURCE, STORAGE_KEYS } from '../config.js';
import { t } from '../i18n/index.js';
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
  if (!result) throw new Error(t('dash.error.noResponse'));
  if (!result.success || !result.data) throw new Error(result.error || t('dash.error.generic'));
  return result.data;
}

/** Profile sources use different name fields; compare IDs only when both expose the same kind. */
function accountsDiffer(cached: OrderData['user'], fresh: OrderData['user']): boolean {
  if (!cached || !fresh) return false;
  if (cached.userId != null && fresh.userId != null) return cached.userId !== fresh.userId;
  if (cached.uid && fresh.uid) return cached.uid !== fresh.uid;
  if (cached.userId != null || cached.uid || fresh.userId != null || fresh.uid) return false;
  return Boolean(cached.username && fresh.username && cached.username !== fresh.username);
}

export const chromeHost: DashboardHost = {
  scanOnOpen: new URLSearchParams(window.location.search).get('fetch') === 'true',

  async loadCached() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.STATS);
    return (stored[STORAGE_KEYS.STATS] as OrderData | undefined) ?? null;
  },

  async refresh(onProgress, mode) {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.TAB_ID]);
    const tabId = stored[STORAGE_KEYS.TAB_ID] as number | undefined;
    if (!tabId) throw new Error(t('dash.error.noTab'));

    const listener = (message: { source?: string; type?: string; count?: number }) => {
      if (message.source === MESSAGE_SOURCE && message.type === 'progress' && typeof message.count === 'number') {
        onProgress(message.count);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    try {
      const fresh = await scanShopee(tabId);
      const cached = (stored[STORAGE_KEYS.STATS] as OrderData | undefined) ?? null;
      const accountChanged = accountsDiffer(cached?.user, fresh.user);
      const merged = mergeOrderData(mode === 'merge' && !accountChanged ? cached : null, fresh, new Date());
      await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: merged.data });
      return merged;
    } finally {
      chrome.runtime.onMessage.removeListener(listener);
    }
  },
};
