import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Order, FilterCriteria } from '../src/types/index.js';
import { state } from '../src/dashboard/state.js';
import { EVENTS } from '../src/config.js';
import { handleDrillDown } from '../src/dashboard/filters.js';
import { renderHeatmap } from '../src/dashboard/heatmap.js';
import { renderCharts } from '../src/dashboard/charts.js';
import { Chart } from 'chart.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: '1001',
    name: 'Test Product',
    productCount: 1,
    subTotal: 250000,
    subTotalFormatted: '250.000 ₫',
    status: 'Hoàn thành',
    statusCode: 3,
    shopName: 'Shop A - Official',
    productSummary: 'Test Product x1',
    deliveryDate: '2024-05-15T10:00:00.000Z',
    orderMonth: 5,
    orderYear: 2024,
    ...overrides,
  };
}

describe('Decoupled Visual Drill-Down & Circular Event Elimination', () => {
  let container: HTMLDivElement;
  let chartCanvas: HTMLCanvasElement;
  let shopCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Setup DOM with toolbar, chart canvas, heatmap container, chips, and table
    document.body.innerHTML = `
      <select id="filterYear">
        <option value=""></option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
      <select id="filterMonth">
        <option value=""></option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
      <select id="filterStatus">
        <option value="">Tất cả</option>
        <option value="3">Hoàn thành</option>
      </select>
      <select id="filterCategory">
        <option value="">Tất cả</option>
      </select>
      <input id="searchBox" value="" />
      <div id="btnMoreFilters">
        <span class="filter-count"></span>
        <span class="filter-label"></span>
      </div>
      <div id="activeFiltersContainer" class="hidden">
        <div id="activeFilters"></div>
      </div>
      <div id="dateRangePickerContainer">
        <button id="dateRangePickerBtn">
          <span class="date-range-text">Tất cả thời gian</span>
        </button>
        <div id="dateRangePickerDropdown" class="hidden"></div>
      </div>
      <div id="heatmapContainer"></div>
      <canvas id="monthlyChart"></canvas>
      <canvas id="shopChart"></canvas>
      <div id="emptyState" class="hidden"></div>
      <div id="ordersTable"></div>
      <div id="paginationContainer"></div>
      <span id="totalOrders"></span>
      <span id="totalProducts"></span>
      <span id="totalAmount"></span>
      <span id="currentMonthAmount"></span>
      <span id="currentYearAmount"></span>
      <span id="avgOrderValue"></span>
      <span id="monthComparison"></span>
      <span id="yearComparison"></span>
      <span id="avgComparison"></span>
    `;
    container = document.getElementById('heatmapContainer') as HTMLDivElement;
    chartCanvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    shopCanvas = document.getElementById('shopChart') as HTMLCanvasElement;

    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    // Canvas mock for jsdom
    const mockContext = {
      canvas: chartCanvas,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    // Reset state
    state.selectedDay = null;
    state.dateRange = { start: null, end: null };
    state.currentSort = { field: null, direction: 'asc' };
    state.currentPage = 1;
    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: null,
    };
    state.allOrdersData = {
      count: 2,
      totalSpent: 500000,
      orders: [
        makeOrder({ orderId: '1', deliveryDate: '2024-05-15T10:00:00.000Z', orderYear: 2024, orderMonth: 5, subTotal: 250000 }),
        makeOrder({ orderId: '2', deliveryDate: '2024-06-20T10:00:00.000Z', orderYear: 2024, orderMonth: 6, subTotal: 250000 }),
      ],
    };
    state.filteredOrders = [...state.allOrdersData.orders];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Heatmap Visual Drill-Down', () => {
    it('day cell click triggers onDrillDown with day TimeCriteria', () => {
      (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
      const onDrillDown = vi.fn();
      renderHeatmap(container, state.allOrdersData!.orders, onDrillDown);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      expect(cell).not.toBeNull();

      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
      });
    });

    it('does not dispatch EVENTS.APPLY_FILTERS or directly mutate filter inputs on cell click', () => {
      (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
      const onDrillDown = vi.fn();
      const eventSpy = vi.fn();
      document.addEventListener(EVENTS.APPLY_FILTERS, eventSpy);

      renderHeatmap(container, state.allOrdersData!.orders, onDrillDown);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Seam check: no global event dispatch
      expect(eventSpy).not.toHaveBeenCalled();

      // Seam check: DOM inputs remain untouched by heatmap component itself
      expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('');
      expect(state.selectedDay).toBeNull();

      document.removeEventListener(EVENTS.APPLY_FILTERS, eventSpy);
    });

    it('re-clicking active heatmap day toggles selection off cleanly back to year if year was selected', () => {
      (document.getElementById('filterYear') as HTMLSelectElement).value = '2024';
      state.criteria = {
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
      };

      const onDrillDown = vi.fn();
      renderHeatmap(container, state.allOrdersData!.orders, onDrillDown);

      const cell = container.querySelector('.heatmap-cell[data-date="2024-05-15"]') as SVGElement;
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'year', year: 2024 },
      });
    });

    it('re-clicking active heatmap day toggles selection off cleanly back to all-time if no year was selected', () => {
      (document.getElementById('filterYear') as HTMLSelectElement).value = '';

      const onDrillDown = vi.fn();
      renderHeatmap(container, state.allOrdersData!.orders, onDrillDown);

      const firstCell = container.querySelector('.heatmap-cell[data-date]') as SVGElement;
      expect(firstCell).not.toBeNull();
      const dateStr = firstCell.dataset.date!;
      const [year, month, day] = dateStr.split('-').map(Number);

      state.criteria = {
        time: { kind: 'day', year: 0, month, day },
      };

      firstCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'all' },
      });
    });
  });

  describe('Spending Chart Visual Drill-Down', () => {
    it('clicking month bar triggers onDrillDown with month TimeCriteria', () => {
      vi.spyOn(Chart.prototype, 'destroy').mockImplementation(() => {});
      const chartSpy = vi.spyOn(Chart, 'register').mockImplementation(() => {});

      const onDrillDown = vi.fn();
      renderCharts(state.allOrdersData!.orders, onDrillDown);

      // Access the created chart instance options
      const chartInstance = Chart.getChart(chartCanvas);
      expect(chartInstance).toBeDefined();

      // Trigger onClick on the first bar (month 5/2024)
      const onClick = chartInstance!.options.onClick as Function;
      expect(onClick).toBeDefined();

      onClick({}, [{ index: 0 }]);

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'month', year: 2024, month: 5 },
      });
    });

    it('re-clicking active month bar toggles off back to year if year is present', () => {
      state.criteria = {
        time: { kind: 'month', year: 2024, month: 5 },
      };

      const onDrillDown = vi.fn();
      renderCharts(state.allOrdersData!.orders, onDrillDown);

      const chartInstance = Chart.getChart(chartCanvas);
      const onClick = chartInstance!.options.onClick as Function;

      // Re-click month 5/2024 (index 0)
      onClick({}, [{ index: 0 }]);

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'year', year: 2024 },
      });
    });

    it('re-clicking active month bar toggles off back to all-time if no year is present', () => {
      state.criteria = {
        time: { kind: 'month', year: 0, month: 5 },
      };

      const onDrillDown = vi.fn();
      renderCharts(state.allOrdersData!.orders, onDrillDown);

      const chartInstance = Chart.getChart(chartCanvas);
      const onClick = chartInstance!.options.onClick as Function;

      // Re-click month 5/2024 when year was 0
      onClick({}, [{ index: 0 }]);

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'all' },
      });
    });

    it('clicking an inactive month bar switches drill-down to that month', () => {
      state.criteria = {
        time: { kind: 'month', year: 2024, month: 5 },
      };

      const onDrillDown = vi.fn();
      renderCharts(state.allOrdersData!.orders, onDrillDown);

      const chartInstance = Chart.getChart(chartCanvas);
      const onClick = chartInstance!.options.onClick as Function;

      // Click month 6/2024 (index 1)
      onClick({}, [{ index: 1 }]);

      expect(onDrillDown).toHaveBeenCalledTimes(1);
      expect(onDrillDown).toHaveBeenCalledWith({
        time: { kind: 'month', year: 2024, month: 6 },
      });
    });
  });

  describe('handleDrillDown Synchronous Pipeline & Event Elimination', () => {
    it('updates criteria, syncs toolbar UI and active chips, and re-evaluates filtered orders synchronously', () => {
      const eventSpy = vi.fn();
      document.addEventListener(EVENTS.APPLY_FILTERS, eventSpy);

      handleDrillDown({
        time: { kind: 'month', year: 2024, month: 5 },
      });

      // 1. Criteria updated
      expect(state.criteria.time).toEqual({ kind: 'month', year: 2024, month: 5 });

      // 2. Toolbar synced
      expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('2024');
      expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('5');
      expect(state.currentPage).toBe(1);

      // 3. Active filter chips rendered
      const chipsEl = document.getElementById('activeFilters')!;
      const chips = chipsEl.querySelectorAll('.filter-chip');
      expect(chips.length).toBeGreaterThanOrEqual(1);

      // 4. Filtered orders re-evaluated synchronously
      expect(state.filteredOrders).toHaveLength(1);
      expect(state.filteredOrders[0].orderId).toBe('1');

      // 5. Zero EVENTS.APPLY_FILTERS dispatched
      expect(eventSpy).not.toHaveBeenCalled();

      document.removeEventListener(EVENTS.APPLY_FILTERS, eventSpy);
    });

    it('synchronously handles day drill-down and re-evaluates orders for that day', () => {
      handleDrillDown({
        time: { kind: 'day', year: 2024, month: 5, day: 15 },
      });

      expect(state.criteria.time).toEqual({ kind: 'day', year: 2024, month: 5, day: 15 });
      expect((document.getElementById('filterYear') as HTMLSelectElement).value).toBe('2024');
      expect((document.getElementById('filterMonth') as HTMLSelectElement).value).toBe('5');
      expect(state.selectedDay).toBe(15);
      expect(state.filteredOrders).toHaveLength(1);
      expect(state.filteredOrders[0].orderId).toBe('1');
    });
  });
});
