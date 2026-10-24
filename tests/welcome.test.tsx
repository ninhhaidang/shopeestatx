import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
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
  it('introduces the product with the brand, tagline and version', () => {
    renderSurface(<Welcome host={makeHost()} />);

    expect(screen.getByRole('heading', { level: 1, name: 'ShopeeStatX' })).toBeInTheDocument();
    expect(screen.getByText('Theo dõi và phân tích toàn bộ chi tiêu Shopee của bạn')).toBeInTheDocument();
    expect(screen.getByText('v3.1')).toBeInTheDocument();
  });

  it('keeps the three feature cards', () => {
    renderSurface(<Welcome host={makeHost()} />);

    expect(screen.getByRole('heading', { name: 'Extension này làm gì?' })).toBeInTheDocument();
    for (const name of ['Lấy toàn bộ lịch sử', 'Phân tích trực quan', 'Xuất dữ liệu']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByText('Export toàn bộ lịch sử đơn hàng ra file Excel (.xlsx)')).toBeInTheDocument();
  });

  it('explains each permission', () => {
    renderSurface(<Welcome host={makeHost()} />);

    const section = screen.getByRole('region', { name: 'Tại sao cần các quyền này?' });
    for (const name of ['activeTab', 'storage', 'scripting', 'shopee.vn']) {
      expect(within(section).getByText(name)).toBeInTheDocument();
    }
    expect(within(section).getByText('Kiểm tra bạn đang ở shopee.vn trước khi bắt đầu')).toBeInTheDocument();
    expect(within(section).getByText(/Dữ liệu của bạn không rời khỏi máy/)).toBeInTheDocument();
  });

  it('lists the four steps in order', () => {
    renderSurface(<Welcome host={makeHost()} />);

    const steps = within(screen.getByRole('list', { name: 'Cách sử dụng' })).getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('Đăng nhập Shopee');
    expect(steps[3]).toHaveTextContent('Khám phá dữ liệu');
  });

  it('opens Shopee from the call to action', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Welcome host={host} />);

    await user.click(screen.getByRole('button', { name: 'Mở Shopee ngay' }));
    expect(host.openShopee).toHaveBeenCalledOnce();
    expect(screen.getByText('Extension chỉ hoạt động khi bạn đang ở shopee.vn và đã đăng nhập')).toBeInTheDocument();
  });

  it('opens the privacy page from both privacy links, and links to GitHub', async () => {
    const host = makeHost();
    const { user } = renderSurface(<Welcome host={host} />);

    const privacy = screen.getAllByRole('link', { name: /chính sách bảo mật/i });
    expect(privacy).toHaveLength(2);
    for (const link of privacy) await user.click(link);
    expect(host.openPrivacy).toHaveBeenCalledTimes(2);

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/ninhhaidang/shopeestatx');
    expect(screen.getByText('ShopeeStatX không liên kết với Shopee chính thức')).toBeInTheDocument();
  });

  it('switches to Dark and remembers it', async () => {
    const { user } = renderSurface(<Welcome host={makeHost()} />);

    await user.click(screen.getByRole('radio', { name: 'Tối' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shopeestatx-color-mode')).toBe('dark');
  });
});
