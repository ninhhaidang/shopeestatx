// Builds a shareable PNG from aggregate stats (no shop names, order ids or product names), plus the Shopee account only when the user opts in.
// Several artworks (share-art.ts) in four sizes; each is a fixed design, not themed, so it looks the same wherever it is posted.
import type { Order } from '../types/index.js';
import { computeOverview } from './overview.js';
import { LOOKS, ORANGE, type Look, type ShareTemplate } from './share-art.js';
import type { Stats } from './stats.js';
import { STORE_QR } from './store-qr.js';
import type { Tier } from './tier.js';
import { formatCurrency } from '../i18n/format.js';
import { t } from '../i18n/index.js';

export { SHARE_TEMPLATES, type ShareTemplate } from './share-art.js';
export type ShareRatio = 'square' | 'portrait' | 'story' | 'wide';

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
  /** Set when the image sums up one calendar year: the header and hero say so. */
  year?: number;
  /** The Shopee membership tier the orders meet (estimated), printed as a badge; null below Bạc. */
  tier: Tier | null;
  /** The Shopee account, when the user chose to show it: drawn in place of the wordmark. */
  account?: ShareAccount | null;
}

export interface ShareAccount {
  name: string;
  /** Draw the avatar circle: the picture once loaded (from a CORS-enabled source, so the canvas stays exportable), else the name's initial. */
  avatar: boolean;
  image: CanvasImageSource | null;
}

const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Largest size (stepping down from `size`) at which `text` fits `maxWidth`; leaves ctx.font set. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number): number {
  let px = size;
  for (;;) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    if (px <= 18 || ctx.measureText(text).width <= maxWidth) return px;
    px -= 4;
  }
}

/** What the image shows for these orders; `year` when they are exactly that year's. The tier needs the whole history. */
export function shareDataOf(orders: Order[], financialAvailable: boolean, tier: Tier | null, year?: number): ShareData {
  const overview = computeOverview(orders);
  return { stats: overview.stats, financialAvailable, monthly: overview.monthly.map(m => m.total), orders: overview.orderCount, year, tier };
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

/** Each tier looks like its material: banded metal for Bạc and Vàng, an icy cut stone for Kim Cương. */
interface Material {
  /** Gradient stops: top to bottom for metal, corner to corner for the stone. */
  stops: string[];
  edge: string;
  fg: string;
  emblem: 'sparkle' | 'star' | 'gem';
}

const TIER_LOOK: Record<Tier, Material> = {
  silver: { stops: ['#fbfcfd', '#dde1e6', '#a9b1bb', '#e8ebef', '#c1c7ce'], edge: '#7f8994', fg: '#1d232b', emblem: 'sparkle' },
  gold: { stops: ['#fff4c7', '#f7cd4f', '#d39615', '#f9da74', '#c08710'], edge: '#946406', fg: '#3a2700', emblem: 'star' },
  diamond: { stops: ['#eefaff', '#9fdcff', '#dccfff', '#8edfff', '#e3f6ff'], edge: '#3b8ccc', fg: '#0b2b45', emblem: 'gem' },
};

/** The tier's small emblem, centred on (x, y) with size s: a four-point glint, a star, or a cut gem. */
function emblem(ctx: CanvasRenderingContext2D, kind: Material['emblem'], x: number, y: number, s: number, edge: string, u: number): void {
  const r = s / 2;
  ctx.beginPath();
  if (kind === 'sparkle') {
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
  } else if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const d = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + d * Math.cos(a), y + d * Math.sin(a));
    }
    ctx.closePath();
  } else {
    // Crown on top, pavilion to the point below.
    ctx.moveTo(x - r * 0.55, y - r * 0.6);
    ctx.lineTo(x + r * 0.55, y - r * 0.6);
    ctx.lineTo(x + r, y - r * 0.1);
    ctx.lineTo(x, y + r * 0.85);
    ctx.lineTo(x - r, y - r * 0.1);
    ctx.closePath();
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2 * u;
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (kind === 'gem') {
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.1);
    ctx.lineTo(x + r, y - r * 0.1);
    ctx.moveTo(x - r * 0.25, y - r * 0.6);
    ctx.lineTo(x - r * 0.4, y - r * 0.1);
    ctx.lineTo(x, y + r * 0.85);
    ctx.lineTo(x + r * 0.4, y - r * 0.1);
    ctx.lineTo(x + r * 0.25, y - r * 0.6);
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();
  }
}

