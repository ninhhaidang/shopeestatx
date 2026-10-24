import { getHomeUrl } from '../config.js';
import type { WelcomeHost } from './host';

export const chromeHost: WelcomeHost = {
  openShopee() {
    void chrome.tabs.create({ url: getHomeUrl() });
  },
  openPrivacy() {
    void chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  },
};
