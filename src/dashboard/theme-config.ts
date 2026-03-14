// Theme configuration - defines all available themes
import { STORAGE_KEYS } from '../config.js';

export interface Theme {
  id: string;
  name: string;
  nameEn: string;
  primaryColor: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string;
  secondary: string;
  bgMain: string;
  bgCard: string;
  bgSidebar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
}

export const themes: Theme[] = [
  {
    id: 'orange',
    name: 'Cam',
    nameEn: 'Orange',
    primaryColor: '#ff6b3d',
    primaryLight: '#ff8c5a',
    primaryDark: '#ee4d2d',
    primaryGradient: 'linear-gradient(135deg, #ff6b3d 0%, #ff8c5a 100%)',
    secondary: '#ff9671',
    bgMain: '#ffffff',
    bgCard: '#f8f9fa',
    bgSidebar: '#f1f3f5',
    textPrimary: '#1a1a2e',
    textSecondary: '#495057',
    textMuted: '#6c757d',
    borderColor: '#dee2e6',
  },
  {
    id: 'forest',
    name: 'Rừng',
    nameEn: 'Forest',
    primaryColor: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    primaryGradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    secondary: '#4ade80',
    bgMain: '#ffffff',
    bgCard: '#f0fdf4',
    bgSidebar: '#ecfdf5',
    textPrimary: '#14532d',
    textSecondary: '#166534',
    textMuted: '#15803d',
    borderColor: '#bbf7d0',
  },
  {
    id: 'rose',
    name: 'Hồng',
    nameEn: 'Rose',
    primaryColor: '#f43f5e',
    primaryLight: '#fb7185',
    primaryDark: '#e11d48',
    primaryGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    secondary: '#fb7185',
    bgMain: '#ffffff',
    bgCard: '#fff1f2',
    bgSidebar: '#ffe4e6',
    textPrimary: '#881337',
    textSecondary: '#9f1239',
    textMuted: '#be123c',
    borderColor: '#fecdd3',
  },
  {
    id: 'sky',
    name: 'Trời Xanh',
    nameEn: 'Sky',
    primaryColor: '#0ea5e9',
    primaryLight: '#38bdf8',
    primaryDark: '#0284c7',
    primaryGradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    secondary: '#38bdf8',
    bgMain: '#ffffff',
    bgCard: '#f0f9ff',
    bgSidebar: '#e0f2fe',
    textPrimary: '#0c4a6e',
    textSecondary: '#075985',
    textMuted: '#0369a1',
    borderColor: '#bae6fd',
  },
  {
    id: 'lavender',
    name: 'Oải Hương',
    nameEn: 'Lavender',
    primaryColor: '#a78bfa',
    primaryLight: '#c4b5fd',
    primaryDark: '#8b5cf6',
    primaryGradient: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)',
    secondary: '#c4b5fd',
    bgMain: '#ffffff',
    bgCard: '#f5f3ff',
    bgSidebar: '#ede9fe',
    textPrimary: '#4c1d95',
    textSecondary: '#5b21b6',
    textMuted: '#6d28d9',
    borderColor: '#ddd6fe',
  },
];

export function getTheme(id: string): Theme | undefined {
  return themes.find(t => t.id === id);
}

export function getDefaultTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored && getTheme(stored)) {
    return getTheme(stored)!;
  }
  // Default to orange theme
  return getTheme('orange')!;
}
