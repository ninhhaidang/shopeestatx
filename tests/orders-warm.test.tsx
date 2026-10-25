import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const sheet = vi.hoisted(() => ({ cells: new Map<string, unknown>() }));
vi.mock('exceljs', () => ({
  default: {
    Workbook: class {
      addWorksheet() {
        return { getCell: (row: number, col: number) => ({ set value(v: unknown) { sheet.cells.set(`${row},${col}`, v); } }) };
      }
      xlsx = { writeBuffer: () => Promise.resolve(new ArrayBuffer(0)) };
    },
  },
}));

const NOW = new Date(2026, 9, 24, 12, 0);

// Same fixture as tests/dashboard-orders.test.tsx, for the same expected ids.
const ORDERS = [
  makeOrder('2026-10-02T10:00:00', { orderId: '1001', name: 'Tai nghe Bluetooth', subTotal: 450_000, shopName: 'a - Alpha', productCount: 2, productSummary: 'Tai nghe (SL: 1)' }),
  makeOrder('2026-09-20T10:00:00', { orderId: '1002', name: 'Ốp lưng', subTotal: 100_000, shopName: 'b - Beta' }),
  makeOrder('2026-09-05T10:00:00', { orderId: '1003', name: 'Chuột không dây', subTotal: 200_000, shopName: 'a - Alpha' }),
  makeOrder('2026-10-03T10:00:00', { orderId: '1004', name: 'Bàn phím cơ', subTotal: 900_000, status: 'Đã hủy', statusCode: 4, refundAmount: 900_000, shopName: 'c - Gamma' }),
  makeOrder('2025-08-10T10:00:00', { orderId: '1005', name: 'Cáp HDMI', subTotal: 550_000, shopName: 'b - Beta' }),
];
const DATA = makeData(ORDERS, { cachedAt: NOW.toISOString() });

function makeHost(data = DATA): DashboardHost {
  return { scanOnOpen: false, loadCached: vi.fn().mockResolvedValue(data), refresh: vi.fn().mockResolvedValue({ data, added: 0 }) };
}

async function openOrdersWarm(data = DATA) {
  const view = renderSurface(<Dashboard host={makeHost(data)} now={() => NOW} />);
  await screen.findByText('Chi tiêu ròng');
  await view.user.click(screen.getByRole('radio', { name: 'Ấm áp' }));
  await view.user.click(screen.getByRole('tab', { name: 'Đơn hàng' }));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('style-warm');
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Đơn hàng (warm): danh sách hoá đơn một cột', () => {
  it('shows a receipt per order, with shop, product, date and total', async () => {
    await openOrdersWarm();
    const list = within(document.querySelector('ul')!);
    const item = list.getAllByText('a - Alpha')[0].closest('li')!;
    expect(item).toHaveTextContent('450.000');
  });

  it('searches, filters by status/shop, and sorts', async () => {
    const { user } = await openOrdersWarm();

    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'chuột');
    expect(screen.getByText('Bạn có 1 đơn hàng.')).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Đã hủy');
    expect(screen.getByText('Bạn có 1 đơn hàng.')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Tất cả trạng thái');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo shop' }), 'a - Alpha');
    expect(screen.getByText('Bạn có 2 đơn hàng.')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo shop' }), 'Tất cả shop');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp theo' }), 'Tổng tiền (giảm dần)');
    expect(document.querySelectorAll('ul > li')[0]).toHaveTextContent('c - Gamma');
  });

  it('opens a receipt to show item detail, and closes it again', async () => {
    const { user } = await openOrdersWarm();
    const open = screen.getByRole('button', { name: /Xem chi tiết đơn 1001/ });
    expect(open).toHaveAttribute('aria-expanded', 'false');

    await user.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByRole('region', { name: 'Chi tiết đơn 1001' })).getByText(/Tai nghe/)).toBeInTheDocument();

    await user.click(open);
    expect(screen.queryByRole('region', { name: 'Chi tiết đơn 1001' })).not.toBeInTheDocument();
  });

  it('marks an excluded order and notes it was not counted', async () => {
    const { user } = await openOrdersWarm();
    const row = screen.getByRole('button', { name: /Xem chi tiết đơn 1004/ }).closest('li')!;
    expect(within(row).getByText('Đơn bị loại')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: /Xem chi tiết đơn 1004/ }));
    expect(within(screen.getByRole('region', { name: 'Chi tiết đơn 1004' })).getByText(/Không tính vào chi tiêu/)).toBeInTheDocument();
  });

  it('resets to the first page when the sort changes', async () => {
    const many = makeData(
      Array.from({ length: 45 }, (_, i) => makeOrder('2026-10-02T10:00:00', { orderId: String(1100 + i), subTotal: 1000 * (i + 1) })),
      { cachedAt: NOW.toISOString() },
    );
    const { user } = await openOrdersWarm(many);
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(screen.getByText('Trang 2 / 3')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp theo' }), 'Tổng tiền (giảm dần)');

    expect(screen.getByText('Trang 1 / 3')).toBeInTheDocument();
  });
});

describe('Đơn hàng (warm): xuất dữ liệu và in', () => {
  let downloads: { filename: string; blob?: Blob }[];

  beforeEach(() => {
    downloads = [];
    sheet.cells.clear();
    let last: Blob | undefined;
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL(blob: Blob) {
        last = blob;
        return 'blob:orders-warm';
      }
      static revokeObjectURL = vi.fn();
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      if (this.download) downloads.push({ filename: this.download, blob: last });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exports CSV', async () => {
    const { user } = await openOrdersWarm();
    await user.click(screen.getByRole('button', { name: 'CSV (.csv)' }));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/\.csv$/);
  });

  it('exports Excel', async () => {
    const { user } = await openOrdersWarm();
    await user.click(screen.getByRole('button', { name: 'Excel (.xlsx)' }));
    await vi.waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].filename).toMatch(/\.xlsx$/);
  });

  it('prints every filtered order, then removes the sheet', async () => {
    const { user } = await openOrdersWarm();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'alpha');
    let printed: string | undefined;
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      printed = document.getElementById('orders-print')?.textContent ?? '';
    });

    await user.click(screen.getByRole('button', { name: 'In / PDF' }));

    expect(print).toHaveBeenCalledOnce();
    expect(printed).toContain('1001');
    expect(printed).toContain('1003');
    expect(printed).not.toContain('1002');
    expect(document.getElementById('orders-print')).toBeNull();
  });
});
