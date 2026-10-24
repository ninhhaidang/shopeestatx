import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DARK_QUERY,
  applyTheme,
  readMode,
  resolveTheme,
  writeMode,
  type ColorMode,
  type ResolvedTheme,
} from './theme';

interface ThemeContextValue {
  mode: ColorMode;
  /** The theme actually shown (Auto already resolved). */
  theme: ResolvedTheme;
  setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initialMode }: { children: ReactNode; initialMode?: ColorMode }) {
  const [mode, setModeState] = useState<ColorMode>(() => initialMode ?? readMode());
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Auto: follow the system scheme live.
  useEffect(() => {
    if (mode !== 'auto') return;
    const query = window.matchMedia(DARK_QUERY);
    const sync = () => setTheme(resolveTheme('auto'));
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme,
      setMode: (next) => {
        writeMode(next);
        setModeState(next);
        setTheme(resolveTheme(next));
      },
    }),
    [mode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
