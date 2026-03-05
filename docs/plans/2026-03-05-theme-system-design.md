# Theme System Design

**Date:** 2026-03-05
**Status:** Approved

## Overview

Expand the theme system from 2 dark-only themes to 7 themes (5 dark + 2 light) across the Catppuccin and Tokyo Night families. Add separate light/dark theme selection, a theme mode control (System / Light / Dark), and system preference detection via `COLORFGBG`.

## Decisions

| Question | Decision |
|---|---|
| Theme variants | All 7: Catppuccin Latte/Frappé/Macchiato/Mocha + Tokyo Night Night/Storm/Day |
| System detection | Check `COLORFGBG` env var at startup; fall back to dark |
| Theme picker UI | Three tabs: `[Mode] [Light] [Dark]` |
| Settings migration | Reset to defaults — no migration of old `theme` field |
| State management | Three separate `createSignal`s + `createMemo` for active theme |

## File Structure

```
src/lib/themes/
  catppuccin-mocha.ts  →  deleted
  catppuccin.ts        →  new (all 4 Catppuccin variants)
  tokyo-night.ts       →  updated (add Storm + Day variants)
  types.ts             →  add mode: "light" | "dark" to Theme interface
  index.ts             →  updated imports, export THEME_META, DARK_THEMES, LIGHT_THEMES
```

### Theme Catalogue

| ThemeName | File | Mode |
|---|---|---|
| `tokyonight-night` | tokyo-night.ts | dark |
| `tokyonight-storm` | tokyo-night.ts | dark |
| `tokyonight-day` | tokyo-night.ts | light |
| `catppuccin-latte` | catppuccin.ts | light |
| `catppuccin-frappe` | catppuccin.ts | dark |
| `catppuccin-macchiato` | catppuccin.ts | dark |
| `catppuccin-mocha` | catppuccin.ts | dark |

## Types & Settings Schema

```ts
// src/lib/types.ts

export type ThemeName =
  | "tokyonight-night"
  | "tokyonight-storm"
  | "tokyonight-day"
  | "catppuccin-latte"
  | "catppuccin-frappe"
  | "catppuccin-macchiato"
  | "catppuccin-mocha";

export type ThemeMode = "system" | "light" | "dark";

export interface AppSettings {
  lightTheme: ThemeName;
  darkTheme: ThemeName;
  themeMode: ThemeMode;
}
```

**`config.ts` default settings:**
```ts
const DEFAULT_SETTINGS: AppSettings = {
  lightTheme: "catppuccin-latte",
  darkTheme: "tokyonight-night",
  themeMode: "system",
};
```

## Theme Context

**`src/lib/theme-context.tsx`** — `Props` changes `initialTheme: ThemeName` → `initialSettings: AppSettings`.

Three signals + two memos:

```ts
const [lightThemeName, setLightThemeName] = createSignal(props.initialSettings.lightTheme)
const [darkThemeName, setDarkThemeName]   = createSignal(props.initialSettings.darkTheme)
const [themeMode, setThemeMode]           = createSignal(props.initialSettings.themeMode)

const resolvedMode = createMemo<"light" | "dark">(() => {
  const mode = themeMode()
  if (mode !== "system") return mode
  return detectSystemPreference() // module-level, reads COLORFGBG once
})

const theme = createMemo(() =>
  resolvedMode() === "light" ? THEMES[lightThemeName()] : THEMES[darkThemeName()]
)
```

**System preference detection:**
```ts
function detectSystemPreference(): "light" | "dark" {
  const colorfgbg = process.env.COLORFGBG
  if (colorfgbg) {
    const parts = colorfgbg.split(";")
    const bg = parseInt(parts[parts.length - 1] ?? "0", 10)
    return bg >= 8 ? "light" : "dark"
  }
  return "dark"
}
```

**Context interface:**
```ts
interface ThemeContextValue {
  theme: Accessor<Theme>
  themeMode: Accessor<ThemeMode>
  lightThemeName: Accessor<ThemeName>
  darkThemeName: Accessor<ThemeName>
  setLightTheme: (name: ThemeName) => void
  setDarkTheme: (name: ThemeName) => void
  setThemeMode: (mode: ThemeMode) => void
}
```

Each setter saves the full updated `AppSettings` to disk.

## Theme Modal UI

**`src/components/modals/theme-modal.tsx`** — three-tab layout.

```
┌──────────────────────────────────┐
│ Theme                            │
│  [Mode]  [Light]  [Dark]         │  ← tab cycles tabs
│                                  │
│  > System                     ● │
│    Light                         │
│    Dark                          │
│                                  │
│  tab:switch  j/k:nav  spc:select │
│  esc:close                       │
└──────────────────────────────────┘
```

**Tab content:**
- **Mode tab:** `["system", "light", "dark"]` — selecting sets `themeMode`
- **Light tab:** `LIGHT_THEMES` — selecting sets `lightThemeName`
- **Dark tab:** `DARK_THEMES` — selecting sets `darkThemeName`

Active item in each tab is marked with `●`.

**Local modal state:**
```ts
const [activeTab, setActiveTab] = createSignal<"mode" | "light" | "dark">("mode")
const [cursor, setCursor] = createSignal(0) // resets to 0 on tab change
```

**Key bindings:**

| Key | Action |
|---|---|
| `tab` | Cycle tabs: mode → light → dark → mode |
| `j` / `↓` | Move cursor down |
| `k` / `↑` | Move cursor up |
| `space` / `return` | Select item |
| `esc` | Close modal |

## Call Sites

- `src/app.tsx` or `src/index.tsx` — wherever `ThemeProvider` is initialized: pass `initialSettings` (full `AppSettings`) instead of `initialTheme`.
