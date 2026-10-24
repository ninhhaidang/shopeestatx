// What the dashboard needs from its host (Chrome extension page, or the mock page outside Chrome).
// Keeps the component testable without a chrome.* mock.
import type { OrderData } from '../types/index.js';

export interface DashboardHost {
  /** Opened from the popup's "Bắt đầu phân tích": scan Shopee straight away instead of reading the cache. */
  readonly scanOnOpen: boolean;
  /** Orders cached by the last scan, or null when there are none. */
  loadCached(): Promise<OrderData | null>;
  /**
   * Scan Shopee (the existing order-list read, no new request) and persist.
   * Initial analysis replaces the cache; background refresh retains older orders for the same account.
   * `onProgress` reports how many orders have been fetched so far.
   */
  refresh(onProgress: (count: number) => void, mode: 'replace' | 'merge'): Promise<{ data: OrderData; added: number }>;
}
