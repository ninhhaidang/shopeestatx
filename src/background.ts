// Background service worker — handles opening results tab and first-run onboarding

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
});

chrome.runtime.onMessage.addListener(function (message: { type: string }) {
  if (message.type === 'openResults') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/results.html') });
  }
});
