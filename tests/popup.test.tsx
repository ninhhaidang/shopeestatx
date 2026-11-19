import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Popup } from '../src/popup/Popup';
import type { PopupHost } from '../src/popup/host';
import { chromeHost } from '../src/popup/chrome-host';
import { SCAN_REQUEST, SHARE_REQUEST, STORAGE_KEYS } from '../src/config';
import { renderSurface } from './support/render';
import { mockColorScheme } from './support/match-media';

function makeHost(overrides: Partial<PopupHost> = {}): PopupHost {
  return {
    getUser: vi.fn().mockResolvedValue(null),
    getCache: vi.fn().mockResolvedValue(null),
    isOnShopee: vi.fn().mockResolvedValue(true),
    startAnalysis: vi.fn().mockResolvedValue(undefined),
    openDashboard: vi.fn(),
    openLogin: vi.fn(),
    openHelp: vi.fn(),
    openPrivacy: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

afterEach(() => vi.unstubAllGlobals());

describe('Popup', () => {
  it('greets the cached user by name', async () => {
    const host = makeHost({ getUser: vi.fn().mockResolvedValue({ name: 'minh_anh' }) });
    renderSurface(<Popup host={host} />);

    expect(await screen.findByText('minh_anh')).toBeInTheDocument();
    expect(screen.getByText(/Xin chào/)).toBeInTheDocument();
  });

  it('introduces the product when there is no cached user', async () => {
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByText('Phân tích chi tiêu thông minh')).toBeInTheDocument();
    expect(screen.queryByText(/Xin chào/)).not.toBeInTheDocument();
  });

  it('keeps the start button disabled while the tab check is pending', () => {
    renderSurface(<Popup host={makeHost({ isOnShopee: () => new Promise<boolean>(() => {}) })} />);

    expect(screen.getByRole('button', { name: 'Bắt đầu phân tích' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('replaces the start button with Open Shopee when Shopee is not open', async () => {
    const host = makeHost({ isOnShopee: vi.fn().mockResolvedValue(false) });
    renderSurface(<Popup host={host} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Vui lòng mở Shopee và đăng nhập trước.');
    expect(screen.queryByRole('button', { name: 'Bắt đầu phân tích' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mở Shopee và đăng nhập' })).toBeEnabled();
  });

  it.each([
    ['https://example.com/?next=https://shopee.vn', false],
    ['https://shopee.vn.example.com', false],
    ['https://notshopee.vn', false],
    ['https://shopee.vn@example.com', false],
    ['not a URL shopee.vn', false],
    ['ftp://shopee.vn', false],
    ['javascript://shopee.vn', false],
    ['https://shopee.sg', false],
    [undefined, false],
    ['https://shopee.vn/user/purchase', true],
    ['https://www.shopee.vn', false],
    ['https://mall.shopee.vn', false],
    ['https://SHOPEE.VN', true],
    ['http://shopee.vn', false],
  ])('gates scanning for active tab %s through the Chrome host', async (url, allowed) => {
    vi.stubGlobal('chrome', {
      tabs: { query: vi.fn().mockResolvedValue([{ url }]) },
      storage: { local: { get: vi.fn().mockResolvedValue({}) } },
    });
    renderSurface(<Popup host={chromeHost} />);

    const start = screen.getByRole('button', { name: 'Bắt đầu phân tích' });
    if (allowed) {
      await vi.waitFor(() => expect(start).toBeEnabled());
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    } else {
      expect(await screen.findByRole('status')).toHaveTextContent('Vui lòng mở Shopee và đăng nhập trước.');
      expect(start).not.toBeInTheDocument();
    }
  });

  it('opens the Shopee login from the warning', async () => {
    const host = makeHost({ isOnShopee: vi.fn().mockResolvedValue(false) });
    const { user } = renderSurface(<Popup host={host} />);

    await user.click(await screen.findByRole('button', { name: 'Mở Shopee và đăng nhập' }));
    expect(host.openLogin).toHaveBeenCalledOnce();
  });

  it('shows no warning and starts the analysis when on Shopee', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Popup host={host} />);

    const start = await screen.findByRole('button', { name: 'Bắt đầu phân tích' });
    await vi.waitFor(() => expect(start).toBeEnabled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.click(start);
    expect(host.startAnalysis).toHaveBeenCalledOnce();
  });

  it('links to support, GitHub and the store, and opens help and privacy', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Popup host={host} />);

    expect(await screen.findByRole('link', { name: 'Ủng hộ tác giả' })).toHaveAttribute('href', expect.stringContaining('buymeacoffee'));
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', expect.stringContaining('github.com'));
    expect(screen.getByRole('link', { name: 'Đánh giá trên Chrome Web Store' })).toHaveAttribute('href', expect.stringContaining('chromewebstore'));

    await user.click(screen.getByRole('button', { name: 'Hướng dẫn' }));
    await user.click(screen.getByRole('button', { name: 'Chính sách bảo mật' }));
    expect(host.openHelp).toHaveBeenCalledOnce();
    expect(host.openPrivacy).toHaveBeenCalledOnce();
  });

  it('summarises the cached orders and opens the dashboard on them without scanning', async () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const host = makeHost({
      getUser: vi.fn().mockResolvedValue({ name: 'minh_anh' }),
      getCache: vi.fn().mockResolvedValue({ orders: 1234, updatedAt: '2026-11-17T10:00:00Z' }),
    });
    const { user } = renderSurface(<Popup host={host} now={now} />);

    expect(await screen.findByText('1.234 đơn · Cập nhật: 2 giờ trước')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở dashboard (dữ liệu đã lưu)' }));
    expect(host.openDashboard).toHaveBeenCalledWith();
    expect(host.startAnalysis).not.toHaveBeenCalled();
  });

  it('leads with the share image once orders are cached', async () => {
    const host = makeHost({ getCache: vi.fn().mockResolvedValue({ orders: 3, updatedAt: '2026-11-17T10:00:00Z' }) });
    const { user } = renderSurface(<Popup host={host} />);

    await screen.findByRole('button', { name: 'Tạo ảnh khoe' });
    const buttons = screen.getAllByRole('button').map(b => b.textContent);
    expect(buttons.slice(0, 3)).toEqual(['Tạo ảnh khoe', 'Mở dashboard (dữ liệu đã lưu)', 'Bắt đầu phân tích']);
    await user.click(screen.getByRole('button', { name: 'Tạo ảnh khoe' }));
    expect(host.openDashboard).toHaveBeenCalledWith(true);
  });

  it('offers the saved dashboard off Shopee too, and not at all without cached orders', async () => {
    const offShopee = makeHost({
      isOnShopee: vi.fn().mockResolvedValue(false),
      getCache: vi.fn().mockResolvedValue({ orders: 3, updatedAt: '2026-11-17T10:00:00Z' }),
    });
    const { unmount } = renderSurface(<Popup host={offShopee} />);
    expect(await screen.findByRole('button', { name: 'Mở dashboard (dữ liệu đã lưu)' })).toBeEnabled();
    unmount();

    renderSurface(<Popup host={makeHost()} />);
    await screen.findByRole('button', { name: 'Bắt đầu phân tích' });
    expect(screen.queryByRole('button', { name: 'Mở dashboard (dữ liệu đã lưu)' })).not.toBeInTheDocument();
  });

  it('counts cached orders as the dashboard does and reads the cache time', async () => {
    const orders = [3, 3, 4, 12, 9, 7].map((statusCode, i) => ({ orderId: String(i), statusCode }));
    const get = vi.fn().mockResolvedValue({ [STORAGE_KEYS.STATS]: { orders, fetchedAt: 'old', cachedAt: '2026-11-17T10:00:00Z' } });
    vi.stubGlobal('chrome', { storage: { local: { get } } });

    expect(await chromeHost.getCache()).toEqual({ orders: 3, updatedAt: '2026-11-17T10:00:00Z' });

    get.mockResolvedValue({ [STORAGE_KEYS.STATS]: { orders: [], fetchedAt: 'x' } });
    expect(await chromeHost.getCache()).toBeNull();
  });

  it('is operable by keyboard: Tab reaches the start button and Enter activates it', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Popup host={host} />);
    const start = await screen.findByRole('button', { name: 'Bắt đầu phân tích' });
    await vi.waitFor(() => expect(start).toBeEnabled());

    start.focus();
    await user.keyboard('{Enter}');
    expect(host.startAnalysis).toHaveBeenCalledOnce();
  });
});

describe('Popup theme', () => {
  it('defaults to Light even when the system prefers dark', async () => {
    mockColorScheme('dark');
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByRole('radio', { name: 'Sáng' })).toBeChecked();
    expect(screen.queryByRole('radio', { name: 'Tự động' })).not.toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('switches to Dark, applies it and remembers the choice', async () => {
    const { user } = renderSurface(<Popup host={makeHost()} />);

    await user.click(await screen.findByRole('radio', { name: 'Tối' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Tối' })).toBeChecked();
    expect(localStorage.getItem('shopeestatx-color-mode')).toBe('dark');
  });

  it('restores a stored choice on the next open', async () => {
    localStorage.setItem('shopeestatx-color-mode', 'dark');
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByRole('radio', { name: 'Tối' })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores a corrupt stored value and falls back to Light', async () => {
    localStorage.setItem('shopeestatx-color-mode', 'orange');
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByRole('radio', { name: 'Sáng' })).toBeChecked();
  });
});

describe('Chrome popup host opens the dashboard', () => {
  function installChrome(open: () => Promise<void>) {
    const chrome = {
      tabs: { query: vi.fn().mockResolvedValue([{ id: 7, windowId: 3 }]), create: vi.fn().mockResolvedValue({}) },
      windows: { getCurrent: vi.fn().mockResolvedValue({ id: 3 }) },
      storage: { local: { set: vi.fn().mockResolvedValue(undefined) } },
      runtime: { getURL: (path: string) => `chrome-extension://x/${path}` },
      sidePanel: { setOptions: vi.fn().mockResolvedValue(undefined), open: vi.fn(open) },
    };
    vi.stubGlobal('chrome', chrome);
    vi.stubGlobal('close', vi.fn());
    return chrome;
  }

  it('starts the analysis in the side panel with a one-time scan token', async () => {
    const chrome = installChrome(async () => {});

    await chromeHost.startAnalysis();

    const token = localStorage.getItem(SCAN_REQUEST);
    expect(token).toBeTruthy();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ [STORAGE_KEYS.TAB_ID]: 7 });
    expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ path: `dashboard-app/dashboard.html?fetch=${token}`, enabled: true });
    expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 3 });
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it('opens the dashboard with a one-time share token', async () => {
    const chrome = installChrome(async () => {});

    await chromeHost.openDashboard(true);

    const token = localStorage.getItem(SHARE_REQUEST);
    expect(token).toBeTruthy();
    expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ path: `dashboard-app/dashboard.html?share=${token}`, enabled: true });
  });

  it('falls back to a tab when Chrome refuses the side panel', async () => {
    const chrome = installChrome(() => Promise.reject(new Error('needs a user gesture')));

    await chromeHost.openDashboard();

    expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ path: 'dashboard-app/dashboard.html', enabled: true });
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://x/dashboard-app/dashboard.html' });
  });
});
