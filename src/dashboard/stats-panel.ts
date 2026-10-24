// Renders the spending stats cards, product lists and re-scan hint
import type { Stats } from './stats.js';
import { formatVND, escapeHtml } from './utils.js';
import { t } from '../i18n/index.js';

function card(label: string, value: string, hint?: string): string {
  const tip = hint ? ` title="${escapeHtml(hint)}"` : '';
  return `<div class="stat-card"${tip}><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`;
}

function list(title: string, rows: { name: string; value: string }[]): string {
  if (rows.length === 0) return '';
  const items = rows.map(r =>
    `<li><span class="stat-product-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</span><span class="stat-product-value">${escapeHtml(r.value)}</span></li>`).join('');
  return `<details class="stat-list"><summary>${escapeHtml(title)}</summary><ol>${items}</ol></details>`;
}

export function renderStatsPanel(container: HTMLElement, stats: Stats, stale: boolean): void {
  const none = t('stats.none');
  const banner = stale
    ? `<div class="stat-rescan"><span>${escapeHtml(t('stats.rescan'))}</span><button id="btnStatsRescan" class="btn-reset" type="button">${escapeHtml(t('stats.rescan.btn'))}</button></div>`
    : '';
  const cards = [
    card(t('stats.refund'), stale ? none : formatVND(stats.refundTotal), t('stats.excluded', { count: stats.excludedCount })),
    card(t('stats.savings'), stale ? none : formatVND(stats.estimatedSavings), t('stats.savings.hint')),
    card(t('stats.weekday'), stats.busiestWeekday === null ? none : t(`stats.weekday.${stats.busiestWeekday}`), t('stats.date.hint')),
    card(t('stats.hour'), stats.busiestHour === null ? none : `${stats.busiestHour}:00 – ${stats.busiestHour + 1}:00`, t('stats.date.hint')),
    card(t('stats.streak'), stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : none, t('stats.date.hint')),
    card(t('stats.rate'), stats.dailySpendRate ? t('stats.rate.unit', { amount: formatVND(stats.dailySpendRate) }) : none, t('stats.date.hint')),
  ].join('');
  const lists = stale ? '' :
    list(t('stats.topQuantity'), stats.topByQuantity.map(p => ({ name: p.name, value: t('stats.quantity.unit', { n: p.quantity }) }))) +
    list(t('stats.priciest'), stats.priciest.map(p => ({ name: p.name, value: formatVND(p.unitPrice) })));
  container.innerHTML = `${banner}<div class="stat-grid">${cards}</div>${lists}` +
    `<button id="btnShareImage" class="btn-reset" type="button">${escapeHtml(t('stats.share'))}</button>`;
}
