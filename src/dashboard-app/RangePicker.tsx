import { t } from '../i18n/index.js';
import { RANGE_PRESETS, type RangePreset, type RangeSelection } from '../dashboard/range.js';

const PRESET_LABEL: Record<RangePreset, string> = {
  all: 'dash.range.all',
  thisMonth: 'daterange.thisMonth',
  lastMonth: 'daterange.lastMonth',
  last3months: 'daterange.last3months',
  thisYear: 'daterange.thisYear',
  custom: 'daterange.custom',
};

const control = 'rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-fg';

/** The global date range: a preset list, plus two date fields for a custom range. */
export function RangePicker({ value, onChange }: { value: RangeSelection; onChange: (next: RangeSelection) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t('dash.range.label')}
        className={`${control} cursor-pointer`}
        value={value.preset}
        onChange={e => onChange({ preset: e.target.value as RangePreset })}
      >
        {RANGE_PRESETS.map(preset => (
          <option key={preset} value={preset}>
            {t(PRESET_LABEL[preset])}
          </option>
        ))}
      </select>
      {value.preset === 'custom' && (
        <>
          <input
            type="date"
            aria-label={t('dash.range.from')}
            className={control}
            value={value.from ?? ''}
            max={value.to || undefined}
            onChange={e => onChange({ ...value, from: e.target.value || undefined })}
          />
          <input
            type="date"
            aria-label={t('dash.range.to')}
            className={control}
            value={value.to ?? ''}
            min={value.from || undefined}
            onChange={e => onChange({ ...value, to: e.target.value || undefined })}
          />
        </>
      )}
    </div>
  );
}
