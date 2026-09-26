/** ShopeeStatX/date-range-picker.ts — Preset buttons and custom date input component */
import type { TimeCriteria, DatePreset } from '../types/index.js';
import { t } from '../i18n/index.js';
import { state } from './state.js';
import { applyFilters, syncCriteriaToToolbar } from './filters.js';
import { formatDate } from '../i18n/format.js';

/**
 * Identifier for relative date interval presets supported by the DateRangePicker.
 */
export type Preset = DatePreset;

const PRESETS: { key: Preset; i18nKey: string }[] = [
  { key: 'last7', i18nKey: 'daterange.last7days' },
  { key: 'thisMonth', i18nKey: 'daterange.thisMonth' },
  { key: 'lastMonth', i18nKey: 'daterange.lastMonth' },
  { key: 'last3months', i18nKey: 'daterange.last3months' },
  { key: 'thisYear', i18nKey: 'daterange.thisYear' },
  { key: 'custom', i18nKey: 'daterange.custom' },
];

function formatDateForInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compute TimeCriteria representation directly for a preset */
export function computePresetTimeCriteria(
  preset: Preset,
  refDate: Date = new Date(),
): TimeCriteria | null {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-based

  switch (preset) {
    case 'last7': {
      const end = new Date(refDate);
      end.setHours(23, 59, 59, 999);
      const start = new Date(refDate);
      start.setDate(refDate.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { kind: 'range', start, end };
    }
    case 'thisMonth': {
      return { kind: 'month', year, month: month + 1 };
    }
    case 'lastMonth': {
      const lastMonth = month === 0 ? 12 : month;
      const lastMonthYear = month === 0 ? year - 1 : year;
      return { kind: 'month', year: lastMonthYear, month: lastMonth };
    }
    case 'last3months': {
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const startMonthOffset = month - 2;
      const startYear = startMonthOffset < 0 ? year - 1 : year;
      const startMonth = ((startMonthOffset % 12) + 12) % 12;
      const start = new Date(startYear, startMonth, 1, 0, 0, 0, 0);
      return { kind: 'range', start, end };
    }
    case 'thisYear': {
      return { kind: 'year', year };
    }
    default:
      return null;
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Match an active TimeCriteria against known presets */
export function matchActivePreset(
  time: TimeCriteria | undefined | null,
  refDate: Date = new Date(),
): Preset | null {
  if (!time || time.kind === 'all' || time.kind === 'day') {
    return null;
  }

  if (time.kind === 'year') {
    const thisYear = computePresetTimeCriteria('thisYear', refDate);
    return thisYear?.kind === 'year' && time.year === thisYear.year ? 'thisYear' : null;
  }

  if (time.kind === 'month') {
    const thisMonth = computePresetTimeCriteria('thisMonth', refDate);
    if (
      thisMonth?.kind === 'month' &&
      time.year === thisMonth.year &&
      time.month === thisMonth.month
    ) {
      return 'thisMonth';
    }
    const lastMonth = computePresetTimeCriteria('lastMonth', refDate);
    if (
      lastMonth?.kind === 'month' &&
      time.year === lastMonth.year &&
      time.month === lastMonth.month
    ) {
      return 'lastMonth';
    }
    return null;
  }

  if (time.kind === 'range') {
    const last7 = computePresetTimeCriteria('last7', refDate) as {
      kind: 'range';
      start: Date;
      end: Date;
    };
    if (isSameDay(time.start, last7.start) && isSameDay(time.end, last7.end)) {
      return 'last7';
    }
    const last3 = computePresetTimeCriteria('last3months', refDate) as {
      kind: 'range';
      start: Date;
      end: Date;
    };
    if (isSameDay(time.start, last3.start) && isSameDay(time.end, last3.end)) {
      return 'last3months';
    }
    return 'custom';
  }

  return null;
}

/**
 * Synchronize the date range picker UI with current FilterCriteria time.
 */
export function syncDateRangePickerToCriteria(
  container: HTMLElement,
  refDate: Date = new Date(),
): void {
  const active = matchActivePreset(state.criteria?.time, refDate);

  container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === active);
  });

  const customPanel = container.querySelector('.drp-custom-panel') as HTMLElement | null;
  const startInput = container.querySelector('#drpStartDate') as HTMLInputElement | null;
  const endInput = container.querySelector('#drpEndDate') as HTMLInputElement | null;

  if (active === 'custom' && state.criteria?.time?.kind === 'range') {
    customPanel?.classList.remove('hidden');
    const { start, end } = state.criteria.time;
    if (startInput && start) {
      startInput.value = formatDateForInput(start);
    }
    if (endInput && end) {
      endInput.value = formatDateForInput(end);
    }
  } else if (!active) {
    customPanel?.classList.add('hidden');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
  } else {
    customPanel?.classList.add('hidden');
  }
}

