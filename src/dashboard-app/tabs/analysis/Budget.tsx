import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Meter, MeterIndicator, MeterTrack } from '@ui-sdk/react/meter';
import {
  budgetProgress,
  currentMonthSpend,
  loadBudgetConfig,
  saveBudgetConfig,
  type BudgetConfig,
} from '../../../dashboard/budget.js';
import { averageMonthSpend } from '../../../dashboard/month.js';
import { predictMonthEnd } from '../../../dashboard/predictions.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { Button } from '../../../ui/components/Button';
import { money, shortMoney } from '../../format';
import { card, chip } from '../../../ui/styles/classes';

const LEVEL_BAR = { ok: 'bg-good', warn: 'bg-warn-fg', danger: 'bg-bad' } as const;
const input = 'w-full rounded-lg border border-control-line bg-bg px-3 py-2 text-base';

function BudgetForm({ initial, onSave, onCancel }: { initial: BudgetConfig; onSave: (c: BudgetConfig) => Promise<void>; onCancel: () => void }) {
  const [limit, setLimit] = useState(String(initial.monthlyLimit));
  const [threshold, setThreshold] = useState(Math.round(initial.alertThreshold * 100));
  const [enabled, setEnabled] = useState(initial.enabled);
  const [failed, setFailed] = useState(false);
  const ids = { limit: useId(), threshold: useId() };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFailed(false);
    try {
      await onSave({ monthlyLimit: Number(limit), alertThreshold: threshold / 100, enabled });
    } catch {
      setFailed(true);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3.5 text-sm">
      <div className="grid gap-1.5">
        <label htmlFor={ids.limit} className="font-medium">{t('budget.limit.label')}</label>
        <input id={ids.limit} type="number" inputMode="numeric" required min={1} step={1} className={`num ${input}`} value={limit} onChange={e => setLimit(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={ids.threshold} className="font-medium">
          {t('budget.threshold.label')} <span className="num">{threshold}%</span>
        </label>
        <input id={ids.threshold} type="range" min={50} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <span>{t('budget.enabled.label')}</span>
      </label>
      {failed && <p role="alert" className="text-bad">{t('analysis.budget.saveError')}</p>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>{t('budget.btn.close')}</Button>
        <Button type="submit" className="!w-auto !px-5 !py-1.5 !text-sm">{t('budget.btn.save')}</Button>
      </div>
    </form>
  );
}

/**
 * Without a budget, this month against an average month: spent so far (solid), the month-end
 * prediction (faint) and a mark at the average month, with a sentence saying how far apart they are.
 */
function VersusAverage({ spent, prediction, average }: { spent: number; prediction: number; average: number }) {
  const scale = Math.max(spent, prediction, average) * 1.15;
  const at = (value: number) => `${(value / scale) * 100}%`;
  const diff = prediction > 0 ? Math.round(((prediction - average) / average) * 100) : null;
  return (
    <div className="mb-4 text-sm">
      <div aria-hidden="true" className="relative mt-3 h-2.5 rounded-full bg-line">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent-fill opacity-30" style={{ width: at(Math.max(spent, prediction)) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent-fill" style={{ width: at(spent) }} />
        <div className="absolute -inset-y-1.5 w-0.5 bg-fg" style={{ left: at(average) }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">{t('analysis.prediction.average', { amount: shortMoney(average) })}</p>
      {diff !== null && (
        <p data-testid="versus-average" className={`mt-2 font-medium ${diff > 0 ? 'text-bad' : diff < 0 ? 'text-good' : ''}`}>
          {diff === 0
            ? t('analysis.prediction.vsAverageSame')
            : t(diff > 0 ? 'analysis.prediction.vsAverageUp' : 'analysis.prediction.vsAverageDown', { n: Math.abs(diff) })}
        </p>
      )}
    </div>
  );
}

/**
 * Month-end prediction and the monthly budget. Both look at the calendar month of "now" over the whole
 * history, not at the global date range: a budget is always for this month.
 */
export function Budget({ allOrders, now }: { allOrders: Order[]; now: Date }) {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadBudgetConfig().then(cfg => alive && setConfig(cfg), () => alive && setLoadFailed(true));
    return () => { alive = false; };
  }, []);

  const spent = useMemo(() => currentMonthSpend(allOrders, now), [allOrders, now]);
  const prediction = useMemo(() => predictMonthEnd(allOrders, now), [allOrders, now]);
  const average = useMemo(() => averageMonthSpend(allOrders), [allOrders]);

  if (loadFailed) {
    return (
      <section aria-labelledby="analysis-budget" className={`${card} h-full`}>
        <h3 id="analysis-budget" className="mb-3 text-base font-semibold">{t('analysis.prediction.title')}</h3>
        <p role="alert" className="text-sm text-bad">{t('analysis.budget.loadError')}</p>
      </section>
    );
  }
  if (!config) return null;

  const progress = budgetProgress(spent, config, prediction);
  const { percent } = progress;

  const save = async (next: BudgetConfig) => {
    await saveBudgetConfig(next);
    setConfig(next);
    setEditing(false);
  };

  return (
    <section aria-labelledby="analysis-budget" className={`${card} h-full`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 id="analysis-budget" className="text-base font-semibold">{t('analysis.prediction.title')}</h3>
        <span className={chip}>{t('analysis.scope.month')}</span>
      </div>
      {/* With a budget, what was spent is in the budget figures below. */}
      {(!config.enabled || prediction > 0) && (
        <dl className="mb-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
          {!config.enabled && (
            <>
              <dt className="text-muted">{t('analysis.prediction.spent', { day: now.getDate(), month: now.getMonth() + 1 })}</dt>
              <dd className="num text-right font-semibold">{money(spent)}</dd>
            </>
          )}
          {prediction > 0 && (
            <>
              <dt className="text-muted">{t('analysis.prediction.label')}</dt>
              <dd className="num text-right font-semibold">{money(prediction)}</dd>
            </>
          )}
        </dl>
      )}
      {progress.predictedOver > 0 && <p className="mb-4 text-sm font-medium text-bad">{t('analysis.prediction.over', { amount: money(progress.predictedOver) })}</p>}
      {!config.enabled && average > 0 && <VersusAverage spent={spent} prediction={prediction} average={average} />}

      <h4 className="mb-2 text-sm font-semibold">{t('comparison.budget')}</h4>
      {editing ? (
        <BudgetForm initial={config} onSave={save} onCancel={() => setEditing(false)} />
      ) : !config.enabled ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <p className="text-muted">{t('analysis.budget.none')}</p>
          <Button variant="outline" onClick={() => setEditing(true)}>{t('analysis.budget.setup')}</Button>
        </div>
      ) : (
        <div className="grid gap-2.5 text-sm">
          <p data-testid="budget-figures" className="num">
            <strong className="text-xl">{money(spent)}</strong>
            <span className="text-muted"> / {money(config.monthlyLimit)}</span>
          </p>
          <Meter value={percent} aria-label={t('comparison.budget')} getValueLabel={() => `${percent}%`}>
            <MeterTrack className="h-2.5 overflow-hidden rounded-full bg-line">
              <MeterIndicator className={`h-full rounded-full ${LEVEL_BAR[progress.level]}`} />
            </MeterTrack>
          </Meter>
          <p className="num text-muted">{percent}%</p>
          {progress.alert && <p role="status" className="font-medium text-bad">{t('analysis.budget.alert', { percent })}</p>}
          <div><Button variant="outline" onClick={() => setEditing(true)}>{t('analysis.budget.edit')}</Button></div>
        </div>
      )}
    </section>
  );
}
