// Popup script — domain check and start analysis trigger
import { initLocale } from '../i18n/index.js';
import { getActiveDomainUrl, getPurchaseUrl, getLoginUrl, STORAGE_KEYS } from '../config.js';

document.addEventListener('DOMContentLoaded', async function () {
  await initLocale();

  // Load user info from cached stats
  const userGreetingEl = document.getElementById('userGreeting');
  const userAvatarEl = document.getElementById('userAvatar') as HTMLImageElement;
  const userNameEl = document.getElementById('userName') as HTMLSpanElement;
  const featureCardEl = document.getElementById('featureCard');

  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.STATS);
    const statsData = result[STORAGE_KEYS.STATS];

    if (statsData?.user && userAvatarEl && userNameEl) {
      const { user } = statsData;
      if (user.avatar) {
        userAvatarEl.src = user.avatar;
      }
      const displayName = user.username || user.name || '';
      userNameEl.textContent = displayName;
      userGreetingEl?.classList.remove('hidden');
      featureCardEl?.classList.add('hidden');
    }
  } catch (error) {
    console.warn('Failed to load user info from storage:', error);
  }

  const btnStart = document.getElementById('btnStart') as HTMLButtonElement;
  const redirecting = document.getElementById('redirecting')!;

  // Set dynamic shopee link
  const shopeeLink = document.getElementById('shopee-purchase-link') as HTMLAnchorElement;
  if (shopeeLink) {
    shopeeLink.href = getPurchaseUrl();
  }

  // Check if user is on Shopee domain
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url || '';
    const domain = getActiveDomainUrl();

    // Check for domain with and without www
    const isOnShopee = url.includes(domain) || url.includes('www.' + domain);

    console.log('Popup URL:', url);
    console.log('Domain:', domain);
    console.log('Is on Shopee:', isOnShopee);

    if (!isOnShopee) {
      // Not on Shopee - show message with link to Shopee
      redirecting.classList.remove('hidden');
      btnStart.disabled = true;
    }
  });

  // Handle Shopee login link click
  document.getElementById('shopee-login-link')?.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: getLoginUrl() });
    window.close();
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
