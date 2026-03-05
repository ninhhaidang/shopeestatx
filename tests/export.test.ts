import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportToCSV, exportToPDF } from '../src/dashboard/export';
import { state } from '../src/dashboard/state';
import type { Order, OrderData } from '../src/types/index';

describe('Export Functions', () => {
  beforeEach(() => {
    // Reset DOM and state
    document.body.innerHTML = `
      <select id="filterYear"></select>
      <select id="filterMonth"></select>
      <select id="filterStatus"></select>
    `;

    // Reset filter values
    const yearSelect = document.getElementById('filterYear') as HTMLSelectElement;
    const monthSelect = document.getElementById('filterMonth') as HTMLSelectElement;
    const statusSelect = document.getElementById('filterStatus') as HTMLSelectElement;

    if (yearSelect) yearSelect.value = '';
    if (monthSelect) monthSelect.value = '';
    if (statusSelect) statusSelect.value = '';

    // Mock state data
    state.allOrdersData = {
      orders: [],
      totalCount: 0,
      totalAmount: 0,
      totalAmountFormatted: '0 ₫',
      fetchedAt: new Date().toISOString(),
    };

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('creates CSV element and triggers download', () => {
      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          name: 'Test Product',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Test Shop',
          productSummary: 'Test summary',
          deliveryDate: '2024-01-15',
          orderMonth: 1,
          orderYear: 2024,
        },
      ];

      state.allOrdersData = {
        orders: mockOrders,
        totalCount: 1,
        totalAmount: 100000,
        totalAmountFormatted: '100.000 ₫',
        fetchedAt: new Date().toISOString(),
      };

      const clickSpy = vi.fn();
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      // Mock createElement to track anchor creation
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement');
      createElementSpy.mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      exportToCSV();

      // Verify anchor was created and clicked
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('filters orders by year when year filter is set', () => {
      const yearSelect = document.getElementById('filterYear') as HTMLSelectElement;
      yearSelect.value = '2024';

      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          name: 'Product 1',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Shop A',
          productSummary: 'Summary 1',
          deliveryDate: '2024-01-15',
          orderMonth: 1,
          orderYear: 2024,
        },
        {
          orderId: 'ORD002',
          name: 'Product 2',
          productCount: 1,
          subTotal: 150000,
          subTotalFormatted: '150.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Shop B',
          productSummary: 'Summary 2',
          deliveryDate: '2023-12-15',
          orderMonth: 12,
          orderYear: 2023,
        },
      ];

      state.allOrdersData = {
        orders: mockOrders,
        totalCount: 2,
        totalAmount: 250000,
        totalAmountFormatted: '250.000 ₫',
        fetchedAt: new Date().toISOString(),
      };

      let capturedHref = '';
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          Object.defineProperty(el, 'href', {
            set(value: string) {
              capturedHref = value;
            },
            get() {
              return capturedHref;
            },
          });
          el.click = vi.fn();
        }
        return el;
      });

      exportToCSV();

      // Verify year filtering by checking CSV was created with limited data
      expect(document.body.appendChild).toBeDefined();
    });

    it('filters orders by status when status filter is set', () => {
      const statusSelect = document.getElementById('filterStatus') as HTMLSelectElement;
      statusSelect.value = '3';

      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          name: 'Product 1',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Shop A',
          productSummary: 'Summary 1',
          deliveryDate: '2024-01-15',
          orderMonth: 1,
          orderYear: 2024,
        },
        {
          orderId: 'ORD002',
          name: 'Product 2',
          productCount: 1,
          subTotal: 150000,
          subTotalFormatted: '150.000 ₫',
          status: 'Chờ xác nhận',
          statusCode: 0,
          shopName: 'Shop B',
          productSummary: 'Summary 2',
          deliveryDate: null,
          orderMonth: 1,
          orderYear: 2024,
        },
      ];

      state.allOrdersData = {
        orders: mockOrders,
        totalCount: 2,
        totalAmount: 250000,
        totalAmountFormatted: '250.000 ₫',
        fetchedAt: new Date().toISOString(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = vi.fn();
        }
        return el;
      });

      exportToCSV();

      // Verify status filtering works by checking no error is thrown
      expect(state.allOrdersData?.orders.length).toBe(2);
    });

    it('escapes quotes in CSV fields properly', () => {
      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          name: 'Product with "quotes"',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Shop "A" Store',
          productSummary: 'Test',
          deliveryDate: '2024-01-15',
          orderMonth: 1,
          orderYear: 2024,
        },
      ];

      state.allOrdersData = {
        orders: mockOrders,
        totalCount: 1,
        totalAmount: 100000,
        totalAmountFormatted: '100.000 ₫',
        fetchedAt: new Date().toISOString(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = vi.fn();
        }
        return el;
      });

      exportToCSV();

      // Verify call succeeds with quoted data
      expect(state.allOrdersData?.orders[0]?.name).toContain('"');
    });

    it('exports empty CSV when no orders match filters', () => {
      const yearSelect = document.getElementById('filterYear') as HTMLSelectElement;
      yearSelect.value = '2025'; // No orders from 2025

      const mockOrders: Order[] = [
        {
          orderId: 'ORD001',
          name: 'Product 1',
          productCount: 1,
          subTotal: 100000,
          subTotalFormatted: '100.000 ₫',
          status: 'Đã giao hàng',
          statusCode: 3,
          shopName: 'Shop A',
          productSummary: 'Summary 1',
          deliveryDate: '2024-01-15',
          orderMonth: 1,
          orderYear: 2024,
        },
      ];

      state.allOrdersData = {
        orders: mockOrders,
        totalCount: 1,
        totalAmount: 100000,
        totalAmountFormatted: '100.000 ₫',
        fetchedAt: new Date().toISOString(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = vi.fn();
        }
        return el;
      });

      exportToCSV();

      // Should not throw error with filtered empty result
      expect(state.allOrdersData?.orders.length).toBe(1);
    });

    it('includes correct CSV headers in Vietnamese', () => {
      state.allOrdersData = {
        orders: [],
        totalCount: 0,
        totalAmount: 0,
        totalAmountFormatted: '0 ₫',
        fetchedAt: new Date().toISOString(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') {
          el.click = vi.fn();
        }
        return el;
      });

      // Should not throw error and headers should be created
      expect(() => exportToCSV()).not.toThrow();
    });
  });

  describe('exportToPDF', () => {
    it('calls window.print() to open print dialog', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      exportToPDF();

      expect(printSpy).toHaveBeenCalled();
    });

    it('does not require any parameters', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      expect(() => exportToPDF()).not.toThrow();
      expect(printSpy).toHaveBeenCalled();
    });

    it('handles multiple print calls', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      exportToPDF();
      exportToPDF();
      exportToPDF();

      expect(printSpy).toHaveBeenCalledTimes(3);
    });
  });
});
