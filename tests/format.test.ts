import { describe, expect, it } from 'vitest';
import { formatCurrency } from '../src/i18n/format';
import { t } from '../src/i18n/index';

describe('t', () => {
  it('keeps replacement patterns in a parameter literal', () => {
    expect(t('dash.refreshError', { message: 'cost $& here' })).toBe('Lỗi cập nhật: cost $& here');
  });
});

describe('formatCurrency', () => {
  it('formats a full amount in đồng with dot separators', () => {
    const text = formatCurrency(100000);
    expect(text).toContain('100.000');
    expect(text).toContain('₫');
    expect(formatCurrency(0)).toContain('0');
  });

  it('keeps the sign of a negative amount', () => {
    expect(formatCurrency(-50000)).toContain('-');
  });

  it('shortens to K and M', () => {
    expect(formatCurrency(1_500_000, true)).toBe('1,5 tr');
    expect(formatCurrency(1_000_000, true)).toBe('1 tr');
    expect(formatCurrency(500_000, true)).toBe('500k');
    // Rounding never produces "1000k" or "1000 tr".
    expect(formatCurrency(999_600, true)).toBe('1 tr');
    expect(formatCurrency(2_340_000_000, true)).toBe('2,3 tỷ');
    expect(formatCurrency(999, true)).toBe('999');
  });
});
