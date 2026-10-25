import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { applyStyle, readStyle, writeStyle, type DisplayStyle } from './style';

interface StyleContextValue {
  style: DisplayStyle;
  setStyle: (style: DisplayStyle) => void;
}

const StyleContext = createContext<StyleContextValue | null>(null);

export function StyleProvider({ children, initialStyle }: { children: ReactNode; initialStyle?: DisplayStyle }) {
  const [style, setStyleState] = useState<DisplayStyle>(() => initialStyle ?? readStyle());

  useLayoutEffect(() => {
    applyStyle(style);
  }, [style]);

  const value = useMemo<StyleContextValue>(
    () => ({
      style,
      setStyle: (next) => {
        writeStyle(next);
        setStyleState(next);
      },
    }),
    [style],
  );

  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>;
}

export function useStyle(): StyleContextValue {
  const ctx = useContext(StyleContext);
  if (!ctx) throw new Error('useStyle must be used inside <StyleProvider>');
  return ctx;
}
