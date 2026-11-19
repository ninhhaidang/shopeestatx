import { describe, expect, it } from 'vitest';
import { drawShareImage, SHARE_RATIOS, SHARE_TEMPLATES, type ShareRatio, type ShareTemplate } from '../src/dashboard/share-image';
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
const monthly = [100_000, 0, 300_000];

/** Canvas stand-in that records every string drawn; every other drawing call is accepted and ignored. */
function draw(s: Stats, financialAvailable = true, template: ShareTemplate = 'label', ratio: ShareRatio = 'square', orders = 42) {
  const texts: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, key) => (key === 'fillText' ? (text: string) => texts.push(text) : key === 'measureText' ? () => ({ width: 100 }) : () => {}),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  drawShareImage(canvas, { stats: s, financialAvailable, monthly, orders }, template, ratio);
  return { canvas, texts };
}

const normalize = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');
const combos = SHARE_TEMPLATES.flatMap(template => (Object.keys(SHARE_RATIOS) as ShareRatio[]).map(ratio => [template, ratio] as const));

describe('share image', () => {
  it.each([
    ['zero', { ...stats, refundTotal: 0, estimatedSavings: 0 }, true],
    ['unknown', stats, false],
  ] as const)('leaves %s financial figures off the image and lets Số đơn take a place', (_, s, financialAvailable) => {
    const drawn = draw(s, financialAvailable).texts.map(normalize);
    expect(drawn).not.toContain('Tiết kiệm ước tính');
    expect(drawn).not.toContain('Hoàn tiền');
    expect(drawn).not.toContain('0 ₫');
    expect(drawn).not.toContain('—');
    expect(drawn).toEqual(expect.arrayContaining(['Ngày hay nhận hàng', 'Chuỗi tháng liên tục', 'Số đơn', '42 đơn']));
    // Brand, title, hero label and amount, then three figures of two strings.
    expect(drawn).toHaveLength(10);
  });

  it.each(combos)('%s / %s draws the brand, the net spend hero and the four headline figures, and nothing else', (template, ratio) => {
    const { texts, canvas } = draw(stats, true, template, ratio);
    const drawn = texts.map(normalize);

    expect(drawn).toContain('ShopeeStatX');
    expect(drawn).toContain('Chi tiêu Shopee của tôi');
    expect(drawn).toContain('Chi tiêu ròng');
    expect(drawn.some(text => text.includes('12.345.000'))).toBe(true);
    expect(drawn).toContain('Tiết kiệm ước tính');
    expect(drawn.some(text => text.includes('1.800.000'))).toBe(true);
    expect(drawn).toContain('Hoàn tiền');
    expect(drawn.some(text => text.includes('250.000'))).toBe(true);
    expect(drawn).toContain('Ngày hay nhận hàng');
    expect(drawn).toContain('Thứ 7');
    expect(drawn).toContain('Chuỗi tháng liên tục');
    expect(drawn).toContain('5 tháng');
    // No product names, prices, counts or month figures: only the twelve strings above.
    expect(texts).toHaveLength(12);
    expect(texts.join('|')).not.toMatch(/bí mật|9\.999\.000|40\.000|300\.000/);
    expect([canvas.width, canvas.height]).toEqual(SHARE_RATIOS[ratio]);
  });

  it('draws only the hero when no figure has anything to show', () => {
    const { texts } = draw({ ...stats, refundTotal: 0, estimatedSavings: 0, busiestWeekday: null, longestMonthStreak: 0 }, true, 'label', 'square', 0);
    expect(texts.map(normalize)).toEqual(['ShopeeStatX', 'Chi tiêu Shopee của tôi', 'Chi tiêu ròng', '12.345.000 ₫']);
  });

  it('sizes the artwork for social feeds, stories and link previews', () => {
    expect(SHARE_RATIOS).toEqual({ square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], wide: [1200, 630] });
  });
});
