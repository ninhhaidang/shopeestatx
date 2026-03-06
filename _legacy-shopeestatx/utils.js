// ShopeeStatX/utils.js
// Pure utility functions — no dependencies, no side effects

export function formatVND(number, short = false) {
  if (short && number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
