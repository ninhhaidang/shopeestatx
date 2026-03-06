// Background service worker - handles opening results tab and first-run onboarding

// Show welcome page on first install
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'openResults') {
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
  }
});
