// Builds a shareable PNG from aggregate stats only (no shop names, order ids or product names).
// Three artworks in four sizes; each is a fixed design, not themed, so it looks the same wherever it is posted.
import type { Stats } from './stats.js';
import { formatCurrency } from '../i18n/format.js';
import { t } from '../i18n/index.js';

export type ShareTemplate = 'label' | 'bold' | 'night';
export type ShareRatio = 'square' | 'portrait' | 'story' | 'wide';

export const SHARE_TEMPLATES: ShareTemplate[] = ['label', 'bold', 'night'];
/** Pixel sizes the social networks ask for: feed square, feed portrait (4:5), story (9:16), link preview (1.91:1). */
export const SHARE_RATIOS: Record<ShareRatio, [number, number]> = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  story: [1080, 1920],
  wide: [1200, 630],
};

export interface ShareData {
  stats: Stats;
  /** False when the cache predates refund/savings: those two figures are drawn as unknown. */
  financialAvailable: boolean;
  /** Net spend per month of the selected range, oldest first; drawn as a small bar strip on tall sizes. */
  monthly: number[];
  /** Orders of the selected range, counted like the Số đơn tile; fills in for a figure with nothing to show. */
  orders: number;
}

const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const ORANGE = '#ee4d2d';

interface Look {
  bg: string;
  fg: string;
  muted: string;
  brand: string;
  bars: string;
  /** Fill of a figure cell, or null for an outlined / ruled cell. */
  cell: string | null;
  rule: string;
}

const LOOKS: Record<ShareTemplate, Look> = {
  // "Vận đơn": the parcel label every Shopee order arrives with.
  label: { bg: '#ffffff', fg: '#14171c', muted: '#5b6470', brand: '#ffffff', bars: '#14171c', cell: null, rule: '#14171c' },
  bold: { bg: ORANGE, fg: '#ffffff', muted: 'rgba(255,255,255,0.82)', brand: '#ffffff', bars: 'rgba(255,255,255,0.34)', cell: null, rule: 'rgba(255,255,255,0.45)' },
  night: { bg: '#14171c', fg: '#f5f6f8', muted: '#9aa3af', brand: '#ff6a4d', bars: '#ff6a4d', cell: '#1e2229', rule: '#2b3038' },
};

/** Largest size (stepping down from `size`) at which `text` fits `maxWidth`; leaves ctx.font set. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number): number {
  let px = size;
  for (;;) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (px <= 18 || ctx.measureText(text).width <= maxWidth) return px;
    px -= 4;
  }
}

/** Up to four figures worth showing off: a zero or unknown one is left out, and Số đơn takes its place. */
function figures(data: ShareData): [string, string][] {
  const { stats, financialAvailable, orders } = data;
  const all: [string, string | null][] = [
    [t('stats.savings'), financialAvailable && stats.estimatedSavings > 0 ? formatCurrency(stats.estimatedSavings) : null],
    [t('stats.refund'), financialAvailable && stats.refundTotal > 0 ? formatCurrency(stats.refundTotal) : null],
    [t('stats.weekday'), stats.busiestWeekday === null ? null : t(`stats.weekday.${stats.busiestWeekday}`)],
    [t('stats.streak'), stats.longestMonthStreak ? t('stats.streak.unit', { n: stats.longestMonthStreak }) : null],
    [t('dash.overview.orders'), orders > 0 ? t('popup.orders', { n: orders.toLocaleString('vi-VN') }) : null],
  ];
  return all.filter((figure): figure is [string, string] => figure[1] !== null).slice(0, 4);
}

/** Barcode stripes derived from the amount, so the same figure always prints the same code. */
function barcode(ctx: CanvasRenderingContext2D, seed: number, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  let state = Math.max(1, Math.round(seed)) % 2147483647;
  for (let at = x; at < x + w; ) {
    state = (state * 48271) % 2147483647;
    const bar = 3 + (state % 4) * 3;
    const gap = 3 + ((state >> 3) % 3) * 3;
    ctx.fillRect(at, y, Math.min(bar, x + w - at), h);
    at += bar + gap;
  }
}

function monthBars(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, w: number, h: number, color: string): void {
  const max = Math.max(...values, 1);
  const step = w / values.length;
  const barW = Math.max(2, Math.min(step * 0.72, 46));
  ctx.fillStyle = color;
  values.forEach((value, i) => {
    const barH = Math.max(value > 0 ? 6 : 0, (value / max) * h);
    if (!barH) return;
    ctx.beginPath();
    ctx.roundRect(x + i * step + (step - barW) / 2, y + h - barH, barW, barH, [Math.min(8, barW / 2), Math.min(8, barW / 2), 0, 0]);
    ctx.fill();
  });
}

function cell(ctx: CanvasRenderingContext2D, look: Look, template: ShareTemplate, [label, value]: [string, string], x: number, y: number, w: number, h: number, u: number): void {
  const inset = template === 'bold' ? 0 : 26 * u;
  if (look.cell) {
    ctx.fillStyle = look.cell;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 22 * u);
    ctx.fill();
  } else if (template === 'label') {
    ctx.strokeStyle = look.rule;
    ctx.lineWidth = 3 * u;
    ctx.strokeRect(x, y, w, h);
  } else {
    // A rule above each figure, no box.
    ctx.fillStyle = look.rule;
    ctx.fillRect(x, y, w, 2 * u);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = look.muted;
  ctx.font = `500 ${26 * u}px ${FONT}`;
  ctx.fillText(label, x + inset, y + h * 0.38, w - 2 * inset);
  ctx.fillStyle = look.fg;
  fit(ctx, value, w - 2 * inset, 46 * u, 700);
  ctx.fillText(value, x + inset, y + h * 0.78, w - 2 * inset);
}

