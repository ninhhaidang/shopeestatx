// Theme configuration - defines all available themes

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
  isDark: boolean;
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Sáng',
    nameEn: 'Light',
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
    isDark: false,
  },
  {
    id: 'dark-obsidian',
    name: 'Tối (Obsidian)',
    nameEn: 'Dark (Obsidian)',
    primaryColor: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    primaryGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    secondary: '#fbbf24',
    bgMain: '#0d0f14',
    bgCard: '#16181f',
    bgSidebar: '#16181f',
    textPrimary: '#f0f2f5',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    borderColor: '#2a2f3a',
    isDark: true,
  },
  {
    id: 'midnight-frost',
    name: 'Midnight Frost',
    nameEn: 'Midnight Frost',
    primaryColor: '#06b6d4',
    primaryLight: '#22d3ee',
    primaryDark: '#0891b2',
    primaryGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    secondary: '#22d3ee',
    bgMain: '#0a0f1a',
    bgCard: '#111827',
    bgSidebar: '#111827',
    textPrimary: '#e0f2fe',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    borderColor: '#1e293b',
    isDark: true,
  },
  {
    id: 'royal-purple',
    name: 'Tím Hoàng Gia',
    nameEn: 'Royal Purple',
    primaryColor: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
    primaryGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    secondary: '#a78bfa',
    bgMain: '#0f0f1a',
    bgCard: '#1a1625',
    bgSidebar: '#1a1625',
    textPrimary: '#f0f0ff',
    textSecondary: '#c4b5fd',
    textMuted: '#8b8ba3',
    borderColor: '#2d2640',
    isDark: true,
  },
  {
    id: 'slate',
    name: 'Xám Slate',
    nameEn: 'Slate',
    primaryColor: '#64748b',
    primaryLight: '#94a3b8',
    primaryDark: '#475569',
    primaryGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
    secondary: '#94a3b8',
    bgMain: '#0f172a',
    bgCard: '#1e293b',
    bgSidebar: '#1e293b',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    borderColor: '#334155',
    isDark: true,
  },
];

export function getTheme(id: string): Theme | undefined {
  return themes.find(t => t.id === id);
}

export function getDefaultTheme(): Theme {
  const stored = localStorage.getItem('shopeestatx-theme');
  if (stored && getTheme(stored)) {
    return getTheme(stored)!;
  }
  // System preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return getTheme('dark-obsidian')!;
  }
  return getTheme('light')!;
}
