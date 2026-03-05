// ShopeeStatX/welcome.js — Onboarding page interactions
// Extracted from welcome.html inline script to comply with MV3 CSP (no inline scripts)

document.getElementById('btnOpenShopee').addEventListener('click', function() {
  chrome.tabs.create({ url: 'https://shopee.vn' });
});

function openPrivacyPage(e) {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
}

document.getElementById('privacyLink').addEventListener('click', openPrivacyPage);
document.getElementById('footerPrivacy').addEventListener('click', openPrivacyPage);
