// Bridge script - runs in ISOLATED world
// Listens for messages from MAIN world and forwards to extension

window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== 'shopee-stats') return;

  // Forward message to extension
  chrome.runtime.sendMessage(event.data);
});
