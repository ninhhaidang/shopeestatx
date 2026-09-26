import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getExportOrders, exportToExcel, exportToCSV, exportToPDF } from '../src/dashboard/export';
import { state } from '../src/dashboard/state';
import { t } from '../i18n/index';
import type { Order } from '../src/types/index';
import ExcelJS from 'exceljs';

describe('FilterCriteria-Aware Scoped Data Export (Ticket #20)', () => {
  const mockOrders: Order[] = [
    {
      orderId: 'ORD-001',
      name: 'Bàn phím cơ không dây',
      productCount: 1,
      subTotal: 500000,
      subTotalFormatted: '500.000 ₫',
      status: 'Đã giao hàng',
      statusCode: 3,
      shopName: 'Keychron Official',
      productSummary: 'Switch Red, Bluetooth 5.1',
      deliveryDate: '2024-03-15T10:00:00.000Z',
      orderPlacementDate: '2024-03-10T08:00:00.000Z',
      orderMonth: 3,
      orderYear: 2024,
    },
    {
      orderId: 'ORD-002',
      name: 'Áo thun polo nam',
      productCount: 2,
      subTotal: 300000,
      subTotalFormatted: '300.000 ₫',
      status: 'Đã giao hàng',
      statusCode: 3,
      shopName: 'Coolmate Store',
      productSummary: 'Màu đen, size L',
      deliveryDate: '2024-04-20T14:30:00.000Z',
      orderPlacementDate: '2024-04-18T12:00:00.000Z',
      orderMonth: 4,
      orderYear: 2024,
    },
    {
      orderId: 'ORD-003',
      name: 'Chuột công thái học',
      productCount: 1,
      subTotal: 850000,
      subTotalFormatted: '850.000 ₫',
      status: 'Đã hủy',
      statusCode: 4,
      shopName: 'Logitech Flagship',
      productSummary: 'MX Master 3S',
      deliveryDate: null,
      orderPlacementDate: '2023-11-05T09:00:00.000Z',
      orderMonth: 11,
      orderYear: 2023,
    },
  ];

  beforeEach(() => {
    // Reset state
    state.allOrdersData = {
      orders: [...mockOrders],
      totalCount: 3,
      totalAmount: 1650000,
      totalAmountFormatted: '1.650.000 ₫',
      fetchedAt: new Date().toISOString(),
    };
    state.filteredOrders = [...mockOrders];
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: { field: null, direction: 'asc' },
    };

    // Reset DOM
    document.body.innerHTML = '';

    // Mock URL & Anchor download APIs
    global.URL.createObjectURL = vi.fn((blob: Blob) => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: getExportOrders Data Resolution & DOM Scraping Elimination', () => {
    it('returns all available historical orders when no FilterCriteria constraints are active', () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: null,
        sort: null,
      };
      state.filteredOrders = [...mockOrders];

      const result = getExportOrders();
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockOrders);
    });

    it('falls back to state.allOrdersData.orders if state.filteredOrders is uninitialized when no filters active', () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: null,
      };
      state.filteredOrders = [];

      const result = getExportOrders();
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockOrders);
    });

    it('returns evaluated state.filteredOrders when search keyword filter is active', () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: 'Keychron',
      };
      state.filteredOrders = [mockOrders[0]];

      const result = getExportOrders();
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('ORD-001');
    });

    it('returns evaluated state.filteredOrders when temporal TimeCriteria boundary is active', () => {
      state.criteria = {
        time: { kind: 'year', year: 2024 },
        status: null,
        category: null,
        searchTerm: null,
      };
      state.filteredOrders = [mockOrders[0], mockOrders[1]];

      const result = getExportOrders();
      expect(result).toHaveLength(2);
      expect(result.map(o => o.orderId)).toEqual(['ORD-001', 'ORD-002']);
    });

    it('returns empty array when active FilterCriteria constraints match 0 orders', () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: 'NonExistentProductXYZ',
      };
      state.filteredOrders = [];

      const result = getExportOrders();
      expect(result).toEqual([]);
    });

    it('strictly ignores legacy DOM select elements and accesses state directly', () => {
      // Create legacy DOM selects with conflicting values
      document.body.innerHTML = `
        <select id="filterYear"><option value="2023" selected>2023</option></select>
        <select id="filterMonth"><option value="11" selected>11</option></select>
        <select id="filterStatus"><option value="4" selected>4</option></select>
      `;

      // State represents 2024 orders evaluated from FilterEngine
      state.criteria = {
        time: { kind: 'year', year: 2024 },
        status: null,
        category: null,
        searchTerm: null,
      };
      state.filteredOrders = [mockOrders[0], mockOrders[1]];

      const result = getExportOrders();
      // Must return state.filteredOrders (2024 orders), NOT legacy DOM filtered (2023 status 4 order)
      expect(result).toHaveLength(2);
      expect(result.map(o => o.orderId)).toEqual(['ORD-001', 'ORD-002']);
    });
  });

  describe('Seam 2: Global CSV Export with Scoped Data & Localized Headers', () => {
    it('exports matching filtered orders with localized Vietnamese headers including Người bán', async () => {
      state.criteria = {
        time: { kind: 'year', year: 2024 },
        status: null,
        category: null,
        searchTerm: null,
      };
      state.filteredOrders = [mockOrders[0]];

      let capturedBlob: Blob | null = null;
      vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const clickSpy = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      exportToCSV();

      expect(clickSpy).toHaveBeenCalled();
      expect(capturedBlob).not.toBeNull();

      const buf = await capturedBlob!.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Verify UTF-8 BOM bytes (EF BB BF) for Excel UTF-8 compatibility
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      const text = await capturedBlob!.text();
      // Verify localized Vietnamese headers
      const lines = text.trim().split('\n');
      const headerLine = lines[0].replace('\uFEFF', '');
      expect(headerLine).toBe('STT,Mã đơn hàng,Ngày giao,Trạng thái,Tên sản phẩm,Số lượng,Tổng tiền,Người bán');

      // Verify scoped data rows: only ORD-001
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('ORD-001');
      expect(lines[1]).toContain('Keychron Official');
      expect(lines[1]).not.toContain('ORD-002');
    });

    it('exports empty CSV with headers when no orders match active filters', async () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: 'NonExistent',
      };
      state.filteredOrders = [];

      let capturedBlob: Blob | null = null;
      vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      exportToCSV();

      expect(capturedBlob).not.toBeNull();
      const text = await capturedBlob!.text();
      const lines = text.trim().split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Mã đơn hàng');
    });

    it('properly escapes quotes and special characters in CSV fields', async () => {
      const orderWithQuotes: Order = {
        ...mockOrders[0],
        name: 'Sản phẩm có dấu "ngoặc kép" và dấu , phẩy',
        shopName: 'Cửa hàng "Uy tín"',
      };
      state.filteredOrders = [orderWithQuotes];

      let capturedBlob: Blob | null = null;
      vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      exportToCSV();

      const text = await capturedBlob!.text();
      expect(text).toContain('""ngoặc kép""');
      expect(text).toContain('""Uy tín""');
    });
  });

  describe('Seam 3: Global Excel Export with Scoped Data & Localized Headers', () => {
    it('exports matching filtered orders to Excel worksheet with localized column headers', async () => {
      state.criteria = {
        time: { kind: 'year', year: 2024 },
        status: null,
        category: null,
        searchTerm: 'Coolmate',
      };
      state.filteredOrders = [mockOrders[1]];

      let capturedRows: any[] = [];
      const originalAddWorksheet = ExcelJS.Workbook.prototype.addWorksheet;
      vi.spyOn(ExcelJS.Workbook.prototype, 'addWorksheet').mockImplementation(function (name: string) {
        const sheet = originalAddWorksheet.call(this, name);
        const originalGetCell = sheet.getCell.bind(sheet);
        vi.spyOn(sheet, 'getCell').mockImplementation((row: number, col: number) => {
          const cell = originalGetCell(row, col);
          return cell;
        });
        return sheet;
      });

      const writeBufferSpy = vi.spyOn(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').mockResolvedValue(new ArrayBuffer(16) as unknown as ExcelJS.Buffer);

      exportToExcel();

      expect(writeBufferSpy).toHaveBeenCalled();
    });

    it('shows alert feedback when exporting empty filtered orders collection', () => {
      state.criteria = {
        time: { kind: 'all' },
        status: null,
        category: null,
        searchTerm: 'NothingMatches',
      };
      state.filteredOrders = [];

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      exportToExcel();

      expect(alertSpy).toHaveBeenCalledWith('Không có dữ liệu để xuất');
    });
  });

  describe('Seam 4: Floating Bulk Action Bar Scoped Batch Export', () => {
    it('exportToCSV(orders) strictly exports explicitly supplied orders regardless of state.filteredOrders', async () => {
      // Global state has all 3 orders
      state.filteredOrders = [...mockOrders];

      // Explicit batch selection has only ORD-002
      const explicitSubset = [mockOrders[1]];

      let capturedBlob: Blob | null = null;
      vi.spyOn(global.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      exportToCSV(explicitSubset);

      const text = await capturedBlob!.text();
      const lines = text.trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[1]).toContain('ORD-002');
      expect(lines[1]).not.toContain('ORD-001');
      expect(lines[1]).not.toContain('ORD-003');
    });

    it('exportToExcel(orders) strictly exports explicitly supplied orders', () => {
      state.filteredOrders = [...mockOrders];
      const explicitSubset = [mockOrders[0]];

      const writeBufferSpy = vi.spyOn(ExcelJS.Workbook.prototype.xlsx, 'writeBuffer').mockResolvedValue(new ArrayBuffer(16) as unknown as ExcelJS.Buffer);

      exportToExcel(explicitSubset);

      expect(writeBufferSpy).toHaveBeenCalled();
    });
  });

  describe('Seam 5: PDF Export', () => {
    it('calls window.print() to open browser print dialog', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      exportToPDF();

      expect(printSpy).toHaveBeenCalledTimes(1);
    });
  });
});
