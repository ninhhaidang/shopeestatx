import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../src/dashboard-app/Dashboard';
import type { DashboardHost } from '../src/dashboard-app/host';
import { mockColorScheme } from './support/match-media';
import { makeData, makeOrder } from './support/orders';
import { renderSurface } from './support/render';

// The Overview chart needs a canvas; this file never reads it but the tab still mounts first.
vi.mock('chart.js', () => ({
  Chart: class {
    static register() {}
    destroy() {}
  },
  BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Tooltip: {},
}));

// The spreadsheet library is the boundary; what was written to the sheet is asserted.
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

const ORDERS = [
  makeOrder('2026-10-02T10:00:00', {
    orderId: '1001', name: 'Tai nghe Bluetooth', subTotal: 450_000, subTotalFormatted: '450.000 ₫', shopName: 'a - Alpha',
    productCount: 2, productSummary: 'Tai nghe (SL: 1)', itemsTotal: 500_000,
    items: [{ name: 'Tai nghe Bluetooth', quantity: 1, unitPrice: 400_000 }, { name: 'Dây sạc', quantity: 1, unitPrice: 100_000 }],
  }),
  makeOrder('2026-09-20T10:00:00', { orderId: '1002', name: 'Ốp lưng', subTotal: 100_000, subTotalFormatted: '100.000 ₫', shopName: 'b - Beta' }),
  makeOrder('2026-09-05T10:00:00', { orderId: '1003', name: 'Chuột không dây', subTotal: 200_000, subTotalFormatted: '200.000 ₫', shopName: 'a - Alpha' }),
  makeOrder('2026-10-03T10:00:00', {
    orderId: '1004', name: 'Bàn phím cơ', subTotal: 900_000, subTotalFormatted: '900.000 ₫', status: 'Đã hủy', statusCode: 4,
    refundAmount: 900_000, shopName: 'c - Gamma',
  }),
  makeOrder('2025-08-10T10:00:00', { orderId: '1005', name: 'Cáp HDMI', subTotal: 550_000, subTotalFormatted: '550.000 ₫', shopName: 'b - Beta' }),
];
const DATA = makeData(ORDERS, { cachedAt: NOW.toISOString() });

function makeHost(data = DATA): DashboardHost {
  return { scanOnOpen: false, loadCached: vi.fn().mockResolvedValue(data), refresh: vi.fn().mockResolvedValue({ data, added: 0 }) };
}

async function openOrders(data = DATA) {
  const view = renderSurface(<Dashboard host={makeHost(data)} now={() => NOW} />);
  await screen.findByText('Chi tiêu ròng');
  await view.user.click(screen.getByRole('tab', { name: 'Đơn hàng' }));
  return view;
}

/** Order ids shown in the list, in order. */
const ids = () => screen.getAllByRole('link', { name: /^10\d\d$/ }).map(a => a.textContent);

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockColorScheme('light');
});

describe('Đơn hàng: danh sách và chi tiết', () => {
  it('lists the orders of the global date range with a link to each order on Shopee', async () => {
    const { user } = await openOrders();
    expect(ids()).toEqual(['1001', '1002', '1003', '1004', '1005']);
    expect(screen.getByRole('link', { name: '1001' })).toHaveAttribute('href', expect.stringMatching(/\/user\/purchase\/order\/1001$/));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');
    expect(ids()).toEqual(['1001', '1002', '1003', '1004']);
  });

  it('opens an order to show what was bought, and closes it again', async () => {
    const { user } = await openOrders();
    const open = screen.getByRole('button', { name: /Xem chi tiết đơn 1001/ });
    expect(open).toHaveAttribute('aria-expanded', 'false');

    await user.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    const detail = within(screen.getByRole('region', { name: 'Chi tiết đơn 1001' }));
    expect(detail.getByText('Dây sạc')).toBeInTheDocument();
    expect(detail.getByText('Tai nghe Bluetooth')).toBeInTheDocument();
    expect(detail.getByText('a - Alpha')).toBeInTheDocument();

    await user.click(open);
    expect(screen.queryByRole('region', { name: 'Chi tiết đơn 1001' })).not.toBeInTheDocument();
  });

  it('shows the product summary for an older cache without line items', async () => {
    const { user } = await openOrders();
    await user.click(screen.getByRole('button', { name: /Xem chi tiết đơn 1002/ }));
    expect(within(screen.getByRole('region', { name: 'Chi tiết đơn 1002' })).getByText(/Ốp lưng/)).toBeInTheDocument();
  });

  it('marks an excluded order as such and keeps it out of the spend', async () => {
    const { user } = await openOrders();
    const row = screen.getByRole('link', { name: '1004' }).closest('tr')!;
    expect(within(row).getByText('Đơn bị loại')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: /Xem chi tiết đơn 1004/ }));
    const detail = within(screen.getByRole('region', { name: 'Chi tiết đơn 1004' }));
    expect(detail.getByText(/Không tính vào chi tiêu \(giá trị gốc 900\.000/)).toBeInTheDocument();
  });

  it('explains an empty date range and offers to see everything again', async () => {
    const { user } = await openOrders();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Tùy chỉnh');
    await user.type(screen.getByLabelText('Từ ngày'), '2030-01-01');

    expect(screen.getByText('Không có đơn hàng trong khoảng này')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xem tất cả' }));
    expect(ids()).toHaveLength(5);
  });
});

