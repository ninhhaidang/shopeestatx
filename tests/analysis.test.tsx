import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../src/config';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import { mockColorScheme } from './support/match-media';
import type { OrderData } from '../src/types';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

const NOW = new Date(2026, 9, 24, 12, 0); // Saturday 24 Oct 2026, noon

// 5 Oct and 12 Oct 2026 are Mondays, delivered at 20:xx; 15 Sep 2026 is a Tuesday.
const ORDERS = [
  makeOrder('2025-08-10T10:00:00', { subTotal: 90_000, shopName: 'x - Old Shop', items: [{ name: 'Ốp lưng', quantity: 1, unitPrice: 90_000 }] }),
  makeOrder('2026-09-15T09:00:00', { subTotal: 100_000, shopName: 'a - Alpha', items: [{ name: 'Cốc sứ', quantity: 1, unitPrice: 50_000 }] }),
  makeOrder('2026-10-05T20:30:00', { subTotal: 200_000, shopName: 'a - Alpha', items: [{ name: 'Áo thun', quantity: 2, unitPrice: 100_000 }] }),
  makeOrder('2026-10-12T20:10:00', { subTotal: 400_000, shopName: 'b - Beta', items: [{ name: 'Áo thun', quantity: 1, unitPrice: 100_000 }, { name: 'Giày', quantity: 1, unitPrice: 300_000 }] }),
  makeOrder('2026-10-13T08:00:00', { subTotal: 700_000, statusCode: 4, refundAmount: 700_000, shopName: 'c - Gamma', items: [{ name: 'Laptop', quantity: 1, unitPrice: 700_000 }] }),
];
const DATA = makeData(ORDERS, { cachedAt: new Date(2026, 9, 24, 10, 0).toISOString() });

function makeHost(data: OrderData = DATA): DashboardHost {
  return { scanOnOpen: false, loadCached: vi.fn().mockResolvedValue(data), refresh: vi.fn().mockResolvedValue({ data, added: 0 }) };
}

async function openAnalysis(data: OrderData = DATA) {
  const view = renderSurface(<Dashboard host={makeHost(data)} now={() => NOW} />);
  await screen.findByText('Chi tiêu ròng');
  await view.user.click(screen.getByRole('tab', { name: 'Phân tích' }));
  return view;
}

const tile = (label: string) => screen.getByText(label).closest('div')!;

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Phân tích: thói quen và sản phẩm', () => {
  it('shows the busiest weekday and hour, month streak and daily spend', async () => {
    await openAnalysis();

    expect(tile('Ngày hay nhận hàng')).toHaveTextContent('Thứ 2');
    expect(tile('Giờ hay nhận hàng')).toHaveTextContent('20:00 – 21:00');
    expect(tile('Chuỗi tháng liên tục')).toHaveTextContent('2 tháng');
    // 790k net over 10 Aug 2025 .. 12 Oct 2026 = 429 days (1841.49)
    expect(tile('Tốc độ chi tiêu')).toHaveTextContent(/1\.841/);
  });

  it('lists the most bought products, and the priciest on request', async () => {
    const { user } = await openAnalysis();

    const top = within(screen.getByRole('list', { name: 'Sản phẩm mua nhiều nhất' })).getAllByRole('listitem');
    expect(top[0]).toHaveTextContent(/Áo thun.*x3/);

    await user.click(screen.getByRole('radio', { name: 'Đắt nhất' }));
    const priciest = within(screen.getByRole('list', { name: 'Sản phẩm đắt nhất' })).getAllByRole('listitem');
    expect(priciest[0]).toHaveTextContent(/Giày.*300\.000/);
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument(); // cancelled order
  });

  it('shows five products until asked for all of them', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ name: `Món ${i}`, quantity: 8 - i, unitPrice: 10_000 }));
    const { user } = await openAnalysis(makeData([makeOrder('2026-10-05T20:30:00', { subTotal: 360_000, items })]));
    const rows = () => within(screen.getByRole('list', { name: 'Sản phẩm mua nhiều nhất' })).getAllByRole('listitem');
    expect(rows()).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Xem cả 8' }));
    expect(rows()).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(rows()).toHaveLength(5);
  });
});

