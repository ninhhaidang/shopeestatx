// Incremental fetch — fetch from Shopee, merge with cache, show new order count
import type { Order, OrderData } from '../types/index.js';
import { state } from './state.js';
import { isExtensionContext, initializeUI, updateLastUpdatedTime } from './data.js';
import { showToast } from './utils.js';
import { STORAGE_KEYS } from '../config.js';

/** Fetch fresh data from Shopee and merge with cached orders (no page reload) */
export async function incrementalFetch(): Promise<void> {
  if (!isExtensionContext()) return;

  const btnRefresh = document.getElementById('btnRefresh') as HTMLButtonElement | null;
  if (btnRefresh) { btnRefresh.disabled = true; btnRefresh.style.opacity = '0.6'; }

  try {
    const storage = await chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.TAB_ID]);
    const tabId = storage[STORAGE_KEYS.TAB_ID] as number | undefined;
    const cached = storage[STORAGE_KEYS.STATS] as OrderData | undefined;
    const cachedIds = new Set<string>((cached?.orders ?? []).map((o: Order) => String(o.orderId)));

    document.getElementById('loadingText')!.textContent = 'Đang cập nhật dữ liệu...';
    document.getElementById('loading')!.classList.remove('hidden');
    document.getElementById('content')!.classList.add('hidden');

    if (!tabId) throw new Error('Không tìm thấy tab Shopee. Vui lòng mở Shopee và thử lại.');

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
    if (!result?.success) throw new Error(result?.error || 'Lỗi khi lấy dữ liệu từ Shopee');

    const freshOrders = result.data!.orders;
    const newOrders = freshOrders.filter(o => !cachedIds.has(String(o.orderId)));

    // Merge: keep all fresh orders, append any cached orders not present in fresh (edge case)
    const freshIds = new Set(freshOrders.map(o => String(o.orderId)));
    const onlyInCache = (cached?.orders ?? []).filter(o => !freshIds.has(String(o.orderId)));
    const mergedOrders = [...freshOrders, ...onlyInCache];

    const totalAmount = mergedOrders
      .filter(o => o.statusCode !== 4 && o.statusCode !== 12)
      .reduce((s, o) => s + o.subTotal, 0);

    const merged: OrderData = {
      ...result.data!,
      orders: mergedOrders,
      totalCount: mergedOrders.reduce((s, o) => s + o.productCount, 0),
      totalAmount,
      totalAmountFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount),
      cachedAt: new Date().toISOString(),
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: merged });
    state.allOrdersData = merged;
    initializeUI(merged);
    updateLastUpdatedTime(merged.cachedAt);

    showToast(newOrders.length > 0
      ? `Đã thêm ${newOrders.length} đơn hàng mới!`
      : 'Dữ liệu đã cập nhật. Không có đơn hàng mới.');
  } catch (error) {
    document.getElementById('loading')!.classList.add('hidden');
    document.getElementById('content')!.classList.remove('hidden');
    showToast('Lỗi cập nhật: ' + (error as Error).message);
  } finally {
    if (btnRefresh) { btnRefresh.disabled = false; btnRefresh.style.opacity = ''; }
  }
}
