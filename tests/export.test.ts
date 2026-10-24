import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type ExcelJS from 'exceljs';
import { exportToCSV, exportToExcel, exportToPDF } from '../src/dashboard/export';
import { state } from '../src/dashboard/state';
import type { Order } from '../src/types/index';

const order: Order = {
  orderId: 'ORD001',
  name: 'Test Product',
  productCount: 2,
  subTotal: 100000,
  subTotalFormatted: '100.000 ₫',
  status: 'Hoàn thành',
  statusCode: 3,
  shopName: 'Test Shop',
  productSummary: 'Test summary',
  deliveryDate: '2024-01-15T12:00:00',
  orderMonth: 1,
  orderYear: 2024,
};
const headers = '"STT","Mã đơn hàng","Ngày giao","Trạng thái","Tên sản phẩm","Số lượng","Tổng tiền","Seller"';

function readBlob(blob: Blob): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsText(blob);
  return promise;
}

describe('Export Functions', () => {
  let downloads: { href: string; filename: string }[];
  let blobs: Blob[];

  beforeEach(() => {
    downloads = [];
    blobs = [];
    document.body.innerHTML = '';
    state.allOrdersData = {
      orders: [order], totalCount: 2, totalAmount: 100000,
      totalAmountFormatted: '100.000 ₫', fetchedAt: '2024-01-15T00:00:00Z',
    };
    state.filteredOrders = [order];
    state.currentPage = 1;
    state.itemsPerPage = 20;
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL(blob: Blob): string {
        blobs.push(blob);
        return 'blob:mock-url';
      }
      static revokeObjectURL = vi.fn();
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ href: this.href, filename: this.download });
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('exportToCSV', () => {
    it('downloads Vietnamese headers, amounts and quoted text, then removes its anchor', async () => {
      exportToCSV();

      expect(downloads).toEqual([{ href: 'blob:mock-url', filename: expect.stringMatching(/^shopee-stats-\d{4}-\d{2}-\d{2}\.csv$/) }]);
      expect(blobs[0].type).toBe('text/csv;charset=utf-8');
      expect(await readBlob(blobs[0])).toBe(`${headers}\n1,"ORD001","15/1/2024","Hoàn thành","Test Product",2,100000,"Test Shop"`);
      expect(document.querySelector('a')).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('exports the complete visible selection in its sorted order, across pages', async () => {
      const second = { ...order, orderId: 'ORD002', name: 'Second' };
      const hidden = { ...order, orderId: 'HIDDEN' };
      state.allOrdersData!.orders = [order, hidden, second];
      // applyFilters owns year/month/status/search/date-range/day selection.
      state.filteredOrders = [second, order];
      state.itemsPerPage = 1;
      state.currentPage = 2;

      exportToCSV();

      const csv = await readBlob(blobs[0]);
      expect(csv.split('\n')).toHaveLength(3);
      expect(csv.split('\n')[1]).toContain('1,"ORD002"');
      expect(csv.split('\n')[2]).toContain('2,"ORD001"');
      expect(csv).not.toContain('HIDDEN');
    });

    it('exports headers only when filters exclude every order', async () => {
      state.filteredOrders = [];
      exportToCSV();
      expect(await readBlob(blobs[0])).toBe(headers);
    });

    it('does not export stale selected rows when source data is absent', async () => {
      state.allOrdersData = null;
      exportToCSV();
      expect(await readBlob(blobs[0])).toBe(headers);
    });

    it('escapes quotes, commas and newlines in all text fields', async () => {
      state.filteredOrders = [{ ...order, orderId: 'ID,"1"', name: 'Product, "special"\nnext', shopName: 'Shop "A"' }];
      exportToCSV();
      const csv = await readBlob(blobs[0]);
      expect(csv).toContain('"ID,""1"""');
      expect(csv).toContain('"Product, ""special""\nnext"');
      expect(csv).toContain('"Shop ""A"""');
    });

    it.each(['=1+1', '+SUM(1,1)', '-1+2', '@SUM(1,1)', '\t=1+1', '\r=1+1', '  =1+1'])(
      'exports untrusted spreadsheet formulas as text: %j', async value => {
        state.filteredOrders = [{ ...order, name: value, shopName: value }];
        exportToCSV();
        const csv = await readBlob(blobs[0]);
        expect(csv).toContain(`"'${value}"`);
        expect(csv).not.toContain(`,"${value}",`);
      },
    );
  });

  describe('exportToExcel', () => {
    it('loads ExcelJS only for a nonempty Excel export', async () => {
      vi.resetModules();
      const loadExcel = vi.fn(() => vi.importActual('exceljs'));
      vi.doMock('exceljs', loadExcel);
      vi.spyOn(window, 'print').mockImplementation(() => {});

      try {
        // Fresh imports exercise the module-loading boundary, not cached exports.
        const exports = await import('../src/dashboard/export');
        const { state: freshState } = await import('../src/dashboard/state');
        freshState.allOrdersData = state.allOrdersData;
        freshState.filteredOrders = [order];
        exports.exportToCSV();
        exports.exportToPDF();
        freshState.filteredOrders = [];
        exports.exportToExcel();
        expect(loadExcel).not.toHaveBeenCalled();

        freshState.filteredOrders = [order];
        exports.exportToExcel();
        await vi.waitFor(() => expect(downloads).toHaveLength(2));
        expect(loadExcel).toHaveBeenCalledOnce();
        expect(downloads[1].filename).toMatch(/\.xlsx$/);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      } finally {
        vi.doUnmock('exceljs');
        vi.resetModules();
      }
    });

    it('exports the same visible selection and preserves numeric cell values', async () => {
      const hidden = { ...order, orderId: 'HIDDEN' };
      state.allOrdersData!.orders = [hidden, order];
      // Match the lazily loaded module after module-boundary tests reset the cache.
      const { default: ExcelJS } = await import('exceljs');
      const worksheetSpy = vi.spyOn(ExcelJS.Workbook.prototype, 'addWorksheet');

      exportToExcel();
      await vi.waitFor(() => expect(downloads).toHaveLength(1));

      const worksheet = worksheetSpy.mock.results[0].value as ExcelJS.Worksheet;
      expect(worksheet.rowCount).toBe(2);
      expect(worksheet.getCell(2, 2).value).toBe('ORD001');
      expect(worksheet.getCell(2, 6).value).toBe(2);
      expect(worksheet.getCell(2, 7).value).toBe(100000);
      expect(downloads[0].filename).toMatch(/\.xlsx$/);
      expect(blobs[0].type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('does not download an empty selection', () => {
      state.filteredOrders = [];
      exportToExcel();
      expect(window.alert).toHaveBeenCalledOnce();
      expect(downloads).toEqual([]);
      expect(blobs).toEqual([]);
    });

    it('reports workbook serialization errors without downloading a file', async () => {
      // Load the same deferred dependency to simulate failure at its write boundary.
      const { default: ExcelJS } = await import('exceljs');
      const error = new Error('Workbook serialization failed');
      vi.spyOn(Object.getPrototypeOf(new ExcelJS.Workbook().xlsx), 'writeBuffer').mockRejectedValue(error);
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      exportToExcel();

      await vi.waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to export Excel. Please try again.'));
      expect(consoleError).toHaveBeenCalledWith('Export failed:', error);
      expect(downloads).toEqual([]);
      expect(blobs).toEqual([]);
    });

    it('reports a failed ExcelJS load without downloading a file', async () => {
      vi.resetModules();
      const error = new Error('Spreadsheet bundle unavailable');
      vi.doMock('exceljs', () => { throw error; });
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        // Fresh imports allow this test to reject the lazy module load.
        const { exportToExcel: exportFreshExcel } = await import('../src/dashboard/export');
        const { state: freshState } = await import('../src/dashboard/state');
        freshState.allOrdersData = state.allOrdersData;
        freshState.filteredOrders = [order];
        exportFreshExcel();

        await vi.waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to export Excel. Please try again.'));
        expect(consoleError).toHaveBeenCalledWith('Export failed:', expect.any(Error));
        expect(downloads).toEqual([]);
        expect(blobs).toEqual([]);
      } finally {
        vi.doUnmock('exceljs');
        vi.resetModules();
      }
    });
  });

  it('opens the print dialog for PDF export', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    exportToPDF();
    expect(printSpy).toHaveBeenCalledOnce();
  });
});
