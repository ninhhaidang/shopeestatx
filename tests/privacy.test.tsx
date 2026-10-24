import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Privacy } from '../src/privacy/Privacy';
import { renderSurface } from './support/render';
import { mockColorScheme } from './support/match-media';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Privacy', () => {
  it('shows the title, brand and last-updated date', () => {
    renderSurface(<Privacy />);

    expect(screen.getByRole('heading', { level: 1, name: 'Chính sách bảo mật' })).toBeInTheDocument();
    expect(screen.getByText(/Cập nhật lần cuối: 05\/03\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy / Politique de confidentialité')).toBeInTheDocument();
  });

  it('keeps all seven numbered sections in order', () => {
    renderSurface(<Privacy />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      '1. Tổng quan (Overview)',
      '2. Dữ liệu được truy cập (Data Accessed)',
      '3. Quyền truy cập và lý do (Permissions)',
      '4. Dữ liệu không được chia sẻ (No Data Sharing)',
      '5. Lưu trữ dữ liệu (Data Storage)',
      '6. Tuyên bố miễn trừ (Disclaimer)',
      '7. Liên hệ (Contact)',
    ]);
  });

  it('lists the four permissions with their reasons in a table', () => {
    renderSurface(<Privacy />);

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    for (const name of ['activeTab', 'storage', 'scripting', 'https://shopee.vn/*']) {
      expect(within(table).getByRole('cell', { name })).toBeInTheDocument();
    }
  });

  it('states the no-sharing promise and the data-storage rules', () => {
    renderSurface(<Privacy />);

    expect(screen.getByText(/Toàn bộ dữ liệu đơn hàng chỉ tồn tại trên máy của bạn/)).toBeInTheDocument();
    expect(screen.getByText('Sử dụng analytics hay tracking')).toBeInTheDocument();
    expect(screen.getByText('Gỡ cài đặt extension')).toBeInTheDocument();
  });

  it('links to the GitHub issues and profile', () => {
    renderSurface(<Privacy />);

    expect(screen.getByRole('link', { name: 'github.com/ninhhaidang/shopeestatx/issues' })).toHaveAttribute(
      'href',
      'https://github.com/ninhhaidang/shopeestatx/issues',
    );
    expect(screen.getByRole('link', { name: 'github.com/ninhhaidang' })).toHaveAttribute('href', 'https://github.com/ninhhaidang');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/ninhhaidang/shopeestatx');
  });

  it('switches to Dark and remembers it', async () => {
    const { user } = renderSurface(<Privacy />);

    await user.click(screen.getByRole('radio', { name: 'Tối' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shopeestatx-color-mode')).toBe('dark');
  });
});
