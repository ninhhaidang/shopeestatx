// Bridge script — runs in ISOLATED world, relays messages from MAIN world to extension
import { MESSAGE_SOURCE } from '../config.js';

window.addEventListener('message', function (event: MessageEvent) {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== MESSAGE_SOURCE) return;
  chrome.runtime.sendMessage(event.data);
});
