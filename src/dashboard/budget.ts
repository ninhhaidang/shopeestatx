// Budget tracking — chrome.storage config, SVG progress ring, threshold alerts
import { showToast, formatVND } from './utils.js';
import { STORAGE_KEYS } from '../config.js';

export interface BudgetConfig {
  monthlyLimit: number;   // VND
  enabled: boolean;
  alertThreshold: number; // 0.8 = alert at 80%
}

const STORAGE_KEY = STORAGE_KEYS.BUDGET;
const DEFAULT: BudgetConfig = { monthlyLimit: 5_000_000, enabled: false, alertThreshold: 0.8 };

/** Module-level cache — set via setCachedBudgetConfig() at startup */
let _cached: BudgetConfig = { ...DEFAULT };

export function getCachedBudgetConfig(): BudgetConfig { return _cached; }
export function setCachedBudgetConfig(cfg: BudgetConfig): void { _cached = cfg; }

export async function loadBudgetConfig(): Promise<BudgetConfig> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise(resolve => {
      chrome.storage.local.get(STORAGE_KEY, result => {
        resolve((result[STORAGE_KEY] as BudgetConfig) ?? DEFAULT);
      });
    });
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BudgetConfig) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export async function saveBudgetConfig(config: BudgetConfig): Promise<void> {
  setCachedBudgetConfig(config);
  resetBudgetAlert(); // ISSUE-4: re-evaluate alert with new config in same session
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEY]: config }, resolve));
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function buildRingSVG(percent: number, color: string): string {
  const r = 36, cx = 44, cy = 44, sw = 8;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(percent, 1) * circumference;
  return `<svg width="88" height="88" viewBox="0 0 88 88">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="${sw}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
      stroke-dasharray="${filled} ${circumference}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
      style="font-size:13px;font-weight:700;fill:${color}">${Math.round(percent * 100)}%</text>
  </svg>`;
}

let _alertFired = false;
export function resetBudgetAlert(): void { _alertFired = false; }

export function renderBudgetWidget(container: HTMLElement, spent: number, config: BudgetConfig): void {
  if (!config.enabled) {
    container.innerHTML = `
      <div class="budget-disabled">
        <p>Chưa thiết lập ngân sách</p>
        <button class="btn-budget-settings">Thiết lập</button>
      </div>`;
    return;
  }

  const percent = config.monthlyLimit > 0 ? spent / config.monthlyLimit : 0;
  const color = percent < 0.6 ? 'var(--success)' : percent < config.alertThreshold ? 'var(--warning)' : 'var(--danger)';

  container.innerHTML = `
    <div class="budget-ring-wrap">${buildRingSVG(percent, color)}</div>
    <div class="budget-info">
      <div class="budget-spent">${formatVND(spent)}</div>
      <div class="budget-limit">/ ${formatVND(config.monthlyLimit)}</div>
      <button class="btn-budget-settings">Sửa</button>
    </div>`;

  if (!_alertFired && percent >= config.alertThreshold) {
    _alertFired = true;
    showToast(`Cảnh báo: Đã tiêu ${Math.round(percent * 100)}% ngân sách tháng này!`);
  }
}
