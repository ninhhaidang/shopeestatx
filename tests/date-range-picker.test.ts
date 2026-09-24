/** ShopeeStatX/tests/date-range-picker.test.ts — Unit and integration tests for DateRangePicker */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computePresetTimeCriteria,
  matchActivePreset,
  renderDateRangePicker,
  resetDateRangePicker,
  syncDateRangePickerToCriteria,
} from '../src/dashboard/date-range-picker.js';
import { state } from '../src/dashboard/state.js';
import { applyFilters } from '../src/dashboard/filters.js';
import type { TimeCriteria, Order } from '../src/types/index.js';

describe('DateRangePicker - Pure Preset Criteria Resolution', () => {
  const refDate = new Date(2026, 8, 24, 12, 0, 0); // 2026-09-24

  describe('computePresetTimeCriteria', () => {
    it('computes "thisYear" as a year TimeCriteria', () => {
      const criteria = computePresetTimeCriteria('thisYear', refDate);
      expect(criteria).toEqual({
        kind: 'year',
        year: 2026,
      });
    });

    it('computes "thisMonth" as a month TimeCriteria for current year and month', () => {
      const criteria = computePresetTimeCriteria('thisMonth', refDate);
      expect(criteria).toEqual({
        kind: 'month',
        year: 2026,
        month: 9,
      });
    });

    it('computes "lastMonth" as a month TimeCriteria for previous month', () => {
      const criteria = computePresetTimeCriteria('lastMonth', refDate);
      expect(criteria).toEqual({
        kind: 'month',
        year: 2026,
        month: 8,
      });
    });

    it('computes "lastMonth" in January as December of previous year', () => {
      const janDate = new Date(2026, 0, 15); // 2026-01-15
      const criteria = computePresetTimeCriteria('lastMonth', janDate);
      expect(criteria).toEqual({
        kind: 'month',
        year: 2025,
        month: 12,
      });
    });

    it('computes "last7" as a 7-day inclusive range ending on reference day', () => {
      const criteria = computePresetTimeCriteria('last7', refDate);
      expect(criteria?.kind).toBe('range');
      if (criteria?.kind === 'range') {
        expect(criteria.start.getFullYear()).toBe(2026);
        expect(criteria.start.getMonth()).toBe(8);
        expect(criteria.start.getDate()).toBe(18);
        expect(criteria.start.getHours()).toBe(0);

        expect(criteria.end.getFullYear()).toBe(2026);
        expect(criteria.end.getMonth()).toBe(8);
        expect(criteria.end.getDate()).toBe(24);
        expect(criteria.end.getHours()).toBe(23);
      }
    });

    it('computes "last3months" as a range from 1st of (month - 2) to end of current month', () => {
      const criteria = computePresetTimeCriteria('last3months', refDate);
      expect(criteria?.kind).toBe('range');
      if (criteria?.kind === 'range') {
        // September 2026 -> 3 months = July, August, September (starts July 1)
        expect(criteria.start.getFullYear()).toBe(2026);
        expect(criteria.start.getMonth()).toBe(6); // July (0-indexed)
        expect(criteria.start.getDate()).toBe(1);

        expect(criteria.end.getFullYear()).toBe(2026);
        expect(criteria.end.getMonth()).toBe(8); // September
        expect(criteria.end.getDate()).toBe(30); // September has 30 days
      }
    });

    it('computes "last3months" across year boundary correctly (February -> Dec, Jan, Feb)', () => {
      const febDate = new Date(2026, 1, 10); // 2026-02-10
      const criteria = computePresetTimeCriteria('last3months', febDate);
      expect(criteria?.kind).toBe('range');
      if (criteria?.kind === 'range') {
        expect(criteria.start.getFullYear()).toBe(2025);
        expect(criteria.start.getMonth()).toBe(11); // December 2025
        expect(criteria.start.getDate()).toBe(1);

        expect(criteria.end.getFullYear()).toBe(2026);
        expect(criteria.end.getMonth()).toBe(1); // February 2026
        expect(criteria.end.getDate()).toBe(28); // 2026 is non-leap year
      }
    });

    it('returns null for "custom" preset', () => {
      expect(computePresetTimeCriteria('custom', refDate)).toBeNull();
    });
  });

  describe('matchActivePreset', () => {
    it('returns null for "all" or null criteria', () => {
      expect(matchActivePreset({ kind: 'all' }, refDate)).toBeNull();
      expect(matchActivePreset(null, refDate)).toBeNull();
      expect(matchActivePreset(undefined, refDate)).toBeNull();
    });

    it('matches "thisYear" when time criteria is current year', () => {
      expect(matchActivePreset({ kind: 'year', year: 2026 }, refDate)).toBe('thisYear');
      expect(matchActivePreset({ kind: 'year', year: 2025 }, refDate)).toBeNull();
    });

    it('matches "thisMonth" and "lastMonth" when time criteria is matching month', () => {
      expect(matchActivePreset({ kind: 'month', year: 2026, month: 9 }, refDate)).toBe('thisMonth');
      expect(matchActivePreset({ kind: 'month', year: 2026, month: 8 }, refDate)).toBe('lastMonth');
      expect(matchActivePreset({ kind: 'month', year: 2026, month: 7 }, refDate)).toBeNull();
      expect(matchActivePreset({ kind: 'month', year: 2025, month: 9 }, refDate)).toBeNull();
    });

    it('matches "last7" when range matches the last 7 days interval', () => {
      const last7Range = computePresetTimeCriteria('last7', refDate);
      expect(matchActivePreset(last7Range, refDate)).toBe('last7');
    });

    it('matches "last3months" when range matches the last 3 months interval', () => {
      const last3Range = computePresetTimeCriteria('last3months', refDate);
      expect(matchActivePreset(last3Range, refDate)).toBe('last3months');
    });

    it('matches "custom" when range does not match last7 or last3months', () => {
      const arbitraryRange: TimeCriteria = {
        kind: 'range',
        start: new Date(2026, 4, 1),
        end: new Date(2026, 4, 15),
      };
      expect(matchActivePreset(arbitraryRange, refDate)).toBe('custom');
    });

    it('returns null for day criteria', () => {
      expect(matchActivePreset({ kind: 'day', year: 2026, month: 9, day: 24 }, refDate)).toBeNull();
    });
  });
});