describe('Đơn hàng: tìm kiếm và lọc', () => {
  it('searches by order id, product and shop', async () => {
    const { user } = await openOrders();
    const search = screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' });

    await user.type(search, 'chuột');
    expect(ids()).toEqual(['1003']);

    await user.clear(search);
    await user.type(search, 'beta');
    expect(ids()).toEqual(['1002', '1005']);

    await user.clear(search);
    await user.type(search, '1004');
    expect(ids()).toEqual(['1004']);
  });

  it('filters by status and by shop, and the two combine', async () => {
    const { user } = await openOrders();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Đã hủy');
    expect(ids()).toEqual(['1004']);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Tất cả trạng thái');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo shop' }), 'a - Alpha');
    expect(ids()).toEqual(['1001', '1003']);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Đã hủy');
    expect(screen.getByText('Không tìm thấy đơn hàng nào')).toBeInTheDocument();
  });

  it('offers only the shops inside the date range and resets the filters from the empty state', async () => {
    const { user } = await openOrders();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Khoảng thời gian' }), 'Năm nay');
    const shops = within(screen.getByRole('combobox', { name: 'Lọc theo shop' })).getAllByRole('option').map(o => o.textContent);
    expect(shops).toEqual(['Tất cả shop', 'a - Alpha', 'b - Beta', 'c - Gamma']);

    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'khong-co-gi');
    await user.click(screen.getByRole('button', { name: 'Đặt lại bộ lọc' }));
    expect(ids()).toHaveLength(4);
  });

  it('states how many orders match', async () => {
    const { user } = await openOrders();
    expect(screen.getByText('Hiển thị 1–5 trong tổng số 5 đơn')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'alpha');
    expect(screen.getByText('Hiển thị 1–2 trong tổng số 2 đơn')).toBeInTheDocument();
  });
});

