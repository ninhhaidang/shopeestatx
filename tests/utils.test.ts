import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatVND, escapeHtml, showToast } from '../src/dashboard/utils';

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

  it('short format below 1M returns K format', () => {
    const result = formatVND(500000, true);
    expect(result).toBe('500K');
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

describe('showToast', () => {
  beforeEach(() => {
    // Clear any existing toasts
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('creates toast element with message', () => {
    showToast('Test message');
    const toast = document.querySelector('.toast');
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toBe('Test message');
  });

  it('appends toast to body', () => {
    showToast('Test message');
    expect(document.body.contains(document.querySelector('.toast'))).toBe(true);
  });

  it('removes existing toast before creating new one', () => {
    showToast('First message');
    const firstToast = document.querySelector('.toast');

    showToast('Second message');
    const secondToast = document.querySelector('.toast');

    expect(firstToast).not.toBe(secondToast);
    expect(document.querySelectorAll('.toast').length).toBe(1);
    expect(document.querySelector('.toast')?.textContent).toBe('Second message');
  });

  it('auto-removes toast after default duration (3000ms)', async () => {
    vi.useFakeTimers();

    showToast('Test message', 3000);
    const toast = document.querySelector('.toast');
    expect(toast).toBeTruthy();

    // Advance to end of duration
    vi.advanceTimersByTime(3000);

    // Toast should have fade-out class added
    expect(document.querySelector('.toast')?.classList.contains('toast-fade-out')).toBe(true);

    // After animation ends, toast is removed (we simulate animationend)
    const toastEl = document.querySelector('.toast') as HTMLElement;
    if (toastEl) {
      const event = new Event('animationend');
      toastEl.dispatchEvent(event);
    }

    expect(document.querySelector('.toast')).toBeNull();

    vi.useRealTimers();
  });

  it('respects custom duration', () => {
    vi.useFakeTimers();

    showToast('Test message', 1000);
    const toast = document.querySelector('.toast');
    expect(toast).toBeTruthy();

    // Advance halfway through custom duration
    vi.advanceTimersByTime(500);
    expect(document.querySelector('.toast')).toBeTruthy();

    // Advance to end of custom duration
    vi.advanceTimersByTime(500);
    expect(document.querySelector('.toast')?.classList.contains('toast-fade-out')).toBe(true);

    vi.useRealTimers();
  });
});
