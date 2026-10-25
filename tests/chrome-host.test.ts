import { afterEach, describe, expect, it, vi } from 'vitest';
import { chromeHost } from '../src/dashboard-app/chrome-host';
import { STORAGE_KEYS } from '../src/config';
import type { OrderData, UserProfile } from '../src/types';
import { makeData, makeOrder } from './support/orders';

const profile = (username: string, ids: Partial<Pick<UserProfile, 'userId' | 'uid'>> = {}): UserProfile => ({ username, avatar: '', ...ids });

afterEach(() => vi.unstubAllGlobals());

describe('Chrome scan account isolation', () => {
  it.each([
    { label: 'same numeric ID with changed display name', cached: profile('Old name', { userId: 1 }), fresh: profile('New name', { userId: 1 }), keep: true },
    { label: 'different numeric IDs with identical names', cached: profile('Name', { userId: 1 }), fresh: profile('Name', { userId: 2 }), keep: false },
    { label: 'same uid with changed name', cached: profile('Old', { uid: 'uid-a' }), fresh: profile('New', { uid: 'uid-a' }), keep: true },
    { label: 'different uids with identical names', cached: profile('Name', { uid: 'uid-a' }), fresh: profile('Name', { uid: 'uid-b' }), keep: false },
    { label: 'mini-session to account-basic-info fallback', cached: profile('Display name', { userId: 1 }), fresh: profile('login_name'), keep: true },
    { label: 'non-comparable ID types', cached: profile('Display', { userId: 1 }), fresh: profile('Login', { uid: 'uid-a' }), keep: true },
    { label: 'matching username without IDs', cached: profile('login'), fresh: profile('login'), keep: true },
    { label: 'different usernames without IDs', cached: profile('login_a'), fresh: profile('login_b'), keep: false },
    { label: 'missing fresh profile', cached: profile('login'), fresh: null, keep: true },
  ])('refresh handles $label', async ({ cached, fresh, keep }) => {
    let stored = makeData([makeOrder('2026-10-01T10:00:00', { orderId: 'CACHED', subTotal: 450000 })], { user: cached });
    const result = makeData([], { user: fresh });
    installChrome(() => stored, value => { stored = value; }, result);

    const scan = await chromeHost.refresh(() => {}, 'merge');

    expect(scan.data.orders.map(o => o.orderId)).toEqual(keep ? ['CACHED'] : []);
    expect(scan.data.totalAmount).toBe(keep ? 450000 : 0);
    expect(stored.orders).toEqual(scan.data.orders);
    expect(stored.user).toEqual(fresh ?? cached);
  });

  it('does not carry the previous profile or orders into a new analysis with no profile', async () => {
    let stored = makeData([makeOrder('2026-10-01T10:00:00')], { user: profile('previous') });
    installChrome(() => stored, value => { stored = value; }, makeData([], { user: null }));

    await chromeHost.refresh(() => {}, 'replace');

    expect(stored.orders).toEqual([]);
    expect(stored.user).toBeUndefined();
  });
});

function installChrome(read: () => OrderData, persist: (data: OrderData) => void, fresh: OrderData) {
  const metadata: Record<string, unknown> = {};
  vi.stubGlobal('chrome', {
    storage: { local: {
      get: async () => ({ ...metadata, [STORAGE_KEYS.STATS]: read(), [STORAGE_KEYS.TAB_ID]: 123 }),
      set: async (value: Record<string, unknown>) => {
        Object.assign(metadata, value);
        if (STORAGE_KEYS.STATS in value) persist(value[STORAGE_KEYS.STATS] as OrderData);
      },
    } },
    runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
    scripting: { executeScript: async ({ files }: { files?: string[] }) => files?.[0] === 'content.js' ? [{ result: { success: true, data: fresh } }] : [] },
  });
}
