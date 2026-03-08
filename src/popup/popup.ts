// Popup script — domain check and start analysis trigger
import { initLocale } from '../i18n/index.js';
import { getActiveDomainUrl, getPurchaseUrl, STORAGE_KEYS } from '../config.js';

document.addEventListener('DOMContentLoaded', function () {
  initLocale();
  const btnStart = document.getElementById('btnStart') as HTMLButtonElement;
  const warning = document.getElementById('warning')!;

  // Set dynamic shopee link
  const shopeeLink = document.getElementById('shopee-purchase-link') as HTMLAnchorElement;
  if (shopeeLink) {
    shopeeLink.href = getPurchaseUrl();
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url || '';

    if (!url.includes(getActiveDomainUrl())) {
      warning.classList.remove('hidden');
      btnStart.disabled = true;
    }
  });

  document.getElementById('btnHelp')!.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  });

  document.getElementById('btnPrivacy')!.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
  });

  btnStart.addEventListener('click', async function () {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.local.set({ [STORAGE_KEYS.TAB_ID]: tab.id });
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/results.html?fetch=true') });
    window.close();
  });
});
