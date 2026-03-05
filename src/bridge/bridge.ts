// Bridge script — runs in ISOLATED world, relays messages from MAIN world to extension

window.addEventListener('message', function (event: MessageEvent) {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== 'shopee-stats') return;
  chrome.runtime.sendMessage(event.data);
});
