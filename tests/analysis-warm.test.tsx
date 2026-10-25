import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import { mockColorScheme } from './support/match-media';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

vi.mock('chart.js', () => ({
  Chart: class {
    static register() {}
    destroy() {}
  },
  BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Tooltip: {},
}));

const NOW = new Date(2026, 9, 24, 12, 0); // Saturday 24 Oct 2026, noon

// Same fixture as tests/analysis.test.tsx, for the same expected numbers.
const ORDERS = [
  makeOrder('2025-08-10T10:00:00', { subTotal: 90_000, shopName: 'x - Old Shop', items: [{ name: 'Ốp lưng', quantity: 1, unitPrice: 90_000 }] }),
  makeOrder('2026-09-15T09:00:00', { subTotal: 100_000, shopName: 'a - Alpha', items: [{ name: 'Cốc sứ', quantity: 1, unitPrice: 50_000 }] }),
  makeOrder('2026-10-05T20:30:00', { subTotal: 200_000, shopName: 'a - Alpha', items: [{ name: 'Áo thun', quantity: 2, unitPrice: 100_000 }] }),
  makeOrder('2026-10-12T20:10:00', { subTotal: 400_000, shopName: 'b - Beta', items: [{ name: 'Áo thun', quantity: 1, unitPrice: 100_000 }, { name: 'Giày', quantity: 1, unitPrice: 300_000 }] }),
  makeOrder('2026-10-13T08:00:00', { subTotal: 700_000, statusCode: 4, refundAmount: 700_000, shopName: 'c - Gamma', items: [{ name: 'Laptop', quantity: 1, unitPrice: 700_000 }] }),
];
const DATA = makeData(ORDERS, { cachedAt: new Date(2026, 9, 24, 10, 0).toISOString() });

function makeHost(data = DATA): DashboardHost {
  return { scanOnOpen: false, loadCached: vi.fn().mockResolvedValue(data), refresh: vi.fn().mockResolvedValue({ data, added: 0 }) };
}

async function openAnalysisWarm() {
  const view = renderSurface(<Dashboard host={makeHost()} now={() => NOW} />);
  await screen.findByText('Chi tiêu ròng');
  await view.user.click(screen.getByRole('radio', { name: 'Ấm áp' }));
  await view.user.click(screen.getByRole('tab', { name: 'Phân tích' }));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('style-warm');
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Phân tích (warm): cùng số liệu với fintech, trình bày khác', () => {
  it('applies the warm class and writes habits as a sentence', async () => {
    await openAnalysisWarm();
    expect(document.documentElement.classList.contains('style-warm')).toBe(true);
    expect(screen.getByText(/mua nhiều nhất vào.*Thứ 2.*20:00.*2 tháng.*1\.841/)).toBeInTheDocument();
  });

  it('lists the most bought products, ranked', async () => {
    await openAnalysisWarm();
    const top = within(screen.getByRole('list', { name: 'Sản phẩm mua nhiều nhất' })).getAllByRole('listitem');
    expect(top[0]).toHaveTextContent(/Áo thun.*x3/);
  });

  it('lists the priciest product and every repeat shop (full Loyalty table, not just top 5)', async () => {
    await openAnalysisWarm();
    const priciest = within(screen.getByRole('list', { name: 'Sản phẩm đắt nhất' })).getAllByRole('listitem');
    expect(priciest[0]).toHaveTextContent(/Giày.*300\.000/);
  });

  it('lists repeat shops over the whole history as a receipt-style list, not a table', async () => {
    const repeat = makeData([
      makeOrder('2026-08-05T10:00:00', { subTotal: 100_000, shopName: 'a - Alpha' }),
      makeOrder('2026-09-05T10:00:00', { subTotal: 200_000, shopName: 'a - Alpha' }),
      makeOrder('2026-10-05T10:00:00', { subTotal: 300_000, shopName: 'a - Alpha' }),
    ]);
    const view = renderSurface(<Dashboard host={makeHost(repeat)} now={() => NOW} />);
    await screen.findByText('Chi tiêu ròng');
    await view.user.click(screen.getByRole('radio', { name: 'Ấm áp' }));
    await view.user.click(screen.getByRole('tab', { name: 'Phân tích' }));

    const loyalty = within(screen.getByRole('list', { name: 'Shop thân thiết' })).getAllByRole('listitem');
    expect(loyalty[0]).toHaveTextContent(/Alpha.*600\.000.*3 đơn/);
  });

  it('summarises the heatmap over 12 months', async () => {
    await openAnalysisWarm();
    expect(screen.getByRole('img', { name: 'Chi tiêu theo ngày' })).toBeInTheDocument();
  });

  it('still lets a budget be set up (reuses the same interactive budget card)', async () => {
    const { user } = await openAnalysisWarm();
    await user.click(await screen.findByRole('button', { name: 'Thiết lập' }));
    expect(screen.getByLabelText('Hạn mức hàng tháng (VND)')).toBeInTheDocument();
  });
});
