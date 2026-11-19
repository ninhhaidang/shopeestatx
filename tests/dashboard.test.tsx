import { act, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import { chromeHost } from '../src/dashboard-app/chrome-host';
import { STORAGE_KEYS } from '../src/config';
import type { OrderData } from '../src/types';
import { mockColorScheme } from './support/match-media';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

// The artwork is drawn on a canvas jsdom does not have; what the dialog asks for is asserted.
const shareImage = vi.hoisted(() => ({ copyShareImage: vi.fn(), downloadShareImage: vi.fn(), drawShareImage: vi.fn() }));
vi.mock('../src/dashboard/share-image', async original => ({ ...(await original<typeof import('../src/dashboard/share-image')>()), ...shareImage }));

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
  shareImage.downloadShareImage.mockClear();
  shareImage.copyShareImage.mockReset();
});

describe('Tổng quan', () => {
  it('leads with Chi tiêu ròng, the change against last month and the four metric tiles', async () => {
    renderDashboard();

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(hero()).toHaveTextContent(/1\.300\.000/);
    // October and 2026 are still running on 24/10, so both compare the same days of the period before.
    expect(screen.getByTestId('month-change')).toHaveTextContent('Tháng 10/2026, đến ngày 24: 450.000 ₫ · ↑ 50% so với cùng kỳ tháng 9/2026');
    expect(screen.getByTestId('year-change')).toHaveTextContent('Năm 2026, đến 24/10: 750.000 ₫ · ↑ 36,4% so với cùng kỳ năm 2025');
    expect(tile('Số đơn')).toHaveTextContent('4');
    expect(tile('Trung bình/đơn')).toHaveTextContent('325k');
    expect(tile('Hoàn tiền')).toHaveTextContent('900k');
    expect(tile('Tiết kiệm ước tính')).toHaveTextContent('50k');
  });

  it('ranks the top shops by spend', async () => {
    renderDashboard();

    const list = within(await screen.findByRole('list', { name: 'Top shop' }));
    const rows = list.getAllByRole('listitem').map(li => li.textContent);
    expect(rows[0]).toMatch(/Alpha.*650k/);
    expect(rows[1]).toMatch(/Gamma.*550k/);
    expect(rows[2]).toMatch(/Beta.*100k/);
  });

  it('opens a top shop’s orders in Đơn hàng, filtered by that shop', async () => {
    const { user } = renderDashboard();
    const list = within(await screen.findByRole('list', { name: 'Top shop' }));

    await user.click(list.getByRole('button', { name: /Alpha/ }));
    const ordersTab = screen.getByRole('tab', { name: 'Đơn hàng' });
    expect(ordersTab).toHaveAttribute('aria-selected', 'true');
    expect(ordersTab).toHaveFocus();
    const shop = screen.getByRole('combobox', { name: 'Lọc theo shop' }) as HTMLSelectElement;
    expect(shop.selectedOptions[0].textContent).toBe('a - Alpha');

    // Coming back through the tab bar starts unfiltered again.
    await user.click(screen.getByRole('tab', { name: 'Tổng quan' }));
    await user.click(screen.getByRole('tab', { name: 'Đơn hàng' }));
    expect((screen.getByRole('combobox', { name: 'Lọc theo shop' }) as HTMLSelectElement).value).toBe('');
  });

  const bars = () => [...document.querySelectorAll('[data-month]')];
  const bar = (month: string) => document.querySelector(`[data-month="${month}"]`)!;

  it('charts spend per month over the whole history and offers the same numbers as a year-by-month table', async () => {
    const { user } = renderDashboard();

    await screen.findByRole('heading', { name: 'Chi tiêu theo tháng' });
    // 8/2025 to 10/2026 is 15 months; the twelve without orders still have a column.
    const months = bars().map(el => el.getAttribute('data-month'));
    expect(months).toHaveLength(15);
    expect([months[0], months[13], months[14]]).toEqual(['8/2025', '9/2026', '10/2026']);
    // 1.3M over 15 months: the dashed average line and the summary both say so.
    expect(screen.getByRole('img', { name: /Chi tiêu theo tháng, 15 cột, trung bình 86\.667\s₫ mỗi tháng/ })).toBeInTheDocument();
    expect(screen.getByTestId('chart-average')).toHaveTextContent('Trung bình 87k/tháng');

    await user.click(screen.getByRole('radio', { name: 'Bảng số liệu' }));
    const cells = within(screen.getByRole('row', { name: /^2026/ })).getAllByRole('cell').map(td => td.textContent);
    // Twelve months then the year total; September is the ninth month.
    expect(cells).toHaveLength(13);
    expect(cells[8]).toBe('300k');
    expect(cells[9]).toBe('450k');
    expect(cells[10]).toBe('');
    expect(cells[12]).toBe('750k');
  });

  it('turns the month table on its side when narrow: a row per month, a column per year', async () => {
    vi.stubGlobal('ResizeObserver', class {
      constructor(private report: (entries: { contentRect: { width: number; height: number } }[]) => void) {}
      observe() {
        this.report([{ contentRect: { width: 300, height: 340 } }]);
      }
      disconnect() {}
    });
    try {
      const { user } = renderDashboard();
      await user.click(await screen.findByRole('radio', { name: 'Bảng số liệu' }));

      const headers = within(screen.getByRole('region', { name: 'Chi tiêu theo tháng' })).getAllByRole('columnheader').map(th => th.textContent);
      expect(headers).toEqual(['Tháng', '2025', '2026']);
      expect(within(screen.getByRole('row', { name: /^Th9/ })).getAllByRole('cell').map(td => td.textContent)).toEqual(['–', '300k']);
      expect(within(screen.getByRole('row', { name: /^Cả năm/ })).getAllByRole('cell').map(td => td.textContent)).toEqual(['550k', '750k']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows a month\u2019s figure on hover or arrow keys and picks it with Enter', async () => {
    const { user } = renderDashboard();
    await screen.findByRole('heading', { name: 'Chi tiêu theo tháng' });

    await user.hover(bar('9/2026'));
    expect(screen.getByTestId('chart-tip')).toHaveTextContent(/Tháng 9\/2026.*300\.000/);

    screen.getByRole('group', { name: /Chi tiêu theo tháng\. Dùng phím mũi tên/ }).focus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(hero()).toHaveTextContent(/450\.000/);
  });

  it('picks a month when its bar is clicked and clears on a second click', async () => {
    const { user } = renderDashboard();
    await screen.findByRole('heading', { name: 'Chi tiêu theo tháng' });

    await user.click(bar('8/2025'));
    expect(hero()).toHaveTextContent(/550\.000/);
    // The other months stay on the chart for comparison.
    expect(bars()).toHaveLength(15);

    await user.click(bar('8/2025'));
    expect(hero()).toHaveTextContent(/1\.300\.000/);
  });

  it('creates the share image from the aggregate stats of the selected range, in the chosen artwork and size', async () => {
    const { user } = renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Tạo ảnh khoe' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Tạo ảnh khoe' }));
    await user.click(dialog.getByRole('radio', { name: 'Khoảng đang chọn' }));
    await user.click(dialog.getByRole('radio', { name: 'Đêm' }));
    await user.click(dialog.getByRole('radio', { name: 'Story 9:16' }));
    await user.click(dialog.getByRole('button', { name: 'Lưu ảnh' }));

    expect(shareImage.downloadShareImage).toHaveBeenCalledOnce();
    const [data, template, ratio] = shareImage.downloadShareImage.mock.calls[0];
    expect(data).toMatchObject({ stats: { netSpend: 1_300_000 }, financialAvailable: true, orders: 4, year: undefined });
    expect(data.monthly.at(-1)).toBe(450_000);
    expect([template, ratio]).toEqual(['night', 'story']);
  });

  it('copies the image from any screen and says whether the browser allowed it', async () => {
    shareImage.copyShareImage.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'));
    const { user } = renderDashboard();

    await user.click(await screen.findByRole('tab', { name: 'Phân tích' }));
    await user.click(screen.getByRole('button', { name: 'Tạo ảnh khoe' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Tạo ảnh khoe' }));
    await user.click(dialog.getByRole('button', { name: 'Sao chép ảnh' }));
    expect(await dialog.findByText(/Đã sao chép/)).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Sao chép ảnh' }));
    expect(await dialog.findByText(/Hãy dùng Lưu ảnh/)).toBeInTheDocument();
    // The latest year leads: 2026 has three counted orders (one is cancelled).
    expect(shareImage.copyShareImage).toHaveBeenCalledWith(expect.objectContaining({ year: 2026, orders: 3, stats: expect.objectContaining({ netSpend: 750_000 }) }), 'label', 'square');
  });

  it('puts the year card on Tổng quan: save straight away, or customise in the dialog', async () => {
    const { user } = renderDashboard();

    const card = within(await screen.findByRole('region', { name: 'Tổng kết Shopee 2026 của bạn' }));
    await user.click(card.getByRole('button', { name: 'Lưu ảnh' }));
    // 2026's second half has three paid orders but only 750.000 ₫: short of Bạc (1.000.000 ₫).
    expect(shareImage.downloadShareImage).toHaveBeenCalledWith(expect.objectContaining({ year: 2026, tier: null }), 'label', 'square');

    await user.click(card.getByRole('button', { name: 'Tuỳ chỉnh…' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Tạo ảnh khoe' }));
    expect(dialog.getByRole('radio', { name: 'Năm 2026' })).toBeChecked();
  });

  it('remembers the artwork and size: the year card and the next dialog start there', async () => {
    const { user, unmount } = renderDashboard();

    await user.click(await screen.findByRole('button', { name: 'Tạo ảnh khoe' }));
    let dialog = within(screen.getByRole('dialog', { name: 'Tạo ảnh khoe' }));
    await user.click(dialog.getByRole('radio', { name: 'Giáng sinh' }));
    await user.click(dialog.getByRole('radio', { name: 'Story 9:16' }));
    await user.click(dialog.getByRole('button', { name: 'Đóng' }));

    const card = within(screen.getByRole('region', { name: 'Tổng kết Shopee 2026 của bạn' }));
    await user.click(card.getByRole('button', { name: 'Lưu ảnh' }));
    expect(shareImage.downloadShareImage).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2026 }), 'xmas', 'story');

    unmount();
    const again = renderDashboard();
    await again.user.click(await screen.findByRole('button', { name: 'Tạo ảnh khoe' }));
    dialog = within(screen.getByRole('dialog', { name: 'Tạo ảnh khoe' }));
    expect(dialog.getByRole('radio', { name: 'Giáng sinh' })).toBeChecked();
    expect(dialog.getByRole('radio', { name: 'Story 9:16' })).toBeChecked();
  });

  it('carries a Kim Cương tier from 2025 into the 2026 year card', async () => {
    const history = [
      ...Array.from({ length: 75 }, (_, i) => makeOrder(`2025-08-${String((i % 28) + 1).padStart(2, '0')}T10:00:00`, { subTotal: 200_000 })),
      makeOrder('2026-02-10T10:00:00', { subTotal: 100_000 }),
    ];
    const { user } = renderDashboard(makeHost({ loadCached: vi.fn().mockResolvedValue(makeData(history)) }));

    const card = within(await screen.findByRole('region', { name: 'Tổng kết Shopee 2026 của bạn' }));
    await user.click(card.getByRole('button', { name: 'Lưu ảnh' }));
    expect(shareImage.downloadShareImage).toHaveBeenCalledWith(expect.objectContaining({ year: 2026, orders: 1, tier: 'diamond' }), 'label', 'square');
  });

  it('opens the share dialog by itself when the popup asked for it', async () => {
    renderDashboard(makeHost({ shareOnOpen: true }));

    expect(await screen.findByRole('dialog', { name: 'Tạo ảnh khoe' })).toBeInTheDocument();
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

describe('người dùng', () => {
  it('shows the account name and avatar in the top bar', async () => {
    const withUser = makeData(ORDERS, { user: { username: 'ninh.dang', name: 'Ninh', avatar: 'https://cf.shopee.vn/file/abc' } });
    renderDashboard(makeHost({ loadCached: vi.fn().mockResolvedValue(withUser) }));

    const user = await screen.findByTestId('account');
    expect(user).toHaveTextContent('ninh.dang');
    expect(user.querySelector('img')).toHaveAttribute('src', 'https://cf.shopee.vn/file/abc');
  });

  it('shows no account chip when the data has no user', async () => {
    renderDashboard();
    await screen.findByText('Chi tiêu ròng');
    expect(screen.queryByTestId('account')).not.toBeInTheDocument();
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
    expect(tile('Hoàn tiền')).toHaveTextContent('900k');
  });

  it('says which calendar months the change compares, whatever the range total is', async () => {
    const { user } = renderDashboard();
    await screen.findByText('Chi tiêu ròng');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');
    expect(hero()).toHaveTextContent(/750\.000/);
    expect(screen.getByTestId('month-change')).toHaveTextContent('Tháng 10/2026, đến ngày 24: 450.000 ₫ · ↑ 50% so với cùng kỳ tháng 9/2026');

    // The comparison follows the range's last month: September, which is over, against all of August.
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

describe('bảng bên', () => {
  it('offers a full tab only inside the side panel', async () => {
    const openInTab = vi.fn();
    const { user } = renderDashboard(makeHost({ inSidePanel: vi.fn().mockResolvedValue(true), openInTab }));

    await user.click(await screen.findByRole('button', { name: 'Mở toàn màn hình' }));
    expect(openInTab).toHaveBeenCalledOnce();
  });

  it('shows no full-tab button in a tab', async () => {
    renderDashboard(makeHost({ inSidePanel: vi.fn().mockResolvedValue(false), openInTab: vi.fn() }));

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mở toàn màn hình' })).not.toBeInTheDocument();
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

  it.each([
    { scanOnOpen: true, hasOrders: false },
    { scanOnOpen: true, hasOrders: true },
    { scanOnOpen: false, hasOrders: true },
  ])('isolates accounts on scan (initial: $scanOnOpen, has orders: $hasOrders)', async ({ scanOnOpen, hasOrders }) => {
    const previous = makeData([makeOrder('2026-09-01T10:00:00', { orderId: 'A_ONLY', subTotal: 450_000 })], {
      user: { username: 'account_A', avatar: '' },
    });
    const fresh = makeData(hasOrders ? [makeOrder('2026-10-01T10:00:00', { orderId: 'B_ONLY', subTotal: 150_000 })] : [], {
      user: { username: 'account_B', avatar: '' },
    });
    let stored = previous;
    const metadata: Record<string, unknown> = {};
    vi.stubGlobal('chrome', {
      storage: { local: {
        get: async () => ({ ...metadata, [STORAGE_KEYS.STATS]: stored, [STORAGE_KEYS.TAB_ID]: 123 }),
        set: async (value: Record<string, unknown>) => {
          Object.assign(metadata, value);
          if (STORAGE_KEYS.STATS in value) stored = value[STORAGE_KEYS.STATS] as OrderData;
        },
      } },
      runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
      scripting: { executeScript: async ({ files }: { files?: string[] }) => files?.[0] === 'content.js' ? [{ result: { success: true, data: fresh } }] : [] },
    });
    try {
      const { user } = renderDashboard({ ...chromeHost, scanOnOpen });
      if (!scanOnOpen) {
        expect(await screen.findByTestId('net-spend')).toHaveTextContent(/450\.000/);
        await user.click(screen.getByRole('button', { name: 'Làm mới' }));
      }
      if (hasOrders) {
        await waitFor(() => expect(hero()).toHaveTextContent(/150\.000/));
      } else {
        expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument();
      }
      expect(stored.orders.map(o => o.orderId)).toEqual(hasOrders ? ['B_ONLY'] : []);
      expect(stored.user?.username).toBe('account_B');

      if (hasOrders) {
        fresh.orders = [];
        await user.click(screen.getByRole('button', { name: 'Làm mới' }));
        await screen.findByText('Không có đơn hàng mới');
        expect(hero()).toHaveTextContent(/150\.000/);
        expect(stored.orders.map(o => o.orderId)).toEqual(['B_ONLY']);
      }
    } finally {
      vi.unstubAllGlobals();
    }
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
    const { user } = renderDashboard(makeHost({ scanOnOpen: true, refresh, loadCached: vi.fn().mockResolvedValue(null) }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy tab Shopee');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('shows the saved orders when the opening scan fails', async () => {
    const refresh = vi.fn().mockRejectedValue(new Error('Không tìm thấy tab Shopee'));
    renderDashboard(makeHost({ scanOnOpen: true, refresh }));

    expect(await screen.findByText('Chi tiêu ròng')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Không tìm thấy tab Shopee');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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

});
