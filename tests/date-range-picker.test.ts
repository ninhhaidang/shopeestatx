import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDateRangePicker, resetDateRangePicker } from '../src/dashboard/date-range-picker';
import { applyFilters } from '../src/dashboard/filters';
import { state } from '../src/dashboard/state';

vi.mock('../src/dashboard/filters', () => ({ applyFilters: vi.fn() }));

describe('custom date ranges', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterYear"><option value=""></option><option value="2025">2025</option></select>
      <select id="filterMonth"><option value=""></option><option value="1">1</option></select>
      <div id="dateRangePicker"></div>
    `;
    container = document.getElementById('dateRangePicker')!;
    state.dateRange = { start: null, end: null };
    state.selectedDay = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetDateRangePicker(container);
    state.dateRange = { start: null, end: null };
    state.selectedDay = null;
    state.currentPage = 1;
    document.body.innerHTML = '';
  });

  it('includes the final millisecond of the chosen local end date', () => {
    renderDateRangePicker(container);
    container.querySelector<HTMLButtonElement>('[data-preset="custom"]')!.click();
    container.querySelector<HTMLInputElement>('#drpStartDate')!.value = '2025-01-10';
    container.querySelector<HTMLInputElement>('#drpEndDate')!.value = '2025-01-15';
    state.currentPage = 3;
    state.selectedDay = 12;
    container.querySelector<HTMLButtonElement>('#drpApply')!.click();

    expect(state.dateRange.start).toEqual(new Date(2025, 0, 10));
    expect(state.dateRange.end).toEqual(new Date(2025, 0, 15, 23, 59, 59, 999));
    expect(state.selectedDay).toBeNull();
    expect(state.currentPage).toBe(1);
    expect(applyFilters).toHaveBeenCalledOnce();
  });

  it('restores local calendar dates rather than their UTC dates on rerender', () => {
    // Run under TZ=Asia/Ho_Chi_Minh and TZ=America/Los_Angeles to cover both UTC offsets.
    state.dateRange = {
      start: new Date(2025, 0, 10),
      end: new Date(2025, 0, 15, 23, 59, 59, 999),
    };
    renderDateRangePicker(container);

    expect(container.querySelector<HTMLInputElement>('#drpStartDate')!.value).toBe('2025-01-10');
    expect(container.querySelector<HTMLInputElement>('#drpEndDate')!.value).toBe('2025-01-15');
    container.querySelector<HTMLButtonElement>('#drpApply')!.click();
    expect(state.dateRange.start).toEqual(new Date(2025, 0, 10));
    expect(state.dateRange.end).toEqual(new Date(2025, 0, 15, 23, 59, 59, 999));
  });
});
