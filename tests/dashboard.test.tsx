import { act, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import type { OrderData } from '../src/types';
import { mockColorScheme } from './support/match-media';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

// jsdom has no canvas. Chart.js is the one boundary we fake; what the chart was given is asserted.
const charts = vi.hoisted(() => [] as { config: { data: { labels: string[]; datasets: { data: number[] }[] } }; destroyed: boolean }[]);
vi.mock('chart.js', () => {
  class Chart {
    static register() {}
    destroyed = false;
    constructor(_canvas: unknown, public config: (typeof charts)[number]['config']) {
      charts.push(this);
    }
    destroy() {
      this.destroyed = true;
    }
  }
  return { Chart, BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Tooltip: {} };
});

const shareImage = vi.hoisted(() => ({ downloadShareImage: vi.fn() }));
vi.mock('../src/dashboard/share-image', () => shareImage);

const NOW = new Date(2026, 9, 24, 12, 0); // 24 Oct 2026, noon

// Net spend over all time: 200k + 100k + 450k + 550k = 1.3M (the 900k order is cancelled).
const ORDERS = [
  makeOrder('2025-08-10T10:00:00', { subTotal: 550_000, shopName: 'g - Gamma' }),
  makeOrder('2026-09-05T10:00:00', { subTotal: 200_000, shopName: 'a - Alpha' }),
  makeOrder('2026-09-20T10:00:00', { subTotal: 100_000, shopName: 'b - Beta' }),
  makeOrder('2026-10-02T10:00:00', { subTotal: 450_000, itemsTotal: 500_000, shopName: 'a - Alpha' }),
  makeOrder('2026-10-03T10:00:00', { subTotal: 900_000, statusCode: 4, refundAmount: 900_000, shopName: 'c - Gamma2' }),
];
const DATA = makeData(ORDERS, { cachedAt: new Date(2026, 9, 24, 10, 0).toISOString() });

function makeHost(overrides: Partial<DashboardHost> = {}): DashboardHost {
  return {
    scanOnOpen: false,
    loadCached: vi.fn().mockResolvedValue(DATA),
    refresh: vi.fn().mockResolvedValue({ data: DATA, added: 0 }),
    ...overrides,
  };
}

function renderDashboard(host: DashboardHost = makeHost()) {
  return renderSurface(<Dashboard host={host} now={() => NOW} />);
}

const tile = (label: string) => screen.getByText(label).closest('div')!;
const hero = () => screen.getByTestId('net-spend');

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
  charts.length = 0;
  shareImage.downloadShareImage.mockClear();
});

describe('Tổng quan', () => {
  it('leads with Chi tiêu ròng, the change against last month and the four metric tiles', async () => {
    renderDashboard();

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(hero()).toHaveTextContent(/1\.300\.000/);
    expect(screen.getByTestId('month-change')).toHaveTextContent('Tháng 10/2026: 450.000 ₫ · ↑ 50% so với tháng 9/2026');
    expect(screen.getByTestId('year-change')).toHaveTextContent('Năm 2026: 750.000 ₫ · ↑ 36,4% so với năm 2025');
    expect(tile('Số đơn')).toHaveTextContent('4');
    expect(tile('Trung bình/đơn')).toHaveTextContent('325K');
    expect(tile('Hoàn tiền')).toHaveTextContent('900K');
    expect(tile('Tiết kiệm ước tính')).toHaveTextContent('50K');
  });

  it('ranks the top shops by spend', async () => {
    renderDashboard();

    const list = within(await screen.findByRole('list', { name: 'Top shop' }));
    const rows = list.getAllByRole('listitem').map(li => li.textContent);
    expect(rows[0]).toMatch(/Alpha.*650K/);
    expect(rows[1]).toMatch(/Gamma.*550K/);
    expect(rows[2]).toMatch(/Beta.*100K/);
  });

  it('charts spend per month and offers the same numbers as a table', async () => {
    const { user } = renderDashboard();

    await screen.findByRole('heading', { name: 'Chi tiêu theo tháng' });
    const chart = charts.at(-1)!;
    expect(chart.config.data.labels).toEqual(['8/2025', '9/2026', '10/2026']);
    expect(chart.config.data.datasets[0].data).toEqual([550_000, 300_000, 450_000]);
    expect(screen.getByRole('img', { name: /Chi tiêu theo tháng/ })).toBeInTheDocument();

    await user.click(screen.getByText('Xem bảng số liệu'));
    const row = screen.getByRole('row', { name: /9\/2026/ });
    expect(row).toHaveTextContent(/300\.000/);
  });

  it('creates the share image from the aggregate stats of the selected range', async () => {
    const { user } = renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Khoe với bạn bè (tạo ảnh)' }));

    expect(shareImage.downloadShareImage).toHaveBeenCalledOnce();
    expect(shareImage.downloadShareImage.mock.calls[0][0]).toMatchObject({ netSpend: 1_300_000 });
  });

  it('shows "—" and a re-scan prompt for Hoàn tiền and Tiết kiệm when the cache predates them', async () => {
    const stale = makeData([makeOrder('2026-10-02T10:00:00', { refundAmount: undefined })]);
    const host = makeHost({ loadCached: vi.fn().mockResolvedValue(stale) });
    const { user } = renderDashboard(host);

    expect(await screen.findByText(/Dữ liệu cũ chưa có số liệu hoàn tiền/)).toBeInTheDocument();
    expect(tile('Hoàn tiền')).toHaveTextContent('—');
    expect(tile('Tiết kiệm ước tính')).toHaveTextContent('—');

    await user.click(screen.getByRole('button', { name: 'Phân tích lại' }));
    expect(host.refresh).toHaveBeenCalledOnce();
  });
});

