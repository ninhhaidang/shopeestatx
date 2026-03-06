// Month-end spending prediction based on current daily pace
import type { Order } from '../types/index.js';
import { formatVND } from './utils.js';
import type { BudgetConfig } from './budget.js';

export function predictMonthEnd(allOrders: Order[]): number {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const thisMonthOrders = allOrders.filter(o =>
    o.orderMonth === now.getMonth() + 1 &&
    o.orderYear === now.getFullYear() &&
    o.statusCode !== 4 && o.statusCode !== 12
  );

  const currentSpending = thisMonthOrders.reduce((s, o) => s + o.subTotal, 0);
  // BUG-3: require at least 3 days of data to avoid wild early-month extrapolations
  if (dayOfMonth < 3 || currentSpending === 0) return 0;
  return Math.round((currentSpending / dayOfMonth) * daysInMonth);
}

export function renderPrediction(el: HTMLElement, prediction: number, config?: BudgetConfig): void {
  if (prediction === 0) { el.innerHTML = ''; return; }

  let html = `<div class="prediction-text">Dự kiến cuối tháng: <strong>${formatVND(prediction)}</strong></div>`;

  if (config?.enabled && config.monthlyLimit > 0 && prediction > config.monthlyLimit) {
    const over = prediction - config.monthlyLimit;
    html += `<div class="prediction-warn">⚠ Dự kiến vượt ngân sách ${formatVND(over)}</div>`;
  }

  el.innerHTML = html;
}
