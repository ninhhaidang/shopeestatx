import { type PeriodChange } from '../../../dashboard/overview.js';
import { t } from '../../../i18n/index.js';
import { money } from '../../format';

const KEYS = {
  month: { current: 'comparison.month', up: 'comparison.vsLastMonthUp', down: 'comparison.vsLastMonthDown', none: 'comparison.noLastMonth' },
  year: { current: 'comparison.year', up: 'comparison.vsLastYearUp', down: 'comparison.vsLastYearDown', none: 'comparison.noLastYear' },
} as const;
/** A period still running is compared with the same days of the one before ("cùng kỳ"). */
const SAME_DAYS_KEYS = {
  month: { current: 'comparison.monthThrough', up: 'comparison.vsSameMonthUp', down: 'comparison.vsSameMonthDown', none: 'comparison.noSameMonth' },
  year: { current: 'comparison.yearThrough', up: 'comparison.vsSameYearUp', down: 'comparison.vsSameYearDown', none: 'comparison.noSameYear' },
} as const;

/**
 * "Tháng 10/2026: 450.000 ₫ · ↑ 50% so với tháng 9/2026", or for a period still running
 * "Tháng 11/2026, đến ngày 17: … · ↑ 12% so với cùng kỳ tháng 10/2026". Names the period
 * compared, whatever the range total above is.
 */
export function ChangeLine({ unit, change, testId }: { unit: keyof typeof KEYS; change: PeriodChange; testId: string }) {
  const keys = change.through ? SAME_DAYS_KEYS[unit] : KEYS[unit];
  const through = change.through && { day: change.through.getDate(), date: `${change.through.getDate()}/${change.through.getMonth() + 1}` };
  const up = (change.percent ?? 0) >= 0;
  return (
    <p data-testid={testId} className="text-sm">
      <span className="text-muted">{t(keys.current, { period: change.label, amount: money(change.current), ...through })}</span>
      {' · '}
      <span className={change.percent === null ? 'text-muted' : `font-semibold ${up ? 'text-bad' : 'text-good'}`}>
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
