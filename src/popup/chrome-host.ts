import { getActiveDomainUrl, getLoginUrl, STORAGE_KEYS } from '../config.js';
import { isExcludedOrder } from '../dashboard/order-status.js';
import type { OrderData } from '../types/index.js';
import type { PopupHost, PopupUser } from './host';

export const chromeHost: PopupHost = {
  async getUser() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
      const stats = result[STORAGE_KEYS.STATS] as
        | { user?: { avatar?: string; name?: string; username?: string } }
        | undefined;
      const user = stats?.user;
      const name = user?.username || user?.name;
      return user && name ? ({ name, avatar: user.avatar } satisfies PopupUser) : null;
    } catch (error) {
      console.warn('Failed to load user info from storage:', error);
      return null;
    }
  },

  async getCache() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
      const stats = result[STORAGE_KEYS.STATS] as OrderData | undefined;
      if (!stats?.orders?.length) return null;
      // Same count as the dashboard's "Số đơn": cancelled, returned and unpaid orders are left out.
      return { orders: stats.orders.filter((o) => !isExcludedOrder(o)).length, updatedAt: stats.cachedAt ?? stats.fetchedAt };
    } catch (error) {
      console.warn('Failed to load cached orders from storage:', error);
      return null;
    }
  },

  async isOnShopee() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const url = new URL(tab?.url ?? '');
      // The collector fetches https://shopee.vn with same-origin cookies; any other origin cannot be read.
      return url.protocol === 'https:' && url.hostname === getActiveDomainUrl();
    } catch {
      return false;
    }
  },

  async startAnalysis() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.local.set({ [STORAGE_KEYS.TAB_ID]: tab.id });
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard-app/dashboard.html?fetch=true') });
    window.close();
  },

  openLogin() {
    void chrome.tabs.create({ url: getLoginUrl() });
    window.close();
  },

  openDashboard() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('dashboard-app/dashboard.html') });
    window.close();
  },

  openHelp() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  },

  openPrivacy() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  },
};