describe('DateRangePicker - Component Seam Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterYear">
        <option value=""></option>
        <option value="2026">2026</option>
        <option value="2025">2025</option>
      </select>
      <select id="filterMonth">
        <option value=""></option>
        <option value="8">8</option>
        <option value="9">9</option>
      </select>
      <select id="filterStatus"><option value=""></option></select>
      <select id="filterCategory"><option value=""></option></select>
      <input id="searchBox" value="" />
      <div id="dateRangePickerContainer"></div>
      <div id="activeFiltersContainer" class="hidden">
        <div id="activeFilters"></div>
        <button id="btnClearFilters">Clear</button>
      </div>
      <div id="emptyState" class="hidden"></div>
      <div id="ordersTable"></div>
      <div id="paginationContainer"></div>
    `;

    container = document.getElementById('dateRangePickerContainer')!;

    state.criteria = {
      time: { kind: 'all' },
      status: null,
      category: null,
      searchTerm: null,
      sort: null,
    };
    state.allOrdersData = {
      count: 2,
      totalSpent: 100000,
      orders: [
        {
          orderId: '1',
          deliveryDate: '2026-09-20T00:00:00.000Z',
          orderDate: '2026-09-18T00:00:00.000Z',
          orderYear: 2026,
          orderMonth: 9,
          totalPrice: 50000,
          statusCode: 3,
          statusText: 'Hoàn thành',
          shopName: 'Shop A',
          itemCount: 1,
          items: [{ name: 'Áo thun' }],
        } as Order,
        {
          orderId: '2',
          deliveryDate: '2026-08-15T00:00:00.000Z',
          orderDate: '2026-08-10T00:00:00.000Z',
          orderYear: 2026,
          orderMonth: 8,
          totalPrice: 50000,
          statusCode: 3,
          statusText: 'Hoàn thành',
          shopName: 'Shop B',
          itemCount: 1,
          items: [{ name: 'Quần jeans' }],
        } as Order,
      ],
    };

    renderDateRangePicker(container);
  });

  it('renders all preset buttons and custom panel in container', () => {
    const presets = container.querySelectorAll('.drp-preset');
    expect(presets.length).toBe(6); // last7, thisMonth, lastMonth, last3months, thisYear, custom
    const customPanel = container.querySelector('.drp-custom-panel');
    expect(customPanel).not.toBeNull();
    expect(customPanel?.classList.contains('hidden')).toBe(true);
  });

  it('clicking relative preset updates state.criteria.time directly', () => {
    const btnThisYear = container.querySelector('[data-preset="thisYear"]') as HTMLButtonElement;
    btnThisYear.click();

    const currentYear = new Date().getFullYear();
    expect(state.criteria.time).toEqual({
      kind: 'year',
      year: currentYear,
    });
    expect(btnThisYear.classList.contains('active')).toBe(true);
  });

  it('zero imperative mutations of #filterYear / #filterMonth during range date selection', () => {
    const yearEl = document.getElementById('filterYear') as HTMLSelectElement;
    const monthEl = document.getElementById('filterMonth') as HTMLSelectElement;
    yearEl.value = '2025';
    monthEl.value = '8';

    const btnLast7 = container.querySelector('[data-preset="last7"]') as HTMLButtonElement;
    btnLast7.click();

    expect(state.criteria.time.kind).toBe('range');
    // Date range picker must not imperatively set dropdown values
    // syncCriteriaToToolbar will clear them because criteria is range, not faking month/year
    expect(yearEl.value).toBe('');
    expect(monthEl.value).toBe('');
  });

  it('custom date range selection produces { kind: "range", start, end } and updates active chips', () => {
    const btnCustom = container.querySelector('[data-preset="custom"]') as HTMLButtonElement;
    btnCustom.click();

    const customPanel = container.querySelector('.drp-custom-panel') as HTMLElement;
    expect(customPanel.classList.contains('hidden')).toBe(false);

    const startInput = container.querySelector('#drpStartDate') as HTMLInputElement;
    const endInput = container.querySelector('#drpEndDate') as HTMLInputElement;
    const btnApply = container.querySelector('#drpApply') as HTMLButtonElement;

    startInput.value = '2026-05-01';
    endInput.value = '2026-05-15';
    btnApply.click();

    expect(state.criteria.time.kind).toBe('range');
    if (state.criteria.time.kind === 'range') {
      expect(state.criteria.time.start.getFullYear()).toBe(2026);
      expect(state.criteria.time.start.getMonth()).toBe(4);
      expect(state.criteria.time.start.getDate()).toBe(1);
      expect(state.criteria.time.end.getDate()).toBe(15);
    }

    // Verify active filter chip is derived and rendered
    const chips = document.querySelectorAll('.filter-chip');
    expect(chips.length).toBe(1);
    expect(chips[0].getAttribute('data-type')).toBe('dateRange');
    expect(chips[0].textContent).toContain('1/5/2026');
    expect(chips[0].textContent).toContain('15/5/2026');
  });

  it('date picker preset buttons reflect active state based on criteria.time', () => {
    const now = new Date();
    state.criteria = {
      ...state.criteria,
      time: { kind: 'month', year: now.getFullYear(), month: now.getMonth() + 1 },
    };

    syncDateRangePickerToCriteria(container);

    const thisMonthBtn = container.querySelector('[data-preset="thisMonth"]');
    const thisYearBtn = container.querySelector('[data-preset="thisYear"]');
    expect(thisMonthBtn?.classList.contains('active')).toBe(true);
    expect(thisYearBtn?.classList.contains('active')).toBe(false);
  });

  it('removing a date range chip via chip close button clears temporal filter without ghost dates', () => {
    // Set custom range
    const start = new Date(2026, 4, 1);
    const end = new Date(2026, 4, 15);
    state.criteria = {
      ...state.criteria,
      time: { kind: 'range', start, end },
    };
    applyFilters({ syncFromDOM: false });
    syncDateRangePickerToCriteria(container);

    // Preset custom button is active
    const customBtn = container.querySelector('[data-preset="custom"]');
    expect(customBtn?.classList.contains('active')).toBe(true);

    // Click chip remove button
    const chipRemoveBtn = document.querySelector('.chip-remove') as HTMLButtonElement;
    expect(chipRemoveBtn).not.toBeNull();
    chipRemoveBtn.click();

    // State criteria must be reset to 'all'
    expect(state.criteria.time).toEqual({ kind: 'all' });

    // Dropdowns and preset buttons must not have ghost state
    const yearEl = document.getElementById('filterYear') as HTMLSelectElement;
    const monthEl = document.getElementById('filterMonth') as HTMLSelectElement;
    expect(yearEl.value).toBe('');
    expect(monthEl.value).toBe('');

    syncDateRangePickerToCriteria(container);
    expect(customBtn?.classList.contains('active')).toBe(false);
  });

  it('clicking an active preset toggles it off back to all-time', () => {
    const btnThisYear = container.querySelector('[data-preset="thisYear"]') as HTMLButtonElement;
    btnThisYear.click();
    expect(state.criteria.time.kind).toBe('year');
    expect(btnThisYear.classList.contains('active')).toBe(true);

    // Click again to toggle off
    btnThisYear.click();
    expect(state.criteria.time).toEqual({ kind: 'all' });
    expect(btnThisYear.classList.contains('active')).toBe(false);
  });

  it('clicking custom preset when already open toggles it closed back to all-time', () => {
    const btnCustom = container.querySelector('[data-preset="custom"]') as HTMLButtonElement;
    const customPanel = container.querySelector('.drp-custom-panel') as HTMLElement;

    // First click opens
    btnCustom.click();
    expect(customPanel.classList.contains('hidden')).toBe(false);

    // Second click closes
    btnCustom.click();
    expect(customPanel.classList.contains('hidden')).toBe(true);
    expect(state.criteria.time).toEqual({ kind: 'all' });
  });

  it('custom apply requires both start and end dates and rejects inverted ranges', () => {
    const btnCustom = container.querySelector('[data-preset="custom"]') as HTMLButtonElement;
    btnCustom.click();

    const startInput = container.querySelector('#drpStartDate') as HTMLInputElement;
    const endInput = container.querySelector('#drpEndDate') as HTMLInputElement;
    const btnApply = container.querySelector('#drpApply') as HTMLButtonElement;

    // Only start provided
    startInput.value = '2026-05-01';
    endInput.value = '';
    btnApply.click();
    expect(state.criteria.time).toEqual({ kind: 'all' });

    // Inverted range (start > end)
    startInput.value = '2026-05-15';
    endInput.value = '2026-05-01';
    btnApply.click();
    expect(state.criteria.time).toEqual({ kind: 'all' });
  });
});
