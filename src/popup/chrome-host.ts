import { getActiveDomainUrl, getLoginUrl, STORAGE_KEYS } from '../config.js';
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

  async isOnShopee() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? '';
    const domain = getActiveDomainUrl();
    return url.includes(domain) || url.includes('www.' + domain);
  },

  async startAnalysis() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.local.set({ [STORAGE_KEYS.TAB_ID]: tab.id });
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/results.html?fetch=true') });
    window.close();
  },

  openLogin() {
    void chrome.tabs.create({ url: getLoginUrl() });
    window.close();
  },

  openHelp() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  },

  openPrivacy() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  },
};