describe('khoảng ngày toàn cục', () => {
  it('updates the Tổng quan figures when the range changes', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');
    expect(hero()).toHaveTextContent(/750\.000/);
    expect(tile('Số đơn')).toHaveTextContent('3');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng này');
    expect(hero()).toHaveTextContent(/450\.000/);
    expect(tile('Số đơn')).toHaveTextContent('1');
    expect(tile('Hoàn tiền')).toHaveTextContent('900K');
  });

  it('says which calendar months the change compares, whatever the range total is', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');
    expect(hero()).toHaveTextContent(/750\.000/);
    expect(screen.getByTestId('month-change')).toHaveTextContent('Tháng 10/2026: 450.000 ₫ · ↑ 50% so với tháng 9/2026');

    // The comparison follows the range's last month: September against August.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');
    expect(hero()).toHaveTextContent(/300\.000/);
    expect(screen.getByTestId('month-change')).toHaveTextContent('Tháng 9/2026: 300.000 ₫ · Chưa có dữ liệu tháng 8/2026');
  });

  it('filters by a chosen year, offering the years that have orders', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Theo năm');
    const year = screen.getByRole('combobox', { name: 'Năm' });
    expect(within(year).getAllByRole('option').map(o => o.textContent)).toEqual(['2026', '2025']);
    expect(hero()).toHaveTextContent(/750\.000/); // defaults to the latest year

    await user.selectOptions(year, '2025');
    expect(hero()).toHaveTextContent(/550\.000/);
  });

  it('filters by a chosen month of a year', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Theo tháng');
    expect(hero()).toHaveTextContent(/450\.000/); // this month

    await user.selectOptions(screen.getByRole('combobox', { name: 'Tháng' }), 'Tháng 9');
    expect(hero()).toHaveTextContent(/300\.000/);
  });

  it('offers the last 7 days', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), '7 ngày qua');
    expect(screen.getByText('Không có đơn hàng trong khoảng này')).toBeInTheDocument(); // newest order is 3 Oct
  });

  it('accepts a custom range', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tùy chỉnh');
    await user.type(screen.getByLabelText('Từ ngày'), '2026-09-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2026-09-30');

    expect(hero()).toHaveTextContent(/300\.000/);
  });

  it('is kept when switching tabs', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');

    await user.click(screen.getByRole('tab', { name: 'Đơn hàng' }));
    await user.click(screen.getByRole('tab', { name: 'Tổng quan' }));

    expect(screen.getByRole('combobox', { name: 'Khoảng thời gian' })).toHaveDisplayValue('Năm nay');
    expect(hero()).toHaveTextContent(/750\.000/);
  });

  it('explains an empty range and offers to see everything again', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tùy chỉnh');
    await user.type(screen.getByLabelText('Từ ngày'), '2030-01-01');
    expect(screen.getByText('Không có đơn hàng trong khoảng này')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem tất cả' }));
    expect(hero()).toHaveTextContent(/1\.300\.000/);
    expect(screen.getByRole('combobox', { name: 'Khoảng thời gian' })).toHaveDisplayValue('Tất cả');
  });
});

