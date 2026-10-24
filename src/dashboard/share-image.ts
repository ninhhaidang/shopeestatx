// Builds a shareable PNG from aggregate stats only (no shop names, order ids or product names)
import type { Stats } from './stats.js';
import { formatVND } from './utils.js';
import { t } from '../i18n/index.js';

const W = 720;
const H = 520;

export function drawShareImage(canvas: HTMLCanvasElement, stats: Stats): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ee4d2d';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(t('stats.share.title'), W / 2, 70);
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(formatVND(stats.netSpend), W / 2, 160);
  ctx.font = '22px sans-serif';
  ctx.fillText(t('stats.netSpend'), W / 2, 195);

  const rows: [string, string][] = [
    [t('stats.savings'), formatVND(stats.estimatedSavings)],
    [t('stats.refund'), formatVND(stats.refundTotal)],
    [t('stats.weekday'), stats.busiestWeekday === null ? t('stats.none') : t(`stats.weekday.${stats.busiestWeekday}`)],
    [t('stats.streak'), stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : t('stats.none')],
  ];
  rows.forEach(([label, value], i) => {
    const y = 270 + i * 62;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 80, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(value, W - 80, y);
  });
  ctx.textAlign = 'center';
  ctx.font = '16px sans-serif';
  ctx.fillText('ShopeeStatX', W / 2, H - 24);
}

export function downloadShareImage(stats: Stats): void {
  const canvas = document.createElement('canvas');
  drawShareImage(canvas, stats);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = t('stats.share.file');
  a.click();
}
