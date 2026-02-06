document.addEventListener('DOMContentLoaded', function() {
  const btnStart = document.getElementById('btnStart');
  const warning = document.getElementById('warning');

  // Check if current tab is shopee.vn
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url || '';

    if (!url.includes('shopee.vn')) {
      warning.classList.remove('hidden');
      btnStart.disabled = true;
    }
  });

  btnStart.addEventListener('click', async function() {
    // Get current shopee tab ID
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Store the shopee tab ID for results page to use
    await chrome.storage.local.set({ shopeeTabId: tab.id });

    // Open results page immediately (it will handle fetching)
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html?fetch=true') });

    // Close popup
    window.close();
  });
});
