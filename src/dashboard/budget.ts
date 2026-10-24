// Budget tracking: the stored monthly limit and how far this month's spend is along it (pure parts + storage)
import { STORAGE_KEYS } from '../config.js';
import type { Order } from '../types/index.js';
import { monthSpend } from './month.js';

export interface BudgetConfig {
  monthlyLimit: number;   // VND
  enabled: boolean;
  alertThreshold: number; // 0.8 = alert at 80%
}

const STORAGE_KEY = STORAGE_KEYS.BUDGET;
export const DEFAULT_BUDGET: BudgetConfig = { monthlyLimit: 5_000_000, enabled: false, alertThreshold: 0.8 };

export async function loadBudgetConfig(): Promise<BudgetConfig> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise(resolve => {
      chrome.storage.local.get(STORAGE_KEY, result => {
        // Check for storage errors
        if (chrome.runtime.lastError) {
          console.error('Budget storage error:', chrome.runtime.lastError);
          resolve(DEFAULT_BUDGET);
          return;
        }
        resolve((result[STORAGE_KEY] as BudgetConfig) ?? DEFAULT_BUDGET);
      });
    });
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BudgetConfig) : DEFAULT_BUDGET;
  } catch {
    return DEFAULT_BUDGET;
  }
}

export async function saveBudgetConfig(config: BudgetConfig): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: config }, () => {
        if (chrome.runtime.lastError) {
          console.error('Budget save error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Budget localStorage error:', err);
  }
}

/** What the calendar month of `now` has cost so far (cancelled and returned orders excluded). */
export function currentMonthSpend(orders: Order[], now: Date): number {
  return monthSpend(orders, now.getMonth() + 1, now.getFullYear());
}

export interface BudgetProgress {
  /** Spent / limit, 1 = on the limit (can exceed 1). */
  ratio: number;
  /** `ratio` as a whole percent. */
  percent: number;
  /** Colour bands: below 60%, up to the alert threshold, beyond it. */
  level: 'ok' | 'warn' | 'danger';
  alert: boolean;
  /** How far the month-end `prediction` runs over the limit; 0 when it does not or the budget is off. */
  predictedOver: number;
}

export function budgetProgress(spent: number, config: BudgetConfig, prediction = 0): BudgetProgress {
  const ratio = config.monthlyLimit > 0 ? spent / config.monthlyLimit : 0;
  const level = ratio < 0.6 ? 'ok' : ratio < config.alertThreshold ? 'warn' : 'danger';
  const overLimit = config.enabled && config.monthlyLimit > 0 && prediction > config.monthlyLimit;
  return {
    ratio,
    percent: Math.round(ratio * 100),
    level,
    alert: ratio >= config.alertThreshold,
    predictedOver: overLimit ? prediction - config.monthlyLimit : 0,
  };
}
