import { getStorageKey, MESSAGE_SOURCE, STORAGE_KEYS } from '../config.js';
import { t } from '../i18n/index.js';
import { mergeOrderData } from '../dashboard/merge.js';
import type { OrderData } from '../types/index.js';
import type { DashboardHost } from './host';

const SCAN_STATE = getStorageKey('scan-state');
const CACHE_LOCK = getStorageKey('cache-write');
interface ScanState {
  sequence: number;
  epoch: number;
  committed: number;
  accountSequence: number;
  versions: [string, number][];
}
const initialState = (): ScanState => ({ sequence: 0, epoch: 0, committed: 0, accountSequence: 0, versions: [] });

/** Injecting a file has no args: hold a per-tab lock while handing its scan token to MAIN. */
async function scanShopee(tabId: number, scanId: string): Promise<OrderData> {
  return navigator.locks.request(getStorageKey(`scan-tab-${tabId}`), async () => {
    await chrome.scripting.executeScript({
      target: { tabId }, files: ['bridge.js'], world: 'ISOLATED',
    });
    await chrome.scripting.executeScript({
      target: { tabId }, world: 'MAIN',
      func: (id: string) => {
        Object.defineProperty(window, '__shopeestatxScanId', { value: id, configurable: true });
      },
      args: [scanId],
    });
    const results = await chrome.scripting.executeScript({
      target: { tabId }, files: ['content.js'], world: 'MAIN',
    });
    const result = results[0]?.result as { success: boolean; data?: OrderData; error?: string } | undefined;
    if (!result) throw new Error(t('dash.error.noResponse'));
    if (!result.success || !result.data) throw new Error(result.error || t('dash.error.generic'));
    return result.data;
  });
}

/** Profile sources use different name fields; compare IDs only when both expose the same kind. */
function accountsDiffer(cached: OrderData['user'], fresh: OrderData['user']): boolean {
  if (!cached || !fresh) return false;
  if (cached.userId != null && fresh.userId != null) return String(cached.userId) !== String(fresh.userId);
  if (cached.uid && fresh.uid) return String(cached.uid) !== String(fresh.uid);
  if (cached.userId != null || cached.uid || fresh.userId != null || fresh.uid) return false;
  return Boolean(cached.username && fresh.username && cached.username !== fresh.username);
}

export const chromeHost: DashboardHost = {
  scanOnOpen: new URLSearchParams(window.location.search).get('fetch') === 'true',

  async loadCached() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.STATS);
    const cached = stored[STORAGE_KEYS.STATS] as OrderData | undefined;
    return cached ? mergeOrderData(null, cached, new Date(cached.cachedAt ?? cached.fetchedAt)).data : null;
  },

  async refresh(onProgress, mode) {
    const scan = await navigator.locks.request(CACHE_LOCK, async () => {
      const stored = await chrome.storage.local.get([SCAN_STATE, STORAGE_KEYS.TAB_ID]);
      const tabId = stored[STORAGE_KEYS.TAB_ID] as number | undefined;
      if (tabId == null) throw new Error(t('dash.error.noTab'));
      const state = { ...initialState(), ...(stored[SCAN_STATE] as ScanState | undefined) };
      const next = { ...state, sequence: state.sequence + 1, epoch: state.epoch + (mode === 'replace' ? 1 : 0) };
      await chrome.storage.local.set({ [SCAN_STATE]: next });
      return { tabId, sequence: next.sequence, epoch: next.epoch, id: crypto.randomUUID() };
    });
    let active = true;
    const listener = async (
      message: { source?: string; type?: string; count?: number; scanId?: string },
      sender: chrome.runtime.MessageSender,
    ) => {
      if (!active || sender.tab?.id !== scan.tabId || message.scanId !== scan.id
        || message.source !== MESSAGE_SOURCE || message.type !== 'progress'
        || !Number.isSafeInteger(message.count) || message.count! < 0) return;
      const stored = await chrome.storage.local.get(SCAN_STATE);
      const state = stored[SCAN_STATE] as ScanState | undefined;
      if (active && state?.epoch === scan.epoch && scan.sequence >= (state.accountSequence ?? 0)) onProgress(message.count!);
    };
    chrome.runtime.onMessage.addListener(listener);
    try {
      const fresh = await scanShopee(scan.tabId, scan.id);
      return await navigator.locks.request(CACHE_LOCK, async () => {
        const stored = await chrome.storage.local.get([STORAGE_KEYS.STATS, SCAN_STATE]);
        const state = { ...initialState(), ...(stored[SCAN_STATE] as ScanState | undefined) };
        if (state.epoch !== scan.epoch || scan.sequence < state.accountSequence) throw new Error(t('dash.error.superseded'));
        const cached = (stored[STORAGE_KEYS.STATS] as OrderData | undefined) ?? null;
        const accountChanged = accountsDiffer(cached?.user, fresh.user);
        if (accountChanged && state.committed > scan.sequence) throw new Error(t('dash.error.superseded'));
        const replacing = mode === 'replace' || accountChanged;
        const versions = new Map(replacing ? [] : state.versions);
        const current = new Map(cached?.orders.map(o => [String(o.orderId), o]));
        const orders = fresh.orders.map(o => {
          const id = String(o.orderId);
          return (versions.get(id) ?? 0) > scan.sequence ? current.get(id)! : o;
        });
        const data = { ...fresh, orders, user: !replacing && state.committed > scan.sequence ? cached?.user : fresh.user };
        const merged = mergeOrderData(replacing ? null : cached, data, new Date());
        for (const o of fresh.orders) {
          const id = String(o.orderId);
          versions.set(id, Math.max(versions.get(id) ?? 0, scan.sequence));
        }
        await chrome.storage.local.set({
          [STORAGE_KEYS.STATS]: merged.data,
          [SCAN_STATE]: {
            ...state,
            accountSequence: accountChanged || mode === 'replace' ? scan.sequence : state.accountSequence,
            committed: Math.max(state.committed, scan.sequence),
            versions: [...versions],
          } satisfies ScanState,
        });
        return merged;
      });
    } finally {
      active = false;
      chrome.runtime.onMessage.removeListener(listener);
    }
  },
};
