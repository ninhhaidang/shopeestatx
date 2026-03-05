// Pure utility functions — no dependencies, no side effects

export function formatVND(number: number, short = false): string {
  if (short && number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
