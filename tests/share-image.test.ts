import { describe, expect, it } from 'vitest';
import { drawShareImage } from '../src/dashboard/share-image';
import type { Stats } from '../src/dashboard/stats';

const stats: Stats = {
  netSpend: 12_345_000,
  refundTotal: 250_000,
  excludedCount: 3,
  estimatedSavings: 1_800_000,
  busiestWeekday: 6,
  busiestHour: 21,
  longestMonthStreak: 5,
  dailySpendRate: 40_000,
  topByQuantity: [{ name: 'Sản phẩm bí mật A', quantity: 9 }],
  priciest: [{ name: 'Sản phẩm bí mật B', unitPrice: 9_999_000 }],
};

/** Canvas stand-in that records every string drawn and every font/fill used. */
function drawOnFakeCanvas(s: Stats, financialAvailable = true) {
  const texts: string[] = [];
  const fills = new Set<string>();
  const ctx = {
    fillText: (text: string) => texts.push(text),
    fillRect() {},
    beginPath() {},
    roundRect() {},
    fill() {},
    stroke() {},
    measureText: () => ({ width: 100 }),
    set fillStyle(v: string) {
      fills.add(v);
    },
  } as unknown as CanvasRenderingContext2D;
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  drawShareImage(canvas, s, financialAvailable);
  return { canvas, texts, fills };
}

const normalize = (s: string) => s.replace(/[  ]/g, ' ');

describe('share image', () => {
  it('marks unavailable financial figures unknown without hiding known zero values', () => {
    const zeroStats = { ...stats, refundTotal: 0, estimatedSavings: 0 };
    const unknown = drawOnFakeCanvas(zeroStats, false).texts.map(normalize);
    expect(unknown.filter(text => text === '—')).toHaveLength(2);
    expect(unknown).not.toContain('0 ₫');
    const known = drawOnFakeCanvas(zeroStats).texts.map(normalize);
    expect(known.filter(text => text === '0 ₫')).toHaveLength(2);
  });

  it('draws the brand, the net spend hero and the four headline figures', () => {
    const { texts } = drawOnFakeCanvas(stats);
    const drawn = texts.map(normalize);

    expect(drawn).toContain('ShopeeStatX');
    expect(drawn).toContain('Chi tiêu Shopee của tôi');
    expect(drawn).toContain('Chi tiêu ròng');
    expect(drawn.some((t) => t.includes('12.345.000'))).toBe(true);
    expect(drawn).toContain('Tiết kiệm ước tính');
    expect(drawn.some((t) => t.includes('1.800.000'))).toBe(true);
    expect(drawn).toContain('Hoàn tiền');
    expect(drawn.some((t) => t.includes('250.000'))).toBe(true);
    expect(drawn).toContain('Ngày hay mua nhất');
    expect(drawn).toContain('Thứ 7');
    expect(drawn).toContain('Chuỗi tháng liên tục');
    expect(drawn).toContain('5 tháng');
  });

  it('shows a dash where there is no weekday or streak', () => {
    const { texts } = drawOnFakeCanvas({ ...stats, busiestWeekday: null, longestMonthStreak: 0 });
    expect(texts.filter((t) => t === '—')).toHaveLength(2);
  });

  it('exposes nothing beyond aggregate figures: no product names, prices or counts', () => {
    const { texts } = drawOnFakeCanvas(stats);
    const all = texts.join('|');

    expect(all).not.toContain('bí mật');
    expect(all).not.toContain('9.999.000');
    expect(all).not.toContain('40.000');
    expect(texts).toHaveLength(12);
  });

  it('keeps a fixed share-card size, independent of the viewer theme', () => {
    const { canvas } = drawOnFakeCanvas(stats);
    expect(canvas.width).toBe(720);
    expect(canvas.height).toBe(520);
  });
});
