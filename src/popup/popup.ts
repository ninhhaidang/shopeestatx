// Popup script — domain check and start analysis trigger
import { initLocale } from '../i18n/index.js';

document.addEventListener('DOMContentLoaded', function () {
  initLocale();
  const btnStart = document.getElementById('btnStart') as HTMLButtonElement;
  const warning = document.getElementById('warning')!;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url || '';

    if (!url.includes('shopee.vn')) {
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
    await chrome.storage.local.set({ shopeeTabId: tab.id });
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/results.html?fetch=true') });
    window.close();
  });
});
