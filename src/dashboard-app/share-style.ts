// The artwork and size picked last, so the next image (and the Tổng quan card) starts there.
// A per-browser convenience in localStorage: anything missing, invalid or blocked falls back to the default.
import { getStorageKey } from '../config.js';
import { SHARE_RATIOS, SHARE_TEMPLATES, type ShareRatio, type ShareTemplate } from '../dashboard/share-image.js';

export interface ShareStyle {
  template: ShareTemplate;
  ratio: ShareRatio;
}

const KEY = getStorageKey('share-style');
const DEFAULT: ShareStyle = { template: 'sale', ratio: 'square' };

export function loadShareStyle(): ShareStyle {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ShareStyle> | null;
    const template = SHARE_TEMPLATES.find(option => option === saved?.template);
    const ratio = typeof saved?.ratio === 'string' && Object.hasOwn(SHARE_RATIOS, saved.ratio) ? saved.ratio : undefined;
    return { template: template ?? DEFAULT.template, ratio: ratio ?? DEFAULT.ratio };
  } catch {
    return DEFAULT;
  }
}

export function saveShareStyle(style: ShareStyle): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
  } catch {
    // Storage blocked: the choice simply is not remembered.
  }
}
