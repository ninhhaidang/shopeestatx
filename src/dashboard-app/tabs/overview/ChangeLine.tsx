import { type PeriodChange } from '../../../dashboard/overview.js';
import { t } from '../../../i18n/index.js';
import { money } from '../../format';

const KEYS = {
  month: { current: 'comparison.month', up: 'comparison.vsLastMonthUp', down: 'comparison.vsLastMonthDown', none: 'comparison.noLastMonth' },
  year: { current: 'comparison.year', up: 'comparison.vsLastYearUp', down: 'comparison.vsLastYearDown', none: 'comparison.noLastYear' },
} as const;

/** "Tháng 10/2026: 450.000 ₫ · ↑ 50% so với tháng 9/2026": names the period compared, whatever the range total above is. */
export function ChangeLine({ unit, change, testId }: { unit: keyof typeof KEYS; change: PeriodChange; testId: string }) {
  const keys = KEYS[unit];
  const up = (change.percent ?? 0) >= 0;
  return (
    <p data-testid={testId} className="text-sm">
      <span className="text-muted">{t(keys.current, { period: change.label, amount: money(change.current) })}</span>
      {' · '}
      <span className={`font-semibold ${change.percent === null ? 'text-muted' : up ? 'text-bad' : 'text-good'}`}>
        {change.percent === null
          ? t(keys.none, { period: change.previousLabel })
          : t(up ? keys.up : keys.down, {
              change: Math.abs(change.percent).toLocaleString('vi-VN'),
              period: change.previousLabel,
            })}
      </span>
    </p>
  );
}
