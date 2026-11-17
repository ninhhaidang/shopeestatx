import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, readMode, writeMode, type ColorMode } from './theme';

interface ThemeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initialMode }: { children: ReactNode; initialMode?: ColorMode }) {
  const [mode, setModeState] = useState<ColorMode>(() => initialMode ?? readMode());

  useLayoutEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode: (next) => {
        writeMode(next);
        setModeState(next);
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
