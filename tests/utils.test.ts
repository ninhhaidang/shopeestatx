import { describe, it, expect } from 'vitest';
import { formatVND, escapeHtml } from '../src/dashboard/utils';

describe('formatVND', () => {
  it('formats positive numbers in VND', () => {
    const result = formatVND(100000);
    // Intl.NumberFormat for vi-VN VND outputs something like "100.000 ₫"
    expect(result).toContain('100');
    expect(result).toContain('₫');
  });

  it('formats zero', () => {
    const result = formatVND(0);
    expect(result).toContain('0');
    expect(result).toContain('₫');
  });

  it('formats negative numbers', () => {
    const result = formatVND(-50000);
    expect(result).toContain('50');
  });

  it('short format for millions', () => {
    expect(formatVND(1500000, true)).toBe('1.5M');
    expect(formatVND(2000000, true)).toBe('2.0M');
  });

  it('short format below 1M returns full format', () => {
    const result = formatVND(500000, true);
    expect(result).toContain('500');
    expect(result).toContain('₫');
  });

  it('short format at exactly 1M', () => {
    expect(formatVND(1000000, true)).toBe('1.0M');
  });
});

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    );
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('preserves normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('preserves quotes (textContent/innerHTML does not escape them)', () => {
    const result = escapeHtml('"hello"');
    expect(result).toBe('"hello"');
  });
});
