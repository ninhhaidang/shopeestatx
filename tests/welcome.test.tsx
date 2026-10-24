import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Welcome } from '../src/welcome/Welcome';
import type { WelcomeHost } from '../src/welcome/host';
import { renderSurface } from './support/render';
import { mockColorScheme } from './support/match-media';

function makeHost(): WelcomeHost {
  return { openShopee: vi.fn(), openPrivacy: vi.fn() };
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Welcome', () => {

  it('opens Shopee from the call to action', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Welcome host={host} />);

    await user.click(screen.getByRole('button', { name: 'Mở Shopee ngay' }));
    expect(host.openShopee).toHaveBeenCalledOnce();
  });

  it('opens the privacy page from both privacy links, and links to GitHub', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Welcome host={host} />);

    const privacy = screen.getAllByRole('link', { name: /chính sách bảo mật/i });
    expect(privacy).toHaveLength(2);
    for (const link of privacy) await user.click(link);
    expect(host.openPrivacy).toHaveBeenCalledTimes(2);

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/ninhhaidang/shopeestatx');
  });

  it('switches to Dark and remembers it', async () => {
    const { user } = renderSurface(<Welcome host={makeHost()} />);

    await user.click(screen.getByRole('radio', { name: 'Tối' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shopeestatx-color-mode')).toBe('dark');
  });
});
