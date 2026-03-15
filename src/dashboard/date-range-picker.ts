// Date range picker component — preset buttons + custom date input panel
import { t } from '../i18n/index.js';
import { state } from './state.js';
import { applyFilters } from './filters.js';
import { formatDate } from '../i18n/format.js';

type Preset = 'last7' | 'thisMonth' | 'lastMonth' | 'last3months' | 'thisYear' | 'custom';

const PRESETS: { key: Preset; i18nKey: string }[] = [
  { key: 'last7', i18nKey: 'daterange.last7days' },
  { key: 'thisMonth', i18nKey: 'daterange.thisMonth' },
  { key: 'lastMonth', i18nKey: 'daterange.lastMonth' },
  { key: 'last3months', i18nKey: 'daterange.last3months' },
  { key: 'thisYear', i18nKey: 'daterange.thisYear' },
  { key: 'custom', i18nKey: 'daterange.custom' },
];

let activePreset: Preset | null = null;

/** Compute start/end dates for a preset */
function computePresetRange(preset: Preset): { start: Date; end: Date } | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  switch (preset) {
    case 'last7': {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'thisMonth': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'lastMonth': {
      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const start = new Date(lastMonthYear, lastMonth, 1);
      const end = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'last3months': {
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      // BUG-4: explicit year rollback instead of relying on JS Date negative-month overflow
      const startMonthOffset = month - 2;
      const startYear = startMonthOffset < 0 ? year - 1 : year;
      const startMonth = ((startMonthOffset % 12) + 12) % 12;
      const start = new Date(startYear, startMonth, 1);
      return { start, end };
    }
    case 'thisYear': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    default:
      return null;
  }
}

/** Set the hidden year/month selects to match a single-month preset for chart compatibility */
function syncYearMonthSelects(start: Date): void {
  const yearEl = document.getElementById('filterYear') as HTMLSelectElement;
  const monthEl = document.getElementById('filterMonth') as HTMLSelectElement;
  yearEl.value = String(start.getFullYear());
  monthEl.value = String(start.getMonth() + 1);
}

/** Clear the hidden year/month selects (for multi-month ranges) */
function clearYearMonthSelects(): void {
  (document.getElementById('filterYear') as HTMLSelectElement).value = '';
  (document.getElementById('filterMonth') as HTMLSelectElement).value = '';
}

function applyPreset(preset: Preset, container: HTMLElement): void {
  activePreset = preset;
  updateActiveButton(container);

  const customPanel = container.querySelector('.drp-custom-panel') as HTMLElement;
  if (preset === 'custom') {
    customPanel.classList.remove('hidden');
    return;
  }
  customPanel.classList.add('hidden');

  const range = computePresetRange(preset);
  if (!range) return;

  state.selectedDay = null;

  // ISSUE-1: for single-month presets, use year/month selects only — don't set dateRange
  // to avoid ghost-dateRange reactivation when chips are removed later
  if (preset === 'thisMonth' || preset === 'lastMonth') {
    state.dateRange = { start: null, end: null };
    syncYearMonthSelects(range.start);
  } else {
    state.dateRange = range;
    clearYearMonthSelects();
  }

  state.currentPage = 1;
  applyFilters();
}

function updateActiveButton(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === activePreset);
  });
}

/** Render the picker into the given container element */
export function renderDateRangePicker(container: HTMLElement): void {
  container.innerHTML = `
    <div class="date-range-picker">
      <div class="drp-presets">
        ${PRESETS.map(p => `
          <button class="drp-preset${activePreset === p.key ? ' active' : ''}" data-preset="${p.key}">
            ${t(p.i18nKey)}
          </button>
        `).join('')}
      </div>
      <div class="drp-custom-panel hidden">
        <div class="drp-custom-inputs">
          <label>
            <span class="drp-label" data-i18n="daterange.from">${t('daterange.from')}</span>
            <input type="date" id="drpStartDate" class="drp-date-input" />
          </label>
          <label>
            <span class="drp-label" data-i18n="daterange.to">${t('daterange.to')}</span>
            <input type="date" id="drpEndDate" class="drp-date-input" />
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

    if (!startInput.value && !endInput.value) return;

    const start = startInput.value ? new Date(startInput.value + 'T00:00:00') : null;
    const end = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;

    state.dateRange = { start, end };
    state.selectedDay = null;
    clearYearMonthSelects();
    state.currentPage = 1;
    applyFilters();
  });

  // Custom cancel
  container.querySelector('#drpCancel')?.addEventListener('click', (e) => {
    e.stopPropagation();
    activePreset = null;
    updateActiveButton(container);
    (container.querySelector('.drp-custom-panel') as HTMLElement).classList.add('hidden');
    state.dateRange = { start: null, end: null };
    state.currentPage = 1;
    applyFilters();
  });

  // Sync state if already set (e.g., after language switch re-render)
  if (state.dateRange.start || state.dateRange.end) {
    const startInput = container.querySelector('#drpStartDate') as HTMLInputElement;
    const endInput = container.querySelector('#drpEndDate') as HTMLInputElement;
    if (state.dateRange.start) startInput.value = state.dateRange.start.toISOString().slice(0, 10);
    if (state.dateRange.end) endInput.value = state.dateRange.end.toISOString().slice(0, 10);
  }
}

/** Re-render preset labels after language switch (keeps active state) */
export function refreshDateRangePickerLabels(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.drp-preset').forEach(btn => {
    const preset = PRESETS.find(p => p.key === btn.dataset.preset);
    if (preset) btn.textContent = t(preset.i18nKey);
  });
  const applyBtn = container.querySelector('#drpApply');
  if (applyBtn) applyBtn.textContent = t('daterange.apply');
  const cancelBtn = container.querySelector('#drpCancel');
  if (cancelBtn) cancelBtn.textContent = t('daterange.cancel');
  container.querySelectorAll('[data-i18n]').forEach(el => {
    (el as HTMLElement).textContent = t((el as HTMLElement).dataset.i18n!);
  });
}

/** Reset active preset state (called from clearAllFilters) */
export function resetDateRangePicker(container: HTMLElement): void {
  activePreset = null;
  updateActiveButton(container);
  (container.querySelector('.drp-custom-panel') as HTMLElement)?.classList.add('hidden');
  const startInput = container.querySelector('#drpStartDate') as HTMLInputElement | null;
  const endInput = container.querySelector('#drpEndDate') as HTMLInputElement | null;
  if (startInput) startInput.value = '';
  if (endInput) endInput.value = '';
}

/** Get a human-readable summary of the current date range for display */
export function getDateRangeSummary(): string {
  const { start, end } = state.dateRange;
  if (!start && !end) return '';
  const startStr = start ? formatDate(start) : '…';
  const endStr = end ? formatDate(end) : '…';
  return t('filter.chip.dateRange', { start: startStr, end: endStr });
}
