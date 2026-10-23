// The single path that fetches orders from Shopee: first load, refresh and full reload all land here
import type { Order, OrderData } from '../types/index.js';
import { state } from './state.js';
import { initializeUI, updateLastUpdatedTime } from './data.js';
import { showToast } from './utils.js';
import { MESSAGE_SOURCE, SCHEMA_VERSION, STORAGE_KEYS } from '../config.js';

const STALL_WARNING_MS = 30_000;
const STALL_WARNING = 'Vẫn đang chờ Shopee phản hồi. Nếu quá lâu, hãy tải lại trang Shopee rồi thử lại.';
let running = false;

export type FetchRequest = 'auto' | 'incremental' | 'full';
type FetchMode = 'incremental' | 'full';

interface ContentResult {
  success: boolean;
  data?: OrderData;
  partial?: OrderData;
  error?: string;
}

const CURRENCY = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface PageRequest {
  mode: FetchMode;
  knownOrders?: Array<{ orderId: string; statusCode: number }>;
}

interface ProgressMessage {
  source: string;
  type: string;
  count: number;
}

const isStale = (cached: OrderData | undefined): boolean => !!cached && cached.schemaVersion !== SCHEMA_VERSION;

/** Incremental needs a current cache with orders to stop at; anything else, including a stale cache, is a full fetch. */
function chooseMode(requested: FetchRequest, cached: OrderData | undefined): FetchMode {
  const usable = !!cached && !isStale(cached) && cached.orders.length > 0;
  return requested !== 'full' && usable ? 'incremental' : 'full';
}

/** Fresh orders replace cached ones with the same id; cached-only orders are kept after them. */
function mergeOrders(fresh: Order[], cached: Order[]): Order[] {
  const freshIds = new Set(fresh.map(order => String(order.orderId)));
  return [...fresh, ...cached.filter(order => !freshIds.has(String(order.orderId)))];
}

function summarize(orders: Order[], base: OrderData, cached: OrderData | undefined): OrderData {
  const totalAmount = orders
    .filter(order => order.statusCode !== 4 && order.statusCode !== 12)
    .reduce((sum, order) => sum + order.subTotal, 0);
  return {
    ...base,
    user: base.user ?? cached?.user,
    orders,
    totalCount: orders.reduce((sum, order) => sum + order.productCount, 0),
    totalAmount,
    totalAmountFormatted: CURRENCY.format(totalAmount),
    cachedAt: new Date().toISOString(),
  };
}

function setHint(message: string): void {
  const hint = document.getElementById('loadingHint');
  if (hint) hint.textContent = message;
}

async function saveAndShow(data: OrderData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: data });
  state.allOrdersData = data;
  initializeUI(data);
  updateLastUpdatedTime(data.cachedAt);
}

export async function fetchOrders(requested: FetchRequest = 'auto'): Promise<void> {
  // One run at a time: a second click must not send a second burst of requests to Shopee.
  if (running) return;
  running = true;

  const buttons = ['btnRefresh', 'btnFullReload']
    .map(id => document.getElementById(id) as HTMLButtonElement | null)
    .filter((button): button is HTMLButtonElement => button !== null);
  buttons.forEach(button => { button.disabled = true; button.style.opacity = '0.6'; });

  let cachedData: OrderData | undefined;
  let cachedOrders: Order[] = [];
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  let onProgress: ((message: ProgressMessage) => void) | undefined;
  try {
    const storage = await chrome.storage.local.get([STORAGE_KEYS.STATS, STORAGE_KEYS.TAB_ID]);
    const tabId = storage[STORAGE_KEYS.TAB_ID] as number | undefined;
    const cached = storage[STORAGE_KEYS.STATS] as OrderData | undefined;
    cachedData = cached;
    cachedOrders = cached?.orders ?? [];
    if (!tabId) throw new Error('Không tìm thấy tab Shopee');

    const mode = chooseMode(requested, cached);
    const request: PageRequest = mode === 'incremental'
      ? { mode, knownOrders: (cached?.orders ?? []).map(order => ({ orderId: order.orderId, statusCode: order.statusCode })) }
      : { mode };

    document.getElementById('loadingText')!.textContent = 'Đang kết nối với Shopee...';
    if (mode === 'full' && isStale(cached)) {
      setHint('Cập nhật dữ liệu để có thêm thông tin mới. Vui lòng đừng đóng tab.');
    }
    document.getElementById('loading')!.classList.remove('hidden');
    document.getElementById('content')!.classList.add('hidden');

    const hint = document.getElementById('loadingHint');
    const defaultHint = hint?.textContent ?? '';
    const armStallWarning = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => setHint(STALL_WARNING), STALL_WARNING_MS);
    };
    armStallWarning();
    onProgress = message => {
      if (message.source !== MESSAGE_SOURCE || message.type !== 'progress') return;
      document.getElementById('loadingText')!.textContent = `Đã tải ${message.count} đơn hàng...`;
      setHint(defaultHint);
      armStallWarning();
    };
    chrome.runtime.onMessage.addListener(onProgress);

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['bridge.js'],
      world: 'ISOLATED' as chrome.scripting.ExecutionWorld,
    });
    // executeScript cannot pass arguments to a file, so hand the request to the page first.
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (pageRequest: PageRequest) => { (window as Window & { shopeeStatXRequest?: PageRequest }).shopeeStatXRequest = pageRequest; },
      args: [request],
      world: 'MAIN' as chrome.scripting.ExecutionWorld,
    });
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
      world: 'MAIN' as chrome.scripting.ExecutionWorld,
    });

    const result = results[0]?.result as ContentResult | undefined;
    if (!result) throw new Error('Không nhận được dữ liệu từ Shopee');
    if (!result.success) {
      const message = result.error || 'Có lỗi xảy ra khi lấy dữ liệu';
      const arrived = result.partial?.orders ?? [];
      if (arrived.length === 0) throw new Error(message);
      // Keep what did arrive, but leave the schema version alone so the next load tries again.
      await saveAndShow({
        ...summarize(mergeOrders(arrived, cached?.orders ?? []), result.partial!, cached),
        schemaVersion: cached?.schemaVersion,
      });
      showToast(`Lỗi cập nhật: ${message}. Đã lưu ${arrived.length} đơn hàng đã tải được.`);
      return;
    }

    const fresh = result.data!;
    const merged: OrderData = {
      ...summarize(mergeOrders(fresh.orders, cached?.orders ?? []), fresh, cached),
      schemaVersion: SCHEMA_VERSION,
    };
    await saveAndShow(merged);

    const cachedIds = new Set((cached?.orders ?? []).map(order => String(order.orderId)));
    const added = fresh.orders.filter(order => !cachedIds.has(String(order.orderId))).length;
    if (mode === 'incremental') {
      showToast(added > 0 ? `Đã thêm ${added} đơn hàng mới!` : 'Dữ liệu đã cập nhật. Không có đơn hàng mới.');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    const message = (error as Error).message;
    if (cachedOrders.length > 0) {
      // Keep showing the data we already have rather than an empty error screen.
      initializeUI(state.allOrdersData ?? cachedData!);
      showToast(`Lỗi cập nhật: ${message}`);
    } else {
      document.getElementById('loading')!.classList.add('hidden');
      const noData = document.getElementById('noData')!;
      noData.classList.remove('hidden');
      noData.querySelector('p')!.textContent = message;
    }
  } finally {
    clearTimeout(stallTimer);
    if (onProgress) chrome.runtime.onMessage.removeListener(onProgress);
    running = false;
    buttons.forEach(button => { button.disabled = false; button.style.opacity = ''; });
  }
}
