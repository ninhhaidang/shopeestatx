import { t } from '../i18n/index.js';
import { RANGE_PRESETS, type RangePreset, type RangeSelection } from '../dashboard/range.js';
import { control } from '../ui/styles/classes';

const PRESET_LABEL: Record<RangePreset, string> = {
  all: 'dash.range.all',
  last7days: 'daterange.last7days',
  thisMonth: 'daterange.thisMonth',
  lastMonth: 'daterange.lastMonth',
  last3months: 'daterange.last3months',
  thisYear: 'daterange.thisYear',
  year: 'daterange.year',
  month: 'daterange.month',
  custom: 'daterange.custom',
};

/** Presets that need fields beyond the preset list. */
const RANGE_FIELDS = new Set<RangePreset>(['year', 'month', 'custom']);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  value: RangeSelection;
  onChange: (next: RangeSelection) => void;
  /** Years that have orders, newest first, for the "Theo năm" and "Theo tháng" choices. */
  years: number[];
  now: Date;
}

/** The global date range: a preset list, plus year/month or date fields where the preset needs them. */
export function RangePicker({ value, onChange, years, now }: Props) {
  const year = value.year ?? years[0] ?? now.getFullYear();
  const month = value.month ?? now.getMonth() + 1;
  const yearOptions = years.includes(year) ? years : [year, ...years];

  const choosePreset = (preset: RangePreset) =>
    onChange(preset === 'year' ? { preset, year } : preset === 'month' ? { preset, year, month } : { preset });

  return (
    // Narrow: the picker dissolves into the toolbar so the extra fields take a row of their own under it.
    <div className="contents @3xl:flex @3xl:flex-wrap @3xl:items-center @3xl:gap-2">
      <select
        aria-label={t('dash.range.label')}
        className={`${control} min-w-0 cursor-pointer`}
        value={value.preset}
        onChange={e => choosePreset(e.target.value as RangePreset)}
      >
        {RANGE_PRESETS.map(preset => (
          <option key={preset} value={preset}>
            {t(PRESET_LABEL[preset])}
          </option>
        ))}
      </select>
      {RANGE_FIELDS.has(value.preset) && (
        <div className="order-1 grid basis-full grid-cols-2 gap-2 @3xl:order-none @3xl:flex @3xl:basis-auto">
        {(value.preset === 'year' || value.preset === 'month') && (
          <select
            aria-label={t('dash.range.year')}
            className={`${control} min-w-0 cursor-pointer`}
            value={year}
            onChange={e => onChange({ ...value, year: Number(e.target.value) })}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
        {value.preset === 'month' && (
          <select
            aria-label={t('dash.range.month')}
            className={`${control} min-w-0 cursor-pointer`}
            value={month}
            onChange={e => onChange({ ...value, month: Number(e.target.value) })}
          >
            {MONTHS.map(m => (
              <option key={m} value={m}>{t(`month.${m}`)}</option>
            ))}
          </select>
        )}
        {value.preset === 'custom' && (
          <>
            <input
              type="date"
              aria-label={t('dash.range.from')}
              className={`${control} min-w-0`}
              value={value.from ?? ''}
              onChange={e => onChange({ ...value, from: e.target.value || undefined })}
            />
            <input
              type="date"
              aria-label={t('dash.range.to')}
              className={`${control} min-w-0`}
              value={value.to ?? ''}
              onChange={e => onChange({ ...value, to: e.target.value || undefined })}
            />
          </>
        )}
        </div>
      )}
    </div>
  );
}
