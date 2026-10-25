import { screen } from '@testing-library/react';
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

const shareImage = vi.hoisted(() => ({ downloadShareImage: vi.fn() }));
vi.mock('../src/dashboard/share-image', () => shareImage);

const NOW = new Date(2026, 9, 24, 12, 0);

// Net spend over all time: 200k + 100k + 450k + 550k = 1.3M (the 900k order is cancelled).
const ORDERS = [
  makeOrder('2025-08-10T10:00:00', { subTotal: 550_000, shopName: 'g - Gamma' }),
  makeOrder('2026-09-05T10:00:00', { subTotal: 200_000, shopName: 'a - Alpha' }),
  makeOrder('2026-09-20T10:00:00', { subTotal: 100_000, shopName: 'b - Beta' }),
  makeOrder('2026-10-02T10:00:00', { subTotal: 450_000, itemsTotal: 500_000, shopName: 'a - Alpha' }),
  makeOrder('2026-10-03T10:00:00', { subTotal: 900_000, statusCode: 4, refundAmount: 900_000, shopName: 'c - Gamma2' }),
];
const DATA = makeData(ORDERS, { cachedAt: new Date(2026, 9, 24, 10, 0).toISOString() });

function makeHost(): DashboardHost {
  return { scanOnOpen: false, loadCached: vi.fn().mockResolvedValue(DATA), refresh: vi.fn().mockResolvedValue({ data: DATA, added: 0 }) };
}

async function openOverviewWarm() {
  const view = renderSurface(<Dashboard host={makeHost()} now={() => NOW} />);
  await screen.findByText('Chi tiêu ròng');
  await view.user.click(screen.getByRole('radio', { name: 'Ấm áp' }));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('style-warm');
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Tổng quan (warm): cùng số liệu với fintech, trình bày khác', () => {
  it('shows net spend as a narrative column, not a card grid', async () => {
    await openOverviewWarm();
    expect(document.documentElement.classList.contains('style-warm')).toBe(true);
    expect(screen.getByTestId('net-spend')).toHaveTextContent('1.300.000');
  });

  it('shows top-shop share as a legend with percentages, not amounts', async () => {
    await openOverviewWarm();
    const list = screen.getByRole('list', { name: 'Tiền của bạn đi đâu?' });
    expect(list).toHaveTextContent(/Alpha.*50%/);
  });

  it('keeps the share-image button', async () => {
    const { user } = await openOverviewWarm();
    await user.click(screen.getByRole('button', { name: 'Khoe với bạn bè (tạo ảnh)' }));
    expect(shareImage.downloadShareImage).toHaveBeenCalledOnce();
  });
});