function applyPreset(preset: Preset, container: HTMLElement): void {
  const currentActive = matchActivePreset(state.criteria?.time);
  const customPanel = container.querySelector('.drp-custom-panel') as HTMLElement | null;
  const isCustomPanelOpen = customPanel ? !customPanel.classList.contains('hidden') : false;

  // Toggle off if clicking already active preset, or toggling off custom panel
  if (currentActive === preset || (preset === 'custom' && isCustomPanelOpen)) {
    state.criteria = {
      ...state.criteria,
      time: { kind: 'all' },
    };
    state.currentPage = 1;
    syncCriteriaToToolbar(state.criteria);
    applyFilters({ syncFromDOM: false });
    return;
  }

  if (preset === 'custom') {
    customPanel?.classList.remove('hidden');
    container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === 'custom');
    });
    return;
  }

  customPanel?.classList.add('hidden');

  const timeCriteria = computePresetTimeCriteria(preset);
  if (!timeCriteria) return;


  state.criteria = {
    ...state.criteria,
    time: timeCriteria,
  };

  state.currentPage = 1;
  syncCriteriaToToolbar(state.criteria);
  applyFilters({ syncFromDOM: false });
}

/** Render the picker into the given container element */
export function renderDateRangePicker(container: HTMLElement): void {
  const active = matchActivePreset(state.criteria?.time);

  container.innerHTML = `
    <div class="date-range-picker">
      <div class="drp-presets">
        ${PRESETS.map(p => `
          <button class="drp-preset${active === p.key ? ' active' : ''}" data-preset="${p.key}">
            ${t(p.i18nKey)}
          </button>
        `).join('')}
      </div>
      <div class="drp-custom-panel${active === 'custom' ? '' : ' hidden'}">
        <div class="drp-custom-inputs">
          <label>
            <span class="drp-label" data-i18n="daterange.from">${t('daterange.from')}</span>
            <input type="date" id="drpStartDate" class="drp-date-input" aria-label="${t('daterange.from') || 'Từ ngày'}" />
          </label>
          <label>
            <span class="drp-label" data-i18n="daterange.to">${t('daterange.to')}</span>
            <input type="date" id="drpEndDate" class="drp-date-input" aria-label="${t('daterange.to') || 'Đến ngày'}" />
          </label>
        </div>
        <div class="drp-custom-actions">
          <button class="drp-btn-apply" id="drpApply">${t('daterange.apply')}</button>
          <button class="drp-btn-cancel" id="drpCancel">${t('daterange.cancel')}</button>
        </div>
      </div>
    </div>
  `;

  // Preset button clicks
  container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyPreset(btn.dataset.preset as Preset, container);
    });
  });

  // Custom apply
  container.querySelector('#drpApply')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const startInput = container.querySelector('#drpStartDate') as HTMLInputElement;
    const endInput = container.querySelector('#drpEndDate') as HTMLInputElement;

    if (!startInput?.value || !endInput?.value) return;

    const start = new Date(startInput.value + 'T00:00:00');
    const end = new Date(endInput.value + 'T23:59:59.999');

    if (start.getTime() > end.getTime()) return;

    const time: TimeCriteria = { kind: 'range', start, end };
    state.criteria = {
      ...state.criteria,
      time,
    };
    state.currentPage = 1;
    syncCriteriaToToolbar(state.criteria);
    applyFilters({ syncFromDOM: false });
  });

  // Custom cancel
  container.querySelector('#drpCancel')?.addEventListener('click', (e) => {
    e.stopPropagation();
    (container.querySelector('.drp-custom-panel') as HTMLElement)?.classList.add('hidden');
    if (state.criteria?.time?.kind === 'range' && matchActivePreset(state.criteria.time) === 'custom') {
      state.criteria = { ...state.criteria, time: { kind: 'all' } };
      state.currentPage = 1;
      syncCriteriaToToolbar(state.criteria);
      applyFilters({ syncFromDOM: false });
    } else {
      syncDateRangePickerToCriteria(container);
    }
  });

  // Sync state if already set
  if (state.criteria?.time?.kind === 'range') {
    const startInput = container.querySelector('#drpStartDate') as HTMLInputElement | null;
    const endInput = container.querySelector('#drpEndDate') as HTMLInputElement | null;
    if (startInput && state.criteria.time.start) {
      startInput.value = formatDateForInput(state.criteria.time.start);
    }
    if (endInput && state.criteria.time.end) {
      endInput.value = formatDateForInput(state.criteria.time.end);
    }
  }
}

/** Reset active preset state (called from clearAllFilters) */
export function resetDateRangePicker(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
    btn.classList.remove('active');
  });
  (container.querySelector('.drp-custom-panel') as HTMLElement)?.classList.add('hidden');
  const startInput = container.querySelector('#drpStartDate') as HTMLInputElement | null;
  const endInput = container.querySelector('#drpEndDate') as HTMLInputElement | null;
  if (startInput) startInput.value = '';
  if (endInput) endInput.value = '';
}

/** Get a human-readable summary of the current date range for display */
export function getDateRangeSummary(): string {
  const range = state.criteria?.time?.kind === 'range' ? state.criteria.time : null;
  if (!range?.start || !range?.end) return '';
  const startStr = formatDate(range.start);
  const endStr = formatDate(range.end);
  return t('filter.chip.dateRange', { start: startStr, end: endStr });
}
