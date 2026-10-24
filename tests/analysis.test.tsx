import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../src/config';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import { mockColorScheme } from './support/match-media';
import type { OrderData } from '../src/types';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

vi.mock('chart.js', () => {
  class Chart {
    static register() {}
    destroy() {}
  }
  return { Chart, BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Tooltip: {} };
});

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

    expect(tile('Ngày hay mua nhất')).toHaveTextContent('Thứ 2');
    expect(tile('Giờ hay mua nhất')).toHaveTextContent('20:00 – 21:00');
    expect(tile('Chuỗi tháng liên tục')).toHaveTextContent('2 tháng');
    // 790k net over 10 Aug 2025 .. 12 Oct 2026 = 429 days (1841.49)
    expect(tile('Tốc độ chi tiêu')).toHaveTextContent(/1\.841/);
  });

  it('lists the most bought and the priciest products', async () => {
    await openAnalysis();

    const top = within(screen.getByRole('list', { name: 'Sản phẩm mua nhiều nhất' })).getAllByRole('listitem');
    expect(top[0]).toHaveTextContent(/Áo thun.*x3/);
    const priciest = within(screen.getByRole('list', { name: 'Sản phẩm đắt nhất' })).getAllByRole('listitem');
    expect(priciest[0]).toHaveTextContent(/Giày.*300\.000/);
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument(); // cancelled order
  });
});

describe('Phân tích: insights', () => {
  it('writes the insights for the orders in range', async () => {
    await openAnalysis();

    const list = within(screen.getByRole('list', { name: 'Phân tích chi tiêu' }));
    const lines = list.getAllByRole('listitem').map(li => li.textContent);
    expect(lines[0]).toMatch(/Tháng này bạn đã chi 600\.000.*tăng 500% so với tháng trước/);
    expect(lines[1]).toMatch(/Alpha.*2 đơn/);
    expect(lines.some(l => /tiết kiệm 700\.000.*hủy\/trả hàng/.test(l!))).toBe(true);
  });
});

describe('Phân tích: heatmap', () => {
  it('summarises the heatmap and offers every day with orders as a table', async () => {
    const { user } = await openAnalysis();

    const heatmap = screen.getByRole('img', { name: /Chi tiêu theo ngày.*3 ngày có đơn.*3 đơn/ });
    expect(heatmap).toBeInTheDocument();

    await user.click(screen.getByText('Xem bảng số liệu'));
    const rows = screen.getAllByRole('row').map(r => r.textContent);
    expect(rows.some(r => /15\/9\/2026.*1/.test(r!))).toBe(true);
    expect(rows.some(r => /12\/10\/2026.*1/.test(r!))).toBe(true);
    expect(rows.some(r => /10\/8\/2025/.test(r!))).toBe(false); // older than 12 months
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
    expect(list.getAllByRole('listitem')[0]).toHaveTextContent(/Tháng này bạn đã chi 600\.000.*tăng 500% so với tháng trước/);
  });

  it('draws the heatmap over 12 months of the whole history ending at the range end', async () => {
    const { user } = await openAnalysis();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');

    // Last month ends 30/9/2026: the window is 1/10/2025 to 30/9/2026, so 15/9 shows and October does not.
    expect(screen.getByText(/từ 1\/10\/2025 đến 30\/9\/2026/)).toBeInTheDocument();
    await user.click(screen.getByText('Xem bảng số liệu'));
    expect(screen.getByRole('row', { name: /15\/9\/2026/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /5\/10\/2026/ })).not.toBeInTheDocument();
  });
});

describe('Phân tích: dự đoán và ngân sách', () => {
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
    expect(screen.getByText(/Dự kiến cuối tháng/)).toHaveTextContent(/775\.000/);
  });

  it('invites to set a budget, then shows spend against it and keeps it after a reload', async () => {
    const { user, unmount } = await openAnalysis();
    expect(screen.getByText('Chưa thiết lập ngân sách')).toBeInTheDocument();

    await setBudget(user, '1000000');

    const meter = screen.getByRole('progressbar', { name: 'Ngân sách tháng' });
    expect(meter).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByTestId('budget-figures')).toHaveTextContent(/600\.000.*1\.000\.000/);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET) ?? 'null')).toMatchObject({ monthlyLimit: 1_000_000, enabled: true });

    unmount();
    await openAnalysis();
    expect(await screen.findByRole('progressbar', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '60');
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

    expect(screen.getByRole('progressbar', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '86');
    expect(screen.getByText('Cảnh báo: Đã tiêu 86% ngân sách tháng này!')).toBeInTheDocument();
    expect(screen.getByText(/Dự kiến vượt ngân sách 75\.000/)).toBeInTheDocument();
  });

  it('measures the budget against the calendar month whatever the global range', async () => {
    const { user } = await openAnalysis();
    await setBudget(user, '1000000');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tháng trước');

    expect(screen.getByRole('progressbar', { name: 'Ngân sách tháng' })).toHaveAttribute('aria-valuenow', '60');
  });
});
