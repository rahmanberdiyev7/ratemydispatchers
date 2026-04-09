"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import type { AppTheme } from "@/lib/theme";

function themeChipTone(theme: AppTheme) {
  if (theme === "dark") return "";
  if (theme === "bright") return "good";
  return "warn";
}

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  const activeTheme = useMemo(() => {
    return themes.find((item) => item.value === theme) ?? themes[0];
  }, [theme, themes]);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="small" style={{ fontWeight: 800, marginBottom: 10 }}>
        Theme
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        {themes.map((item) => {
          const active = theme === item.value;

          return (
            <button
              key={item.value}
              type="button"
              className={active ? "btn" : "btn secondary"}
              onClick={() => setTheme(item.value)}
              title={item.description}
              aria-pressed={active}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10 }}>
        <span className={`chip ${themeChipTone(theme)}`}>
          Active: {activeTheme?.label ?? "Dark"}
        </span>
      </div>

      <div
        className="small"
        style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.4 }}
      >
        {activeTheme?.description ?? "Current premium dark glass theme"}
      </div>
    </div>
  );
}