describe('Phân tích: heatmap', () => {
  it('summarises the heatmap and lists every day with orders for screen readers', async () => {
    await openAnalysis();

    const heatmap = screen.getByRole('img', { name: /Số đơn theo ngày.*3 ngày có đơn.*3 đơn/ });
    expect(heatmap).toBeInTheDocument();

    const rows = screen.getAllByRole('row').map(r => r.textContent);
    expect(rows.some(r => /15\/9\/2026.*1/.test(r!))).toBe(true);
    expect(rows.some(r => /12\/10\/2026.*1/.test(r!))).toBe(true);
    expect(rows.some(r => /10\/8\/2025/.test(r!))).toBe(false); // older than 12 months
  });

  it('stacks the year in strips instead of scrolling when the card is narrow', async () => {
    vi.stubGlobal('ResizeObserver', class {
      constructor(private report: (entries: { contentRect: { width: number } }[]) => void) {}
      observe() {
        this.report([{ contentRect: { width: 296 } }]);
      }
      disconnect() {}
    });
    try {
      await openAnalysis();

      const heatmap = screen.getByRole('img', { name: /Số đơn theo ngày/ });
      expect(heatmap.querySelectorAll('svg')).toHaveLength(2);
      expect(heatmap.querySelectorAll('rect').length).toBeGreaterThanOrEqual(365);
      expect(new Set([...heatmap.querySelectorAll('rect')].map(r => r.dataset.date)).size).toBe(heatmap.querySelectorAll('rect').length);
      expect(screen.queryByRole('region', { name: /cuộn ngang/ })).not.toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('marks a day with orders and leaves an empty day plain', async () => {
    await openAnalysis();

    const cell = document.querySelector('[data-date="2026-10-12"]')!;
    expect(cell).toHaveAttribute('data-level', '1');
    expect(document.querySelector('[data-date="2026-10-11"]')).toHaveAttribute('data-level', '0');
  });
});

describe('Phân tích: shop thân thiết', () => {
  it('says there is not enough data when no shop has 3 orders', async () => {
    await openAnalysis();
    expect(screen.getByText(/Chưa đủ dữ liệu \(cần ít nhất 3 đơn mỗi shop\)/)).toBeInTheDocument();
  });

  it('lists repeat shops over the whole history, whatever the range', async () => {
    const repeat = makeData([
      makeOrder('2026-08-05T10:00:00', { subTotal: 100_000, shopName: 'a - Alpha' }),
      makeOrder('2026-09-05T10:00:00', { subTotal: 200_000, shopName: 'a - Alpha' }),
      makeOrder('2026-10-05T10:00:00', { subTotal: 300_000, shopName: 'a - Alpha' }),
      makeOrder('2026-10-06T10:00:00', { subTotal: 50_000, shopName: 'b - Beta' }),
    ]);
    const { user } = await openAnalysis(repeat);

    const row = () => screen.getByRole('row', { name: /Alpha/ });
    expect(row()).toHaveTextContent(/Alpha.*3.*600\.000.*200\.000.*1\/tháng.*5\/10\/2026/);
    expect(screen.queryByRole('row', { name: /Beta/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');
    expect(row()).toHaveTextContent(/Alpha.*3.*600\.000/); // September alone holds one of the three
  });

  it('opens a repeat shop’s orders in Đơn hàng, from the name or anywhere on the row', async () => {
    const repeat = makeData([1, 2, 3].map(day => makeOrder(`2026-10-0${day}T10:00:00`, { subTotal: 100_000, shopName: 'a - Alpha' })));
    const { user } = await openAnalysis(repeat);

    await user.click(within(screen.getByRole('row', { name: /Alpha/ })).getByText('300.000 ₫'));
    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toHaveAttribute('aria-selected', 'true');
    expect((screen.getByRole('combobox', { name: 'Lọc theo shop' }) as HTMLSelectElement).selectedOptions[0].textContent).toBe('a - Alpha');

    await user.click(screen.getByRole('tab', { name: 'Phân tích' }));
    await user.click(screen.getByRole('button', { name: 'Alpha, Xem đơn hàng' }));
    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Phân tích: sản phẩm', () => {
  it('opens the orders of a product in Đơn hàng, searched by its name', async () => {
    const { user } = await openAnalysis();
    const list = within(screen.getByRole('list', { name: 'Sản phẩm mua nhiều nhất' }));

    await user.click(list.getByRole('button', { name: /Áo thun/ }));
    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' })).toHaveValue('Áo thun');
  });
});

describe('Phân tích: khoảng ngày toàn cục', () => {
  it('follows the global range for habits', async () => {
    const { user } = await openAnalysis();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng này');

    expect(tile('Chuỗi tháng liên tục')).toHaveTextContent('1 tháng');
  });

  it('keeps insights on the whole history, whatever the range', async () => {
    const { user } = await openAnalysis();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');

    const list = within(screen.getByRole('list', { name: 'Phân tích chi tiêu' }));
    expect(list.getAllByRole('listitem')[0]).toHaveTextContent(/Tháng này bạn đã chi 600\.000.*tăng 500% so với cùng kỳ tháng trước/);
  });

  it('draws the heatmap over 12 months of the whole history ending at the range end', async () => {
    const { user } = await openAnalysis();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');

    // Last month ends 30/9/2026: the window is 1/10/2025 to 30/9/2026, so 15/9 shows and October does not.
    expect(screen.getByText(/Từ 1\/10\/2025 đến 30\/9\/2026/)).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /15\/9\/2026/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /5\/10\/2026/ })).not.toBeInTheDocument();
  });
});

describe('Phân tích: dự đoán và ngân sách', () => {
  it('does not save an enabled budget with a blank limit', async () => {
    const { user } = await openAnalysis();
    await user.click(await screen.findByRole('button', { name: 'Thiết lập' }));
    await user.clear(screen.getByLabelText('Hạn mức hàng tháng (VND)'));
    await user.click(screen.getByLabelText('Bật theo dõi ngân sách'));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(screen.getByRole('button', { name: 'Lưu' })).toBeVisible();
    expect(localStorage.getItem(STORAGE_KEYS.BUDGET)).toBeNull();
  });

  it('reports a budget that cannot be read instead of calling it not set up', async () => {
    vi.stubGlobal('chrome', {
      runtime: { lastError: { message: 'read failed' } },
      storage: { local: { get: (_key: unknown, callback: (result: object) => void) => callback({}) } },
    });
    try {
      await openAnalysis();
      expect(await screen.findByText('Không đọc được ngân sách đã lưu. Hãy tải lại trang.')).toBeVisible();
      expect(screen.queryByText('Chưa thiết lập ngân sách')).not.toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(['localStorage', 'chrome'])('preserves unsaved budget values after a save failure through %s', async (adapter) => {
    const { user } = await openAnalysis();
    await user.click(await screen.findByRole('button', { name: 'Thiết lập' }));
    const limit = screen.getByLabelText('Hạn mức hàng tháng (VND)');
    await user.clear(limit);
    await user.type(limit, '150000');
    fireEvent.change(screen.getByLabelText(/Cảnh báo tại/), { target: { value: '90' } });
    await user.click(screen.getByLabelText('Bật theo dõi ngân sách'));
    const failure = new Error('Storage full');
    if (adapter === 'chrome') {
      vi.stubGlobal('chrome', {
        runtime: { lastError: { message: failure.message } },
        storage: { local: { set: (_values: unknown, callback: () => void) => callback() } },
      });
    } else {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw failure; });
    }
    try {
      await user.click(screen.getByRole('button', { name: 'Lưu' }));
      expect(await screen.findByRole('alert')).toBeVisible();
      expect(screen.getByLabelText('Hạn mức hàng tháng (VND)')).toHaveValue(150_000);
      expect(screen.getByLabelText(/Cảnh báo tại/)).toHaveValue('90');
      expect(screen.getByLabelText('Bật theo dõi ngân sách')).toBeChecked();
      expect(screen.getByRole('button', { name: 'Lưu' })).toBeVisible();
      expect(localStorage.getItem(STORAGE_KEYS.BUDGET)).toBeNull();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  async function setBudget(user: ReturnType<typeof renderSurface>['user'], limit: string, threshold?: string) {
    await user.click(await screen.findByRole('button', { name: 'Thiết lập' }));
    const input = screen.getByLabelText('Hạn mức hàng tháng (VND)');
    await user.clear(input);
    await user.type(input, limit);
    if (threshold) fireEvent.change(screen.getByLabelText(/Cảnh báo tại/), { target: { value: threshold } });
    await user.click(screen.getByLabelText('Bật theo dõi ngân sách'));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
  }

  it('predicts the month end from the pace so far', async () => {
    await openAnalysis();

    // 600k in 24 days of a 31-day month
    expect(screen.getByText('Dự kiến cuối tháng').nextElementSibling).toHaveTextContent(/775\.000/);
  });

  it('without a budget, sets this month against an average month', async () => {
    await openAnalysis();

    expect(screen.getByText('Đã chi 1–24/10').nextElementSibling).toHaveTextContent(/600\.000/);
    // 790k over the 15 months from 8/2025 to 10/2026 is about 52.667 ₫ a month.
    expect(screen.getByText(/Vạch dọc: tháng trung bình 53k/)).toBeInTheDocument();
    expect(screen.getByTestId('versus-average')).toHaveTextContent('Dự kiến cao hơn tháng trung bình 1372%');
  });

  it('invites to set a budget, then shows spend against it and keeps it after a reload', async () => {
    const { user, unmount } = await openAnalysis();
    expect(screen.getByText('Chưa thiết lập ngân sách')).toBeInTheDocument();

    await setBudget(user, '1000000');

    const meter = screen.getByRole('meter', { name: 'Ngân sách tháng' });
    expect(meter).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByTestId('budget-figures')).toHaveTextContent(/600\.000.*1\.000\.000/);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET) ?? 'null')).toMatchObject({ monthlyLimit: 1_000_000, enabled: true });

    unmount();
    await openAnalysis();
    expect(await screen.findByRole('meter', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '60');
  });

  it('saves a whole-VND limit and lets an existing non-round budget change its alert threshold', async () => {
    const { user, unmount } = await openAnalysis();
    await user.click(await screen.findByRole('button', { name: 'Thiết lập' }));
    const limit = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Hạn mức hàng tháng (VND)' });
    await user.clear(limit);
    await user.type(limit, '150000');
    await user.click(screen.getByLabelText('Bật theo dõi ngân sách'));

    expect(limit.form!.checkValidity()).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(screen.getByTestId('budget-figures')).toHaveTextContent(/600\.000.*150\.000/);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET) ?? 'null')).toMatchObject({ monthlyLimit: 150_000, enabled: true });

    unmount();
    const reloaded = await openAnalysis();
    await reloaded.user.click(await screen.findByRole('button', { name: 'Sửa' }));
    const savedLimit = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Hạn mức hàng tháng (VND)' });
    expect(savedLimit).toHaveValue(150_000);
    fireEvent.change(screen.getByLabelText(/Cảnh báo tại/), { target: { value: '90' } });
    expect(savedLimit.form!.checkValidity()).toBe(true);
    await reloaded.user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET) ?? 'null')).toMatchObject({ monthlyLimit: 150_000, alertThreshold: 0.9, enabled: true });
  });

  it('edits an existing budget and warns when the threshold is reached', async () => {
    const { user } = await openAnalysis();
    await setBudget(user, '1000000');
    expect(screen.queryByText(/Cảnh báo: Đã tiêu/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sửa' }));
    const input = screen.getByLabelText('Hạn mức hàng tháng (VND)');
    expect(input).toHaveValue(1_000_000);
    await user.clear(input);
    await user.type(input, '700000');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(screen.getByRole('meter', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '86');
    expect(screen.getByText('Cảnh báo: Đã tiêu 86% ngân sách tháng này!')).toBeInTheDocument();
    expect(screen.getByText(/Dự kiến vượt ngân sách 75\.000/)).toBeInTheDocument();
  });

  it('measures the budget against the calendar month whatever the global range', async () => {
    const { user } = await openAnalysis();
    await setBudget(user, '1000000');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');

    expect(screen.getByRole('meter', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '60');
  });
});
