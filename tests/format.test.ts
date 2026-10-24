import { describe, expect, it } from 'vitest';
import { formatCurrency } from '../src/i18n/format';

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
    expect(formatCurrency(1_500_000, true)).toBe('1.5M');
    expect(formatCurrency(1_000_000, true)).toBe('1.0M');
    expect(formatCurrency(500_000, true)).toBe('500K');
    expect(formatCurrency(999, true)).toBe('999');
  });
});