/** The tier badge, right-aligned at (right, baseline): a material-coloured pill with a sheen, an emblem and the tier's name. */
function tierBadge(ctx: CanvasRenderingContext2D, tier: Tier, right: number, baseline: number, maxWidth: number, u: number): void {
  const m = TIER_LOOK[tier];
  const text = t('share.image.tier', { tier: t(`share.tier.${tier}`) });
  ctx.font = `700 ${28 * u}px ${FONT}`;
  const pad = 22 * u;
  const icon = 30 * u;
  const gap = 10 * u;
  const w = Math.min(maxWidth, ctx.measureText(text).width + 2 * pad + icon + gap);
  const h = 56 * u;
  const x = right - w;
  const y = baseline - 39 * u;
  const pill = (inset: number) => {
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, h / 2 - inset);
  };

  ctx.save();
  const fill = tier === 'diamond' ? ctx.createLinearGradient(x, y, x + w, y + h) : ctx.createLinearGradient(x, y, x, y + h);
  m.stops.forEach((color, i) => fill.addColorStop(i / (m.stops.length - 1), color));
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 12 * u;
  ctx.shadowOffsetY = 4 * u;
  pill(0);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  // Polish: light catching the upper half evenly, so it never cuts through the name; the stone also gets facets.
  const gloss = ctx.createLinearGradient(x, y, x, y + h * 0.55);
  gloss.addColorStop(0, 'rgba(255,255,255,0.7)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(x, y, w, h * 0.55);
  if (tier === 'diamond') {
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    for (const [a, b, c] of [[0.38, 0.55, 0.47], [0.62, 0.8, 0.7], [0.84, 1, 0.93]]) {
      ctx.beginPath();
      ctx.moveTo(x + w * a, y);
      ctx.lineTo(x + w * b, y);
      ctx.lineTo(x + w * c, y + h);
      ctx.fill();
    }
  }
  ctx.restore();

  pill(0);
  ctx.strokeStyle = m.edge;
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  pill(4 * u);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5 * u;
  ctx.stroke();

  emblem(ctx, m.emblem, x + pad + icon / 2, y + h / 2, icon, m.edge, u);

  // A light emboss under the letters.
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowOffsetY = 1.5 * u;
  ctx.fillStyle = m.fg;
  ctx.textAlign = 'left';
  ctx.font = `700 ${28 * u}px ${FONT}`;
  ctx.fillText(text, x + pad + icon + gap, baseline, w - 2 * pad - icon - gap);
  ctx.restore();
}

/** The account's avatar and username, left-aligned at (left, baseline) within maxWidth. */
function accountHeader(ctx: CanvasRenderingContext2D, look: Look, account: ShareAccount, left: number, baseline: number, maxWidth: number, u: number): void {
  let x = left;
  if (account.avatar) {
    const r = 32 * u;
    const cx = left + r;
    const cy = baseline - 15 * u;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    if (account.image) ctx.drawImage(account.image, cx - r, cy - r, 2 * r, 2 * r);
    else {
      ctx.fillStyle = ORANGE;
      ctx.textAlign = 'center';
      ctx.font = `700 ${34 * u}px ${FONT}`;
      ctx.fillText(account.name.charAt(0).toUpperCase(), cx, cy + 12 * u);
    }
    ctx.restore();
    // A ring in the artwork's brand colour keeps a white or matching circle visible on any background.
    ctx.strokeStyle = look.brand;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    x += 2 * r + 18 * u;
  }
  const width = maxWidth - (x - left);
  ctx.textAlign = 'left';
  ctx.fillStyle = look.brand;
  fit(ctx, account.name, width, 40 * u, 700);
  ctx.fillText(account.name, x, baseline, width);
}

/** The store's QR code on a white tile (scanners need light around it), with an invitation beside it; `reserve` is kept free at the right. */
function storeFooter(ctx: CanvasRenderingContext2D, look: Look, x: number, y: number, w: number, size: number, u: number, reserve: number): void {
  const quiet = 2;
  const count = STORE_QR.length + 2 * quiet;
  // The white reaches a little past the code, so dark artworks keep a clear quiet zone round it.
  const pad = 6 * u;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, size + 2 * pad, size + 2 * pad, 12 * u);
  ctx.fill();
  ctx.fillStyle = '#14171c';
  // Whole-pixel edges, so neighbouring modules never leave hairline seams.
  const at = (i: number) => Math.round((i * size) / count);
  STORE_QR.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') ctx.fillRect(x + at(c + quiet), y + at(r + quiet), at(c + quiet + 1) - at(c + quiet), at(r + quiet + 1) - at(r + quiet));
    }
  });
  const textX = x + size + 28 * u;
  const textW = w - size - 28 * u - reserve;
  ctx.textAlign = 'left';
  ctx.fillStyle = look.fg;
  ctx.font = `700 ${32 * u}px ${FONT}`;
  ctx.fillText(t('share.image.cta'), textX, y + size / 2 - 6 * u, textW);
  ctx.fillStyle = look.muted;
  ctx.font = `500 ${24 * u}px ${FONT}`;
  ctx.fillText(t('share.image.store'), textX, y + size / 2 + 32 * u, textW);
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

