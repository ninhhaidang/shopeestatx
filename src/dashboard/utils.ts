// Pure utility functions — no dependencies, no side effects
import { formatCurrency } from '../i18n/format.js';

/** @deprecated Use formatCurrency from i18n/format.ts instead */
export function formatVND(number: number, short = false): string {
  return formatCurrency(number, short);
}

export { formatCurrency };

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Show a non-intrusive toast notification that auto-dismisses after 3s */
export function showToast(message: string, durationMs = 3000): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, durationMs);
}
