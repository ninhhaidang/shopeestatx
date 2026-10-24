// Builds a shareable PNG from aggregate stats only (no shop names, order ids or product names)
import type { Stats } from './stats.js';
import { formatCurrency } from '../i18n/format.js';
import { t } from '../i18n/index.js';

const W = 720;
const H = 520;

// The card is a fixed brand artwork, not themed: it must look the same wherever it is shared.
// Values mirror the Light tokens in src/ui/styles/tokens.css (text pairs pass WCAG AA).
const COLOR = {
  bg: '#f6f7f9',
  card: '#ffffff',
  line: '#d6dbe1',
  fg: '#14171c',
  muted: '#5b6470',
  accent: '#ee4d2d',
  accentText: '#c2371b',
};
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const PAD = 48;
const CARD_X = 24;
const CARD_Y = 24;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawShareImage(canvas: HTMLCanvasElement, stats: Stats): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);
  roundedRect(ctx, CARD_X, CARD_Y, W - 2 * CARD_X, H - 2 * CARD_Y, 20);
  ctx.fillStyle = COLOR.card;
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  const left = CARD_X + PAD - 8;
  const right = W - CARD_X - PAD + 8;
  const inner = right - left;

  // Header: serif orange wordmark + title.
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR.accentText;
  ctx.font = `600 30px ${SERIF}`;
  ctx.fillText('ShopeeStatX', left, 88);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLOR.muted;
  ctx.font = `18px ${SANS}`;
  ctx.fillText(t('stats.share.title'), right, 88, inner / 2);

  // Hero: net spend.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR.muted;
  ctx.font = `600 20px ${SANS}`;
  ctx.fillText(t('stats.netSpend'), left, 150);
  ctx.fillStyle = COLOR.fg;
  ctx.font = `700 64px ${SANS}`;
  ctx.fillText(formatCurrency(stats.netSpend), left, 220, inner);

  // Four headline figures as a 2x2 grid of tiles.
  const tiles: [string, string][] = [
    [t('stats.savings'), formatCurrency(stats.estimatedSavings)],
    [t('stats.refund'), formatCurrency(stats.refundTotal)],
    [t('stats.weekday'), stats.busiestWeekday === null ? t('stats.none') : t(`stats.weekday.${stats.busiestWeekday}`)],
    [t('stats.streak'), stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : t('stats.none')],
  ];
  const gap = 16;
  const tileW = (inner - gap) / 2;
  const tileH = 96;
  const gridY = 256;
  tiles.forEach(([label, value], i) => {
    const x = left + (i % 2) * (tileW + gap);
    const y = gridY + Math.floor(i / 2) * (tileH + gap);
    roundedRect(ctx, x, y, tileW, tileH, 14);
    ctx.fillStyle = COLOR.bg;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.muted;
    ctx.font = `16px ${SANS}`;
    ctx.fillText(label, x + 18, y + 34, tileW - 36);
    ctx.fillStyle = COLOR.fg;
    ctx.font = `700 28px ${SANS}`;
    ctx.fillText(value, x + 18, y + 72, tileW - 36);
  });
}

export function downloadShareImage(stats: Stats): void {
  const canvas = document.createElement('canvas');
  drawShareImage(canvas, stats);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = t('stats.share.file');
  a.click();
}
