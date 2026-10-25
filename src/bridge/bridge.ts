// Bridge script — runs in ISOLATED world, relays messages from MAIN world to extension
import { MESSAGE_SOURCE } from '../config.js';

const bridgeWindow = window as Window & { __shopeestatxBridge?: (event: MessageEvent) => void };
if (bridgeWindow.__shopeestatxBridge) window.removeEventListener('message', bridgeWindow.__shopeestatxBridge);
bridgeWindow.__shopeestatxBridge = (event: MessageEvent) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== MESSAGE_SOURCE || message.type !== 'progress') return;
  if (!Number.isSafeInteger(message.count) || message.count < 0 || typeof message.scanId !== 'string' || !message.scanId) return;
  // Page messages can report scan progress, never invoke extension commands.
  void chrome.runtime.sendMessage({ source: MESSAGE_SOURCE, type: 'progress', scanId: message.scanId, count: message.count });
};
window.addEventListener('message', bridgeWindow.__shopeestatxBridge);
