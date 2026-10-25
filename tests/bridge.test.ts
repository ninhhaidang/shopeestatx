import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('page-to-extension bridge', () => {
  let listener: EventListener;
  const sendMessage = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    sendMessage.mockClear();
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    const addListener = vi.spyOn(window, 'addEventListener');
    // Loading the injected script registers its listener; spy must exist before import.
    await import('../src/bridge/bridge');
    const registration = addListener.mock.calls.find(([type]) => type === 'message');
    listener = registration![1] as EventListener;
  });

  afterEach(() => {
    window.removeEventListener('message', listener);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('relays only validated progress fields from the page', () => {
    window.dispatchEvent(new MessageEvent('message', {
      source: window,
      data: { source: 'shopee-stats', type: 'progress', scanId: 'scan-one', count: 20, unexpected: 'discard me' },
    }));
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith({ source: 'shopee-stats', type: 'progress', scanId: 'scan-one', count: 20 });
  });

  it('delivers a page progress event once after reinjection', async () => {
    vi.resetModules();
    await import('../src/bridge/bridge');
    window.dispatchEvent(new MessageEvent('message', {
      source: window,
      data: { source: 'shopee-stats', type: 'progress', scanId: 'scan-two', count: 40 },
    }));
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith({ source: 'shopee-stats', type: 'progress', scanId: 'scan-two', count: 40 });
  });

  it('does not let page scripts invoke the background openResults command', () => {
    window.dispatchEvent(new MessageEvent('message', {
      source: window,
      data: { source: 'shopee-stats', type: 'openResults' },
    }));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it.each([undefined, -1, NaN, Infinity, 1.5, '20'])(
    'rejects malformed progress count %j', count => {
      window.dispatchEvent(new MessageEvent('message', {
        source: window,
        data: { source: 'shopee-stats', type: 'progress', count },
      }));
      expect(sendMessage).not.toHaveBeenCalled();
    },
  );

  it('ignores messages not sent by the current page window', () => {
    window.dispatchEvent(new MessageEvent('message', {
      source: null,
      data: { source: 'shopee-stats', type: 'progress', count: 20 },
    }));
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
