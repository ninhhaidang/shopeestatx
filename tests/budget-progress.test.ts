import { describe, expect, it } from 'vitest';
import { budgetProgress, type BudgetConfig } from '../src/dashboard/budget';

const config: BudgetConfig = { monthlyLimit: 1_000_000, enabled: true, alertThreshold: 0.8 };

describe('budgetProgress', () => {
  it('reports the percent spent and the colour band', () => {
    expect(budgetProgress(500_000, config)).toMatchObject({ percent: 50, level: 'ok', alert: false });
    expect(budgetProgress(700_000, config)).toMatchObject({ percent: 70, level: 'warn', alert: false });
    expect(budgetProgress(860_000, config)).toMatchObject({ percent: 86, level: 'danger', alert: true });
  });
  it('marks level danger when ratio crosses alert threshold even if threshold is low', () => {
    const lowThresholdConfig: BudgetConfig = { monthlyLimit: 1_000_000, enabled: true, alertThreshold: 0.5 };
    expect(budgetProgress(550_000, lowThresholdConfig)).toMatchObject({ level: 'danger', alert: true });
  });

  it('can exceed 100%', () => {
    expect(budgetProgress(1_250_000, config)).toMatchObject({ percent: 125, alert: true });
  });

  it('is empty without a limit', () => {
    expect(budgetProgress(500_000, { ...config, monthlyLimit: 0 })).toMatchObject({ percent: 0, alert: false });
  });

  it('works out how far the month-end prediction runs over the limit', () => {
    expect(budgetProgress(600_000, config, 1_075_000).predictedOver).toBe(75_000);
    expect(budgetProgress(600_000, config, 900_000).predictedOver).toBe(0);
    expect(budgetProgress(600_000, { ...config, enabled: false }, 1_075_000).predictedOver).toBe(0);
  });
});
