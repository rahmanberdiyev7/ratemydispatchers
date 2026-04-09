export type AppTheme = "dark" | "bright" | "futuristic";

export const THEME_STORAGE_KEY = "rmd_theme";

export const APP_THEMES: {
  value: AppTheme;
  label: string;
  description: string;
}[] = [
  {
    value: "dark",
    label: "Dark",
    description: "Current premium dark glass theme",
  },
  {
    value: "bright",
    label: "Bright",
    description: "Clean light business theme",
  },
  {
    value: "futuristic",
    label: "Futuristic",
    description: "Neon logistics / cyber theme",
  },
];

export function isValidTheme(value: unknown): value is AppTheme {
  return value === "dark" || value === "bright" || value === "futuristic";
}

export function getDefaultTheme(): AppTheme {
  return "dark";
}

export function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") return getDefaultTheme();

  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isValidTheme(raw) ? raw : getDefaultTheme();
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}