// Onboarding page interactions
import { initLocale } from '../i18n/index.js';

initLocale();

document.getElementById('btnOpenShopee')!.addEventListener('click', function () {
  chrome.tabs.create({ url: 'https://shopee.vn' });
});

function openPrivacyPage(e: Event): void {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
}

document.getElementById('privacyLink')!.addEventListener('click', openPrivacyPage);
document.getElementById('footerPrivacy')!.addEventListener('click', openPrivacyPage);