function cell(ctx: CanvasRenderingContext2D, look: Look, [label, value]: [string, string], x: number, y: number, w: number, h: number, u: number): void {
  const ruled = look.cell === 'rule' || look.cell === 'dashed';
  const inset = ruled ? 0 : 26 * u;
  if (look.cell === 'box') {
    ctx.strokeStyle = look.rule;
    ctx.lineWidth = 3 * u;
    ctx.strokeRect(x, y, w, h);
  } else if (look.cell === 'rule') {
    // A rule above each figure, no box.
    ctx.fillStyle = look.rule;
    ctx.fillRect(x, y, w, 2 * u);
  } else if (look.cell === 'dashed') {
    ctx.strokeStyle = look.rule;
    ctx.lineWidth = 2 * u;
    ctx.setLineDash([10 * u, 8 * u]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const { fill, radius, border, notch } = look.cell;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius * u);
    ctx.fill();
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 3 * u;
      ctx.setLineDash([12 * u, 8 * u]);
      ctx.beginPath();
      ctx.roundRect(x + 8 * u, y + 8 * u, w - 16 * u, h - 16 * u, Math.max(0, radius - 8) * u);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (notch) {
      ctx.fillStyle = notch;
      for (const nx of [x, x + w]) {
        ctx.beginPath();
        ctx.arc(nx, y + h / 2, 16 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = look.muted;
  ctx.font = `500 ${26 * u}px ${FONT}`;
  ctx.fillText(label, x + inset, y + h * 0.38, w - 2 * inset);
  ctx.fillStyle = look.fg;
  fit(ctx, value, w - 2 * inset, 46 * u, 700);
  ctx.fillText(value, x + inset, y + h * 0.78, w - 2 * inset);
}

/** Draws the artwork; `scale` below 1 makes a smaller copy (a picker thumbnail) of the same design. */
export function drawShareImage(canvas: HTMLCanvasElement, data: ShareData, template: ShareTemplate = 'label', ratio: ShareRatio = 'square', scale = 1): void {
  const [W, H] = SHARE_RATIOS[ratio];
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  // jsdom has no canvas; there is nothing to draw on.
  if (!ctx) return;
  ctx.scale(scale, scale);
  const look = LOOKS[template];
  const wide = ratio === 'wide';
  // One unit is a pixel of the 1080-wide artwork; the link preview is drawn smaller.
  const u = wide ? 0.62 : 1;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, W, H);
  look.backdrop?.(ctx, W, H, u);

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

  // Header: wordmark (or the account, when shown; the footer still names ShopeeStatX) and what this is.
  let y = padTop;
  const headY = y + (template === 'label' ? 16 : 44) * u;
  if (data.account) accountHeader(ctx, look, data.account, left, headY, inner * 0.42, u);
  else {
    ctx.textAlign = 'left';
    ctx.fillStyle = look.brand;
    ctx.font = `700 ${44 * u}px ${FONT}`;
    ctx.fillText('ShopeeStatX', left, headY);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = template === 'label' ? '#ffffff' : look.muted;
  ctx.font = `500 ${28 * u}px ${FONT}`;
  // The tier badge, when there is one, says more than the title; the hero label still names the year.
  if (data.tier) tierBadge(ctx, data.tier, right, headY - 2 * u, inner * 0.55, u);
  else ctx.fillText(data.year ? t('share.image.year', { year: data.year }) : t('stats.share.title'), right, headY - 2 * u, inner * 0.55);
  y += headerH + (template === 'label' ? 44 * u : 0);

  // What is left is shared out between the hero, the figures and (on tall sizes) the month strip.
  const cells = figures(data);
  const columns = wide ? Math.max(1, cells.length) : 2;
  const rows = Math.ceil(cells.length / columns);
  const cellGap = 20 * u;
  // The square is the tightest fit, so its hero and figures are a little shorter.
  const square = ratio === 'square';
  const cellH = (wide || square ? 150 : 172) * u;
  const gridH = rows ? rows * cellH + (rows - 1) * cellGap : 0;
  const heroH = (square ? 210 : 236) * u;
  // The link preview is small, so its code gets a bigger share of it to stay scannable.
  const footerH = (wide ? 170 : 140) * u;
  const free = H - padBottom - y - heroH - gridH - footerH;
  const showBars = !wide && data.monthly.length > 1 && free > 300 * u;
  const barsH = showBars ? Math.min(560 * u, free - 150 * u) : 0;
  const gap = (free - barsH) / (3 + (showBars ? 1 : 0));

  // Hero: net spend.
  y += gap;
  ctx.textAlign = 'left';
  ctx.fillStyle = look.muted;
  ctx.font = `500 ${34 * u}px ${FONT}`;
  ctx.fillText(data.year ? t('share.image.netSpendYear', { year: data.year }) : t('stats.netSpend'), left, y + 34 * u, inner);
  ctx.fillStyle = look.fg;
  const amount = formatCurrency(data.stats.netSpend);
  fit(ctx, amount, inner, 152 * u, 700);
  if (look.glow) {
    ctx.shadowColor = look.glow;
    ctx.shadowBlur = 40 * u;
  }
  ctx.fillText(amount, left, y + heroH - 36 * u, inner);
  ctx.shadowBlur = 0;
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
    cell(ctx, look, figure, left + (i % columns) * (cellW + cellGap), y + Math.floor(i / columns) * (cellH + cellGap), w, cellH, u);
  });
  y += gridH;

  const mascot = look.mascot;
  storeFooter(ctx, look, left, y + gap, inner, footerH, u, mascot ? footerH + 16 * u : 0);
  mascot?.(ctx, right - footerH, y + gap, footerH);
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
