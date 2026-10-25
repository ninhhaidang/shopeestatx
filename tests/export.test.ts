import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportToCSV, exportToExcel, exportToPDF } from '../src/dashboard/export';
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
const headers = '"STT","Mã đơn hàng","Ngày giao","Trạng thái","Tên sản phẩm","Số lượng","Tổng tiền","Seller","Details"';

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
      exportToCSV([order]);

      expect(downloads).toEqual([{ href: 'blob:mock-url', filename: expect.stringMatching(/^shopee-stats-\d{4}-\d{2}-\d{2}\.csv$/) }]);
      expect(blobs[0].type).toBe('text/csv;charset=utf-8');
      expect(await readBlob(blobs[0])).toBe(`${headers}\n1,"ORD001","15/1/2024","Hoàn thành","Test Product",2,100000,"Test Shop","Test summary"`);
      expect(document.querySelector('a')).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
    it.each([
      ['12345678901234567890', '"12345678901234567890"'],
      ['00012345678901234567890', '"00012345678901234567890"'],
      ['order,"id', '"order,""id"'],
      [123456789, '123456789'],
      ['=1+1', '"\'=1+1"'],
    ])('keeps raw CSV identity and safe quoting for %j', async (orderId, cell) => {
      exportToCSV([{ ...order, orderId }]);
      expect((await readBlob(blobs[0])).split('\n')[1]).toContain(`1,${cell},`);
    });


    it.each([
      ['Shirt "Blue", size M\nSocks x2', '"Shirt ""Blue"", size M\nSocks x2"'],
      ['=HYPERLINK("https://example.com","Open")', '"\'=HYPERLINK(""https://example.com"",""Open"")"'],
      ['  +SUM(1,2)', '"\'  +SUM(1,2)"'],
      ['-2+3', '"\'-2+3"'],
      ['@SUM(1,2)', '"\'@SUM(1,2)"'],
      ['\tproduct', '"\'\tproduct"'],
      ['\rproduct', '"\'\rproduct"'],
      ['\nproduct', '"\'\nproduct"'],
    ])('preserves and safely quotes product details %j in the downloaded CSV', async (productSummary, cell) => {
      exportToCSV([{ ...order, productSummary }]);

      expect(await readBlob(blobs[0])).toBe(`${headers}\n1,"ORD001","15/1/2024","Hoàn thành","Test Product",2,100000,"Test Shop",${cell}`);
    });

    it('exports exactly the orders it is given, in the given order', async () => {
      const second = { ...order, orderId: 'ORD002', name: 'Second' };

      exportToCSV([second, order]);

      const csv = await readBlob(blobs[0]);
      expect(csv.split('\n')).toHaveLength(3);
      expect(csv.split('\n')[1]).toContain('1,"ORD002"');
      expect(csv.split('\n')[2]).toContain('2,"ORD001"');
    });

    it('exports headers only when there are no orders', async () => {
      exportToCSV([]);
      expect(await readBlob(blobs[0])).toBe(headers);
    });

    it('escapes quotes, commas and newlines in all text fields', async () => {
      exportToCSV([{ ...order, orderId: 'ID,"1"', name: 'Product, "special"\nnext', shopName: 'Shop "A"' }]);
      const csv = await readBlob(blobs[0]);
      expect(csv).toContain('"ID,""1"""');
      expect(csv).toContain('"Product, ""special""\nnext"');
      expect(csv).toContain('"Shop ""A"""');
    });

    it.each(['=1+1', '+SUM(1,1)', '-1+2', '@SUM(1,1)', '\t=1+1', '\r=1+1', '  =1+1'])(
      'exports untrusted spreadsheet formulas as text: %j', async value => {
        exportToCSV([{ ...order, name: value, shopName: value }]);
        const csv = await readBlob(blobs[0]);
        expect(csv).toContain(`"'${value}"`);
        expect(csv).not.toContain(`,"${value}",`);
      },
    );
  });

  describe('exportToExcel', () => {
    it('preserves numeric cell values', async () => {
      const { default: ExcelJS } = await import('exceljs');

      await exportToExcel([order, { ...order, orderId: '12345678901234567890' }, { ...order, orderId: 123456789 }]);

      const { promise, resolve, reject } = Promise.withResolvers<ArrayBuffer>();
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blobs[0]);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await promise);
      const worksheet = workbook.getWorksheet('Shopee Orders')!;
      expect(worksheet.rowCount).toBe(4);
      expect(worksheet.getCell(2, 2).value).toBe('ORD001');
      expect(worksheet.getCell(3, 2).value).toBe('12345678901234567890');
      expect(worksheet.getCell(4, 2).value).toBe('123456789');
      expect(worksheet.getCell(2, 6).value).toBe(2);
      expect(worksheet.getCell(2, 7).value).toBe(100000);
      expect(downloads[0].filename).toMatch(/\.xlsx$/);
      expect(blobs[0].type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('does not download an empty selection', async () => {
      await exportToExcel([]);
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

      await exportToExcel([order]);

      expect(window.alert).toHaveBeenCalledWith('Failed to export Excel. Please try again.');
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
        await exportFreshExcel([order]);

        expect(window.alert).toHaveBeenCalledWith('Failed to export Excel. Please try again.');
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