describe('tab', () => {
  it('starts on Tổng quan and switches to the Phân tích and Đơn hàng screens', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Phân tích' }));
    expect(screen.getByRole('tab', { name: 'Phân tích' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Thói quen mua sắm');
    expect(screen.queryByText('Chi tiêu ròng')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Đơn hàng' }));
    expect(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' })).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    screen.getByRole('tab', { name: 'Tổng quan' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Phân tích' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Phân tích' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveFocus();
  });
});

describe('tải dữ liệu', () => {
  it('shows a skeleton while the cache loads', () => {
    renderDashboard(makeHost({ loadCached: vi.fn(() => new Promise<OrderData | null>(() => {})) }));

    expect(screen.getByRole('status', { name: 'Đang tải dữ liệu' })).toBeInTheDocument();
    expect(screen.queryByText('Chi tiêu ròng')).not.toBeInTheDocument();
  });

  it('reports scan progress with the number of orders fetched', async () => {
    let report!: (n: number) => void;
    const host = makeHost({
      scanOnOpen: true,
      refresh: vi.fn((onProgress: (n: number) => void) => {
        report = onProgress;
        return new Promise<{ data: OrderData; added: number }>(() => {});
      }),
    });
    renderDashboard(host);

    expect(await screen.findByText('Đang kết nối với Shopee...')).toBeInTheDocument();
    act(() => report(120));
    expect(screen.getByText('Đã tải 120 đơn hàng...')).toBeInTheDocument();
  });

  it('warns when Shopee stops responding for a while', async () => {
    vi.useFakeTimers();
    try {
      renderDashboard(makeHost({ scanOnOpen: true, refresh: vi.fn(() => new Promise<{ data: OrderData; added: number }>(() => {})) }));
      expect(screen.queryByText(/Vẫn đang chờ Shopee/)).not.toBeInTheDocument();

      await act(() => vi.advanceTimersByTimeAsync(30_000));
      expect(screen.getByText(/Vẫn đang chờ Shopee/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens straight into a scan when launched from the popup', async () => {
    const host = makeHost({ scanOnOpen: true });
    renderDashboard(host);

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(host.refresh).toHaveBeenCalledOnce();
    expect(host.loadCached).not.toHaveBeenCalled();
  });

  it('explains when there are no orders yet and can fetch them', async () => {
    const host = makeHost({ loadCached: vi.fn().mockResolvedValue(null) });
    const { user } = renderDashboard(host);

    expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lấy dữ liệu' }));

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(host.refresh).toHaveBeenCalledOnce();
  });

  it('shows the failure with a retry that recovers', async () => {
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error('Không tìm thấy tab Shopee'))
      .mockResolvedValueOnce({ data: DATA, added: 4 });
    const { user } = renderDashboard(makeHost({ scanOnOpen: true, refresh }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy tab Shopee');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the cache cannot be read', async () => {
    renderDashboard(makeHost({ loadCached: vi.fn().mockRejectedValue(new Error('storage lỗi')) }));
    expect(await screen.findByRole('alert')).toHaveTextContent('storage lỗi');
  });
});

describe('làm mới', () => {
  it('shows when the data was updated', async () => {
    renderDashboard();
    expect(await screen.findByText('Cập nhật: 2 giờ trước')).toBeInTheDocument();
  });

  it('refreshes in place, says how many orders are new and keeps the screen', async () => {
    const fresh = makeData([...ORDERS, makeOrder('2026-10-20T10:00:00', { subTotal: 50_000 })], { cachedAt: NOW.toISOString() });
    const refresh = vi.fn().mockResolvedValue({ data: fresh, added: 1 });
    const { user } = renderDashboard(makeHost({ refresh }));
    await screen.findByText('Chi tiêu ròng');

    await user.click(screen.getByRole('button', { name: 'Làm mới' }));

    expect(await screen.findByText('Đã thêm 1 đơn hàng mới')).toBeInTheDocument();
    expect(hero()).toHaveTextContent(/1\.350\.000/);
    expect(screen.getByText('Cập nhật: vừa xong')).toBeInTheDocument();
  });

  it('keeps the data and reports the error when a refresh fails', async () => {
    const refresh = vi.fn().mockRejectedValue(new Error('mất mạng'));
    const { user } = renderDashboard(makeHost({ refresh }));
    await screen.findByText('Chi tiêu ròng');

    await user.click(screen.getByRole('button', { name: 'Làm mới' }));

    expect(await screen.findByText('Lỗi cập nhật: mất mạng')).toBeInTheDocument();
    expect(hero()).toHaveTextContent(/1\.300\.000/);
    expect(screen.getByRole('button', { name: 'Làm mới' })).toBeEnabled();
  });
});

describe('giao diện sáng/tối', () => {
  it('switches to Dark from the top bar and remembers it', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.click(screen.getByRole('radio', { name: 'Tối' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('shopeestatx-color-mode')).toBe('dark');
  });

  it('follows the system scheme in Auto', async () => {
    mockColorScheme('dark');
    renderDashboard();
    await screen.findByText('Chi tiêu ròng');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('rebuilds the chart in the new theme', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');
    const before = charts.length;

    await user.click(screen.getByRole('radio', { name: 'Tối' }));

    expect(charts.length).toBeGreaterThan(before);
    expect(charts[before - 1].destroyed).toBe(true);
  });
});
