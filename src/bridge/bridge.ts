// Bridge script — runs in ISOLATED world, relays messages from MAIN world to extension
import { MESSAGE_SOURCE } from '../config.js';

window.addEventListener('message', function (event: MessageEvent) {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== MESSAGE_SOURCE || message.type !== 'progress') return;
  if (!Number.isSafeInteger(message.count) || message.count < 0) return;
  // Page messages may report progress, but must never invoke extension commands.
  chrome.runtime.sendMessage({ source: MESSAGE_SOURCE, type: 'progress', count: message.count });
});
