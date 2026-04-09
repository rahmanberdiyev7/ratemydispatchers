"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  APP_THEMES,
  applyTheme,
  getDefaultTheme,
  persistTheme,
  readStoredTheme,
  type AppTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themes: typeof APP_THEMES;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getDefaultTheme());

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    persistTheme(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      themes: APP_THEMES,
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}