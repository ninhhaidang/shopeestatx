// Background step after the orders are shown: read each unseen product's Shopee category once and keep it
import type { CategoryMap, Order } from '../types/index.js';
import type { CategoryResult, ItemRequest } from '../content/category-fetcher.js';
import { showToast } from './utils.js';
import { state } from './state.js';
import { applyFilters } from './filters.js';
import { STORAGE_KEYS } from '../config.js';

const BATCH_SIZE = 10;
// The page script spaces its own requests; this keeps the same distance between batches.
const BATCH_GAP_MS = 500;
const STALL_WARNING_MS = 30_000;
const STALL_WARNING = 'Vẫn đang chờ Shopee phản hồi. Nếu quá lâu, hãy tải lại trang Shopee rồi thử lại.';

export interface CategorizeOutcome {
  failed: number;
}

/** Products in the orders that have no category on record yet, one entry per product. */
function missingItems(orders: Order[], known: CategoryMap): ItemRequest[] {
  const missing = new Map<number, ItemRequest>();
  for (const order of orders) {
    if (order.shopId == null) continue;
    for (const item of order.items ?? []) {
      if (item.itemId == null || String(item.itemId) in known || missing.has(item.itemId)) continue;
      missing.set(item.itemId, { itemId: item.itemId, shopId: order.shopId });
    }
  }
  return [...missing.values()];
}

function showProgress(message: string | null): void {
  const line = document.getElementById('categoryProgress');
  if (!line) return;
  line.textContent = message ?? '';
  line.classList.toggle('hidden', message === null);
}

async function fetchMissingCategories(tabId: number, orders: Order[]): Promise<CategorizeOutcome> {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.CATEGORIES]);
  const categories: CategoryMap = { ...(stored[STORAGE_KEYS.CATEGORIES] as CategoryMap | undefined) };
  const todo = missingItems(orders, categories);
  if (todo.length === 0) return { failed: 0 };

  let failed = 0;
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    for (let done = 0; done < todo.length; done += BATCH_SIZE) {
      if (done > 0) await new Promise(resolve => setTimeout(resolve, BATCH_GAP_MS));
      const progress = `Đang phân loại ${done}/${todo.length} sản phẩm...`;
      showProgress(progress);
      stallTimer = setTimeout(() => showProgress(STALL_WARNING), STALL_WARNING_MS);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (request: { items: ItemRequest[] }) => {
          (window as Window & { shopeeStatXCategoryRequest?: { items: ItemRequest[] } }).shopeeStatXCategoryRequest = request;
        },
        args: [{ items: todo.slice(done, done + BATCH_SIZE) }],
        world: 'MAIN' as chrome.scripting.ExecutionWorld,
      });
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        files: ['category-fetcher.js'],
        world: 'MAIN' as chrome.scripting.ExecutionWorld,
      });
      clearTimeout(stallTimer);

      const reply = results[0]?.result as CategoryResult | undefined;
      if (!reply) throw new Error('Không nhận được danh mục từ Shopee');
      const fetchedAt = new Date().toISOString();
      for (const [itemId, { path }] of Object.entries(reply.categories)) categories[itemId] = { path, fetchedAt };
      failed += reply.failed.length;

      // Saved batch by batch, so closing the tab midway keeps what has been read.
      await chrome.storage.local.set({ [STORAGE_KEYS.CATEGORIES]: categories });
      state.categories = categories;
      applyFilters();
    }
  } finally {
    clearTimeout(stallTimer);
    showProgress(null);
  }
  return { failed };
}

/** The orders are already on screen; a problem here must not turn them into an error screen. */
export async function categorize(tabId: number, orders: Order[]): Promise<void> {
  try {
    const { failed } = await fetchMissingCategories(tabId, orders);
    if (failed > 0) showToast(`Còn ${failed} sản phẩm chưa phân loại được, sẽ thử lại lần sau.`);
  } catch (error) {
    console.error('Category fetch error:', error);
    showToast(`Dừng phân loại: ${(error as Error).message}`);
  }
}
