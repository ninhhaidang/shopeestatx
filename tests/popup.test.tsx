import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Popup } from '../src/popup/Popup';
import type { PopupHost } from '../src/popup/host';
import { renderSurface } from './support/render';
import { mockColorScheme } from './support/match-media';

function makeHost(overrides: Partial<PopupHost> = {}): PopupHost {
  return {
    getUser: vi.fn().mockResolvedValue(null),
    isOnShopee: vi.fn().mockResolvedValue(true),
    startAnalysis: vi.fn().mockResolvedValue(undefined),
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

  it('warns and disables the start button when Shopee is not open', async () => {
    const host = makeHost({ isOnShopee: vi.fn().mockResolvedValue(false) });
    renderSurface(<Popup host={host} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Vui lòng mở Shopee và đăng nhập trước.');
    expect(screen.getByRole('button', { name: 'Bắt đầu phân tích' })).toBeDisabled();
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

    expect(await screen.findByRole('link', { name: 'Ủng hộ' })).toHaveAttribute('href', expect.stringContaining('buymeacoffee'));
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', expect.stringContaining('github.com'));
    expect(screen.getByRole('link', { name: 'Đánh giá' })).toHaveAttribute('href', expect.stringContaining('chromewebstore'));

    await user.click(screen.getByRole('button', { name: 'Hướng dẫn' }));
    await user.click(screen.getByRole('button', { name: 'Chính sách bảo mật' }));
    expect(host.openHelp).toHaveBeenCalledOnce();
    expect(host.openPrivacy).toHaveBeenCalledOnce();
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
  it('defaults to Auto and follows the system scheme', async () => {
    const scheme = mockColorScheme('dark');
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByRole('radio', { name: 'Tự động' })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe('dark');

    scheme.set('light');
    await vi.waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
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

  it('ignores a corrupt stored value and falls back to Auto', async () => {
    localStorage.setItem('shopeestatx-color-mode', 'orange');
    renderSurface(<Popup host={makeHost()} />);

    expect(await screen.findByRole('radio', { name: 'Tự động' })).toBeChecked();
  });
});