describe('Đơn hàng: sắp xếp', () => {
  it('sorts by a column ascending, then descending, and says so', async () => {
    const { user } = await openOrders();
    const header = screen.getByRole('columnheader', { name: /Tổng tiền/ });
    expect(header).toHaveAttribute('aria-sort', 'none');

    await user.click(within(header).getByRole('button'));
    expect(ids()).toEqual(['1002', '1003', '1001', '1005', '1004']);
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(header).getByRole('button'));
    expect(ids()).toEqual(['1004', '1005', '1001', '1003', '1002']);
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('sorts by delivery date', async () => {
    const { user } = await openOrders();
    await user.click(within(screen.getByRole('columnheader', { name: /Ngày giao/ })).getByRole('button'));
    expect(ids()).toEqual(['1005', '1003', '1002', '1001', '1004']);
  });

  it('sorts from a list on narrow containers, where the header row is hidden', async () => {
    const { user } = await openOrders();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp theo' }), 'Tổng tiền (giảm dần)');
    expect(ids()).toEqual(['1004', '1005', '1001', '1003', '1002']);
  });

  it('keeps the sort when a filter changes', async () => {
    const { user } = await openOrders();
    await user.click(within(screen.getByRole('columnheader', { name: /Tổng tiền/ })).getByRole('button'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo shop' }), 'b - Beta');
    expect(ids()).toEqual(['1002', '1005']);
  });
});

describe('Đơn hàng: phân trang', () => {
  const many = makeData(
    Array.from({ length: 45 }, (_, i) => makeOrder('2026-10-02T10:00:00', { orderId: String(1100 + i), name: `Hàng ${i}`, subTotal: 1000 * (i + 1) })),
    { cachedAt: NOW.toISOString() },
  );

  it('shows 20 orders a page and moves between pages', async () => {
    const { user } = await openOrders(many);
    expect(screen.getAllByRole('link', { name: /^11\d\d$/ })).toHaveLength(20);
    expect(screen.getByText('Hiển thị 1–20 trong tổng số 45 đơn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(screen.getByText('Hiển thị 21–40 trong tổng số 45 đơn')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1120' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Trang 3' }));
    expect(screen.getAllByRole('link', { name: /^11\d\d$/ })).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Trang 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });

  it('goes back to the first page when the results change', async () => {
    const { user } = await openOrders(many);
    await user.click(screen.getByRole('button', { name: 'Trang 2' }));
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'Hàng 4');

    expect(screen.getByText('Hiển thị 1–6 trong tổng số 6 đơn')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Phân trang' })).not.toBeInTheDocument();
  });

  it('collapses long page lists around the current page', async () => {
    const lots = makeData(
      Array.from({ length: 200 }, (_, i) => makeOrder('2026-10-02T10:00:00', { orderId: String(2000 + i) })),
      { cachedAt: NOW.toISOString() },
    );
    const { user } = await openOrders(lots);
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    const nav = within(screen.getByRole('navigation', { name: 'Phân trang' }));
    expect(nav.getAllByRole('button').map(b => b.textContent)).toEqual(['‹', '1', '4', '5', '6', '10', '›']);
  });
});


describe('Đơn hàng: xuất dữ liệu', () => {
  let downloads: { filename: string; blob?: Blob }[];

  beforeEach(() => {
    downloads = [];
    sheet.cells.clear();
    let last: Blob | undefined;
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL(blob: Blob) {
        last = blob;
        return 'blob:orders';
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

  function readBlob(blob: Blob): Promise<string> {
    const { promise, resolve } = Promise.withResolvers<string>();
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
    return promise;
  }

  it('exports exactly the filtered, sorted orders as CSV', async () => {
    const { user } = await openOrders();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo shop' }), 'b - Beta');
    await user.click(within(screen.getByRole('columnheader', { name: /Tổng tiền/ })).getByRole('button'));

    await user.click(screen.getByRole('button', { name: 'CSV (.csv)' }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toMatch(/^shopee-stats-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = (await readBlob(downloads[0].blob!)).replace('\uFEFF', '').split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"1002"');
    expect(lines[2]).toContain('"1005"');
  });

  it('exports every page of the filtered orders, not just the visible one', async () => {
    const many = makeData(
      Array.from({ length: 45 }, (_, i) => makeOrder('2026-10-02T10:00:00', { orderId: String(1100 + i) })),
      { cachedAt: NOW.toISOString() },
    );
    const { user } = await openOrders(many);
    await user.click(screen.getByRole('button', { name: 'CSV (.csv)' }));
    expect((await readBlob(downloads[0].blob!)).split('\n')).toHaveLength(46);
  });

  it('exports the filtered orders to Excel', async () => {
    const { user } = await openOrders();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), 'Đã hủy');

    await user.click(screen.getByRole('button', { name: 'Excel (.xlsx)' }));

    await vi.waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].filename).toMatch(/\.xlsx$/);
    expect(sheet.cells.get('1,2')).toBe('Mã đơn hàng');
    expect(sheet.cells.get('2,2')).toBe('1004');
    expect(sheet.cells.has('3,2')).toBe(false);
  });

  it('prints a sheet holding every filtered order for PDF, then removes it', async () => {
    const { user } = await openOrders();
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

  it('disables export when nothing matches', async () => {
    const { user } = await openOrders();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' }), 'khong-co-gi');
    expect(screen.getByRole('button', { name: 'CSV (.csv)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Excel (.xlsx)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'In / PDF' })).toBeDisabled();
  });
});
