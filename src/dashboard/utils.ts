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

/** Clean SVG avatar fallback placeholder (data URI) to prevent broken image glyphs */
export const DEFAULT_AVATAR_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none'><rect width='32' height='32' rx='16' fill='%23e2e8f0'/><circle cx='16' cy='11' r='5' fill='%2394a3b8'/><path d='M7 26c0-4.418 4.03-8 9-8s9 3.582 9 8' fill='%2394a3b8'/></svg>";

/**
 * Safely configures an image element with a fallback avatar.
 * Handles invalid, expired, demo, or blocked URLs gracefully while unhooking
 * the error handler to completely prevent infinite network retry loops.
 */
export function setupAvatarFallback(imgEl: HTMLImageElement, avatarUrl?: string | null): void {
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = DEFAULT_AVATAR_SVG;
  };

  const cleanUrl = avatarUrl?.trim();
  if (cleanUrl) {
    imgEl.src = cleanUrl;
  } else {
    imgEl.src = DEFAULT_AVATAR_SVG;
  }
}
