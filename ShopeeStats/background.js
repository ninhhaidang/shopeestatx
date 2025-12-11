// Background service worker - handles opening results tab
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'openResults') {
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
  }
});
