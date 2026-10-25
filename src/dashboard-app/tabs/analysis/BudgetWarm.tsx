import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  budgetProgress,
  currentMonthSpend,
  loadBudgetConfig,
  saveBudgetConfig,
  type BudgetConfig,
} from '../../../dashboard/budget.js';
import { predictMonthEnd } from '../../../dashboard/predictions.js';
import { t } from '../../../i18n/index.js';
import type { Order } from '../../../types/index.js';
import { Button } from '../../../ui/components/Button';
import { money } from '../../format';

const LEVEL_BAR = { ok: 'bg-good', warn: 'bg-warn-fg', danger: 'bg-bad' } as const;
const input = 'w-full rounded-lg border border-warm-line bg-warm-card px-3 py-2 text-base font-serif text-warm-fg';

function BudgetFormWarm({ initial, onSave, onCancel }: { initial: BudgetConfig; onSave: (c: BudgetConfig) => Promise<void>; onCancel: () => void }) {
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
        <input id={ids.limit} type="number" inputMode="numeric" min={0} step={1} className={input} value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={ids.threshold} className="font-medium">
          {t('budget.threshold.label')} <span className="font-serif">{threshold}%</span>
        </label>
        <input id={ids.threshold} type="range" min={50} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
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
 * Month-end prediction and the monthly budget, warm variant: same budget.ts/predictions.ts
 * figures as Budget, read as a bare heading + prose + thin bar section instead of a bordered card.
 */
export function BudgetWarm({ allOrders, now }: { allOrders: Order[]; now: Date }) {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadBudgetConfig().then((cfg) => alive && setConfig(cfg));
    return () => {
      alive = false;
    };
  }, []);

  const spent = useMemo(() => currentMonthSpend(allOrders, now), [allOrders, now]);
  const prediction = useMemo(() => predictMonthEnd(allOrders, now), [allOrders, now]);

  if (!config) return null;

  const progress = budgetProgress(spent, config, prediction);
  const { percent } = progress;

  const save = async (next: BudgetConfig) => {
    await saveBudgetConfig(next);
    setConfig(next);
    setEditing(false);
  };

  return (
    <section aria-label={t('comparison.budget')}>
      {prediction > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('analysis.prediction.title')}</h2>
          <p>{t('analysis.prediction.label')} <b className="font-serif">{money(prediction)}</b></p>
          {progress.predictedOver > 0 && <p className="mt-1 font-medium text-bad">{t('analysis.prediction.over', { amount: money(progress.predictedOver) })}</p>}
        </div>
      )}

      <h2 className="mb-2 text-sm tracking-wide text-warm-muted">{t('comparison.budget')}</h2>
      {editing ? (
        <BudgetFormWarm initial={config} onSave={save} onCancel={() => setEditing(false)} />
      ) : !config.enabled ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <p className="text-warm-muted">{t('analysis.budget.none')}</p>
          <Button variant="outline" onClick={() => setEditing(true)}>{t('analysis.budget.setup')}</Button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          <p data-testid="budget-figures" className="font-serif">
            <b className="text-xl">{money(spent)}</b>
            <span className="text-warm-muted"> / {money(config.monthlyLimit)}</span>
          </p>
          <div
            role="progressbar"
            aria-label={t('comparison.budget')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percent, 100)}
            aria-valuetext={`${percent}%`}
            className="h-2.5 overflow-hidden rounded-full bg-warm-line"
          >
            <div className={`h-full rounded-full ${LEVEL_BAR[progress.level]}`} style={{ width: `${Math.min(percent, 100)}%` }} />
          </div>
          <p className="font-serif text-warm-muted">{percent}%</p>
          {progress.alert && <p role="status" className="font-medium text-bad">{t('analysis.budget.alert', { percent })}</p>}
          <div><Button variant="outline" onClick={() => setEditing(true)}>{t('analysis.budget.edit')}</Button></div>
        </div>
      )}
    </section>
  );
}