export function drawShareImage(canvas: HTMLCanvasElement, data: ShareData, template: ShareTemplate = 'label', ratio: ShareRatio = 'square'): void {
  const [W, H] = SHARE_RATIOS[ratio];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  // jsdom has no canvas; there is nothing to draw on.
  if (!ctx) return;
  const look = LOOKS[template];
  const wide = ratio === 'wide';
  // One unit is a pixel of the 1080-wide artwork; the link preview is drawn smaller.
  const u = wide ? 0.62 : 1;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, W, H);

  // Frame. The parcel label has a heavy border and an orange header band; stories keep clear of the app chrome.
  const frame = template === 'label' ? 36 * u : 0;
  const padX = frame + 64 * u;
  const padTop = (ratio === 'story' ? 230 : 0) + frame + 64 * u;
  const padBottom = (ratio === 'story' ? 250 : 0) + frame + 64 * u;
  const left = padX;
  const right = W - padX;
  const inner = right - left;
  const headerH = 84 * u;

  if (template === 'label') {
    const top = padTop - 64 * u;
    const bottom = H - padBottom + 64 * u;
    if (ratio === 'story') {
      // The label sits on an orange ground, like a sticker on a parcel.
      ctx.fillStyle = ORANGE;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = look.bg;
      ctx.fillRect(frame, top, W - 2 * frame, bottom - top);
    }
    ctx.fillStyle = ORANGE;
    ctx.fillRect(frame, top, W - 2 * frame, headerH + 44 * u);
    ctx.strokeStyle = look.rule;
    ctx.lineWidth = 8 * u;
    ctx.strokeRect(frame, top, W - 2 * frame, bottom - top);
    ctx.fillStyle = look.rule;
    ctx.fillRect(frame, top + headerH + 44 * u, W - 2 * frame, 8 * u);
  }

  // Header: wordmark and what this is.
  let y = padTop;
  const headY = y + (template === 'label' ? 16 : 44) * u;
  ctx.textAlign = 'left';
  ctx.fillStyle = look.brand;
  ctx.font = `700 ${44 * u}px ${FONT}`;
  ctx.fillText('ShopeeStatX', left, headY);
  ctx.textAlign = 'right';
  ctx.fillStyle = template === 'label' ? '#ffffff' : look.muted;
  ctx.font = `500 ${28 * u}px ${FONT}`;
  ctx.fillText(t('stats.share.title'), right, headY - 2 * u, inner * 0.55);
  y += headerH + (template === 'label' ? 44 * u : 0);

  // What is left is shared out between the hero, the figures and (on tall sizes) the month strip.
  const cells = figures(data);
  const columns = wide ? Math.max(1, cells.length) : 2;
  const rows = Math.ceil(cells.length / columns);
  const cellGap = 20 * u;
  const cellH = (wide ? 150 : 172) * u;
  const gridH = rows ? rows * cellH + (rows - 1) * cellGap : 0;
  const heroH = 236 * u;
  const codeH = template === 'label' && !wide ? 92 * u : 0;
  const free = H - padBottom - y - heroH - gridH - codeH;
  const showBars = !wide && data.monthly.length > 1 && free > 300 * u;
  const barsH = showBars ? Math.min(560 * u, free - 150 * u) : 0;
  const gap = (free - barsH) / (2 + (showBars ? 1 : 0) + (codeH ? 1 : 0));

  // Hero: net spend.
  y += gap;
  ctx.textAlign = 'left';
  ctx.fillStyle = look.muted;
  ctx.font = `500 ${34 * u}px ${FONT}`;
  ctx.fillText(t('stats.netSpend'), left, y + 34 * u);
  ctx.fillStyle = look.fg;
  const amount = formatCurrency(data.stats.netSpend);
  fit(ctx, amount, inner, 152 * u, 700);
  ctx.fillText(amount, left, y + 200 * u, inner);
  y += heroH;

  if (showBars) {
    y += gap;
    monthBars(ctx, data.monthly, left, y, inner, barsH, look.bars);
    ctx.fillStyle = look.rule;
    ctx.fillRect(left, y + barsH, inner, 3 * u);
    y += barsH;
  }

  // Up to four headline figures; an odd last one takes the whole row.
  y += gap;
  const cellW = (inner - (columns - 1) * cellGap) / columns;
  cells.forEach((figure, i) => {
    const w = i === cells.length - 1 && i % columns === 0 ? inner : cellW;
    cell(ctx, look, template, figure, left + (i % columns) * (cellW + cellGap), y + Math.floor(i / columns) * (cellH + cellGap), w, cellH, u);
  });
  y += gridH;

  if (codeH) barcode(ctx, data.stats.netSpend, left, y + gap, inner, codeH, look.bars);
}

/** Puts the PNG on the clipboard, ready to paste into a chat. Rejects where the browser refuses. */
export async function copyShareImage(data: ShareData, template: ShareTemplate, ratio: ShareRatio): Promise<void> {
  const canvas = document.createElement('canvas');
  drawShareImage(canvas, data, template, ratio);
  // The blob is handed over as a promise so the write still counts as part of the click.
  const png = new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/png'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

export function downloadShareImage(data: ShareData, template: ShareTemplate, ratio: ShareRatio): void {
  const canvas = document.createElement('canvas');
  drawShareImage(canvas, data, template, ratio);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = t('stats.share.file');
  a.click();
}
