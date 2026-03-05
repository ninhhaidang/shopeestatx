import { describe, it, expect } from 'vitest';

// Extract parseStatusLabel logic from content.js for testing
// NOTE: This mirrors the function in src/content/content.js — keep in sync!
// content.js is an IIFE (MAIN world) so we can't import from it directly.
function parseStatusLabel(statusLabel: string | null): { code: number; text: string } {
  const label = (statusLabel || '').toLowerCase();

  if (label.includes('completed')) return { code: 3, text: 'Hoàn thành' };
  if (label.includes('cancelled') || label.includes('cancel')) return { code: 4, text: 'Đã hủy' };
  if (label.includes('to_ship') || label.includes('preparing') || label.includes('process')) return { code: 7, text: 'Chờ vận chuyển' };
  if (label.includes('to_receive') || label.includes('shipping') || label.includes('transit') || label.includes('delivery')) return { code: 8, text: 'Đang giao' };
  if (label.includes('pay') || label.includes('unpaid')) return { code: 9, text: 'Chờ thanh toán' };
  if (label.includes('return') || label.includes('refund')) return { code: 12, text: 'Trả hàng' };

  return { code: 0, text: 'Không rõ' };
}

describe('parseStatusLabel', () => {
  it('parses completed status', () => {
    expect(parseStatusLabel('label_completed')).toEqual({ code: 3, text: 'Hoàn thành' });
  });

  it('parses cancelled status', () => {
    expect(parseStatusLabel('label_cancelled')).toEqual({ code: 4, text: 'Đã hủy' });
    expect(parseStatusLabel('cancel')).toEqual({ code: 4, text: 'Đã hủy' });
  });

  it('parses to_ship status', () => {
    expect(parseStatusLabel('label_to_ship')).toEqual({ code: 7, text: 'Chờ vận chuyển' });
    expect(parseStatusLabel('preparing')).toEqual({ code: 7, text: 'Chờ vận chuyển' });
  });

  it('parses to_receive status', () => {
    expect(parseStatusLabel('label_to_receive')).toEqual({ code: 8, text: 'Đang giao' });
    expect(parseStatusLabel('shipping')).toEqual({ code: 8, text: 'Đang giao' });
  });

  it('parses payment status', () => {
    expect(parseStatusLabel('unpaid')).toEqual({ code: 9, text: 'Chờ thanh toán' });
  });

  it('parses return/refund status', () => {
    expect(parseStatusLabel('label_return_refund_requested')).toEqual({ code: 12, text: 'Trả hàng' });
    expect(parseStatusLabel('refund')).toEqual({ code: 12, text: 'Trả hàng' });
  });

  it('returns unknown for unrecognized labels', () => {
    expect(parseStatusLabel('some_random_label')).toEqual({ code: 0, text: 'Không rõ' });
  });

  it('handles null input', () => {
    expect(parseStatusLabel(null)).toEqual({ code: 0, text: 'Không rõ' });
  });

  it('handles empty string', () => {
    expect(parseStatusLabel('')).toEqual({ code: 0, text: 'Không rõ' });
  });

  it('is case-insensitive', () => {
    expect(parseStatusLabel('LABEL_COMPLETED')).toEqual({ code: 3, text: 'Hoàn thành' });
    expect(parseStatusLabel('Label_Cancelled')).toEqual({ code: 4, text: 'Đã hủy' });
  });
});
