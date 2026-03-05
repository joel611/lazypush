# Theme System — Light/Dark Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the theme system from 2 dark themes to 7 themes (5 dark + 2 light), with separate light/dark selection, a three-tab theme picker (Mode / Light / Dark), and system preference detection via `COLORFGBG`.

**Architecture:** Three signals in `ThemeProvider` (`lightThemeName`, `darkThemeName`, `themeMode`) derive the active theme via `createMemo`. The theme modal uses a three-tab UI where each tab independently sets its value. System preference reads `COLORFGBG` once at context creation.

**Tech Stack:** Bun, SolidJS (`@opentui/solid`), TypeScript, Ultracite (Biome linter)

---

## Task 1: Update types.ts — ThemeName, ThemeMode, AppSettings

**Files:**
- Modify: `src/lib/types.ts:88-92`

**Step 1: Replace the ThemeName / AppSettings block**

```ts
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

Replace lines 88–92 (the old `ThemeName` type and `AppSettings` interface).

**Step 2: Verify TypeScript compiles**

Run: `bun x tsc --noEmit`
Expected: Errors on files that still reference the old `theme` field — that's correct, we'll fix those next.

---

## Task 2: Update config.ts — DEFAULT_SETTINGS

**Files:**
- Modify: `src/lib/config.ts:31`

**Step 1: Replace DEFAULT_SETTINGS**

Old:
```ts
const DEFAULT_SETTINGS: AppSettings = { theme: "tokyonight-night" };
```

New:
```ts
const DEFAULT_SETTINGS: AppSettings = {
  lightTheme: "catppuccin-latte",
  darkTheme: "tokyonight-night",
  themeMode: "system",
};
```

**Step 2: Run tests to verify no breakage**

Run: `bun test`
Expected: 28 pass (config tests don't cover settings, so no failures expected)

**Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/config.ts
git commit -m "feat: expand ThemeName union, add ThemeMode, update AppSettings schema"
```

---

## Task 3: Update themes/types.ts — add mode field

**Files:**
- Modify: `src/lib/themes/types.ts`

**Step 1: Add `mode` field to Theme interface**

Add after `name: ThemeName;`:
```ts
mode: "light" | "dark";
```

The full interface becomes:
```ts
import type { ThemeName } from "../types";

export interface Theme {
  // Accents
  accent: string;
  accentDanger: string;
  accentSuccess: string;
  accentTemplate: string;
  // Cursor / selection
  cursorBg: string;
  cursorBgActive: string;
  // Lists
  deviceText: string;
  // Fields
  fieldBorder: string;
  fieldBorderActive: string;
  // Modals
  modalBg: string;
  modalBorder: string;
  mode: "light" | "dark";
  name: ThemeName;
  paneLabel: string;
  // Panels
  panelBg: string;
  panelBorder: string;
  panelBorderActive: string;
  selectOptionBg: string;
  // Chrome
  statusBarBg: string;
  // Text
  text: string;
  textDim: string;
  textInverted: string;
  textMuted: string;
}
```

**Step 2: Verify — TypeScript will now complain about existing theme objects missing `mode`**

Run: `bun x tsc --noEmit`
Expected: Errors about missing `mode` on `catppuccinMocha` and `tokyoNight` — correct, fixed in next tasks.

---

## Task 4: Create catppuccin.ts — all 4 Catppuccin variants

**Files:**
- Create: `src/lib/themes/catppuccin.ts`
- Delete: `src/lib/themes/catppuccin-mocha.ts` (after this task)

**Step 1: Create the file**

```ts
import type { Theme } from "./types";

export const catppuccinLatte: Theme = {
  name: "catppuccin-latte",
  mode: "light",
  panelBg: "transparent",
  panelBorder: "#bcc0cc",
  panelBorderActive: "#1e66f5",
  modalBg: "#eff1f5",
  modalBorder: "#1e66f5",
  statusBarBg: "#eff1f5",
  text: "#4c4f69",
  textMuted: "#6c6f85",
  textDim: "#9ca0b0",
  textInverted: "#eff1f5",
  accent: "#04a5e5",
  accentTemplate: "#fe640b",
  accentSuccess: "#40a02b",
  accentDanger: "#d20f39",
  cursorBg: "#ccd0da",
  cursorBgActive: "#1e66f5",
  paneLabel: "#df8e1d",
  fieldBorder: "#ccd0da",
  fieldBorderActive: "#1e66f5",
  deviceText: "#5c5f77",
  selectOptionBg: "#c5d3f5",
};

export const catppuccinFrappe: Theme = {
  name: "catppuccin-frappe",
  mode: "dark",
  panelBg: "transparent",
  panelBorder: "#51576d",
  panelBorderActive: "#8caaee",
  modalBg: "#303446",
  modalBorder: "#8caaee",
  statusBarBg: "#303446",
  text: "#c6d0f5",
  textMuted: "#737994",
  textDim: "#626880",
  textInverted: "#303446",
  accent: "#99d1db",
  accentTemplate: "#ef9f76",
  accentSuccess: "#a6d189",
  accentDanger: "#e78284",
  cursorBg: "#414559",
  cursorBgActive: "#8caaee",
  paneLabel: "#e5c890",
  fieldBorder: "#51576d",
  fieldBorderActive: "#8caaee",
  deviceText: "#a5adce",
  selectOptionBg: "#1e2c4a",
};

export const catppuccinMacchiato: Theme = {
  name: "catppuccin-macchiato",
  mode: "dark",
  panelBg: "transparent",
  panelBorder: "#494d64",
  panelBorderActive: "#8aadf4",
  modalBg: "#24273a",
  modalBorder: "#8aadf4",
  statusBarBg: "#24273a",
  text: "#cad3f5",
  textMuted: "#6e738d",
  textDim: "#5b6078",
  textInverted: "#24273a",
  accent: "#91d7e3",
  accentTemplate: "#f5a97f",
  accentSuccess: "#a6da95",
  accentDanger: "#ed8796",
  cursorBg: "#363a4f",
  cursorBgActive: "#8aadf4",
  paneLabel: "#eed49f",
  fieldBorder: "#494d64",
  fieldBorderActive: "#8aadf4",
  deviceText: "#a5adcb",
  selectOptionBg: "#1a2040",
};

export const catppuccinMocha: Theme = {
  name: "catppuccin-mocha",
  mode: "dark",
  panelBg: "transparent",
  panelBorder: "#414254",
  panelBorderActive: "#89b4fa",
  modalBg: "#181825",
  modalBorder: "#89b4fa",
  statusBarBg: "#181825",
  text: "#cdd6f4",
  textMuted: "#6c7086",
  textDim: "#585b70",
  textInverted: "#1e1e2e",
  accent: "#89dceb",
  accentTemplate: "#fab387",
  accentSuccess: "#a6e3a1",
  accentDanger: "#f38ba8",
  cursorBg: "#313244",
  cursorBgActive: "#89b4fa",
  paneLabel: "#f9e2af",
  fieldBorder: "#45475a",
  fieldBorderActive: "#89b4fa",
  deviceText: "#bac2de",
  selectOptionBg: "#1e3a5f",
};
```

**Step 2: Delete the old file**

```bash
rm src/lib/themes/catppuccin-mocha.ts
```

**Step 3: Verify compile**

Run: `bun x tsc --noEmit`
Expected: Errors about `catppuccin-mocha` import in `themes/index.ts` — correct, fixed in Task 6.

---

## Task 5: Update tokyo-night.ts — add Storm and Day variants

**Files:**
- Modify: `src/lib/themes/tokyo-night.ts`

**Step 1: Add `mode` to the existing `tokyoNight` export and add two new exports**

Replace the entire file:

```ts
import type { Theme } from "./types";

export const tokyoNight: Theme = {
  name: "tokyonight-night",
  mode: "dark",
  panelBg: "transparent",
  panelBorder: "#292e42",
  panelBorderActive: "#7aa2f7",
  modalBg: "#16161e",
  modalBorder: "#7aa2f7",
  statusBarBg: "#16161e",
  text: "#c0caf5",
  textMuted: "#565f89",
  textDim: "#414868",
  textInverted: "#1a1b26",
  accent: "#7dcfff",
  accentTemplate: "#e0af68",
  accentSuccess: "#9ece6a",
  accentDanger: "#f7768e",
  cursorBg: "#292e42",
  cursorBgActive: "#7aa2f7",
  paneLabel: "#e0af68",
  fieldBorder: "#292e42",
  fieldBorderActive: "#7aa2f7",
  deviceText: "#9aa5ce",
  selectOptionBg: "#1a2b47",
};

export const tokyoNightStorm: Theme = {
  name: "tokyonight-storm",
  mode: "dark",
  panelBg: "transparent",
  panelBorder: "#3d59a1",
  panelBorderActive: "#7aa2f7",
  modalBg: "#1f2335",
  modalBorder: "#7aa2f7",
  statusBarBg: "#1f2335",
  text: "#c0caf5",
  textMuted: "#565f89",
  textDim: "#414868",
  textInverted: "#24283b",
  accent: "#7dcfff",
  accentTemplate: "#e0af68",
  accentSuccess: "#9ece6a",
  accentDanger: "#f7768e",
  cursorBg: "#3d59a1",
  cursorBgActive: "#7aa2f7",
  paneLabel: "#e0af68",
  fieldBorder: "#3d59a1",
  fieldBorderActive: "#7aa2f7",
  deviceText: "#9aa5ce",
  selectOptionBg: "#1c2a47",
};

export const tokyoNightDay: Theme = {
  name: "tokyonight-day",
  mode: "light",
  panelBg: "transparent",
  panelBorder: "#d5d6db",
  panelBorderActive: "#2e7de9",
  modalBg: "#e1e2e7",
  modalBorder: "#2e7de9",
  statusBarBg: "#e1e2e7",
  text: "#3760bf",
  textMuted: "#848cb5",
  textDim: "#9699a3",
  textInverted: "#e1e2e7",
  accent: "#007197",
  accentTemplate: "#b15c00",
  accentSuccess: "#587539",
  accentDanger: "#f52a65",
  cursorBg: "#d5d6db",
  cursorBgActive: "#2e7de9",
  paneLabel: "#8c6c3e",
  fieldBorder: "#c4c8da",
  fieldBorderActive: "#2e7de9",
  deviceText: "#526cad",
  selectOptionBg: "#b7c7e8",
};
```

**Step 2: Verify compile**

Run: `bun x tsc --noEmit`
Expected: Still errors from `themes/index.ts` — fixed next.

---

## Task 6: Update themes/index.ts — wire up all themes, add THEME_META

**Files:**
- Modify: `src/lib/themes/index.ts`

**Step 1: Replace the entire file**

```ts
import type { ThemeName } from "../types";
import {
  catppuccinFrappe,
  catppuccinLatte,
  catppuccinMacchiato,
  catppuccinMocha,
} from "./catppuccin";
import { tokyoNight, tokyoNightDay, tokyoNightStorm } from "./tokyo-night";
import type { Theme } from "./types";

export type { Theme } from "./types";

export const THEMES: Record<ThemeName, Theme> = {
  "tokyonight-night": tokyoNight,
  "tokyonight-storm": tokyoNightStorm,
  "tokyonight-day": tokyoNightDay,
  "catppuccin-latte": catppuccinLatte,
  "catppuccin-frappe": catppuccinFrappe,
  "catppuccin-macchiato": catppuccinMacchiato,
  "catppuccin-mocha": catppuccinMocha,
};

export const THEME_META: Record<
  ThemeName,
  { label: string; mode: "light" | "dark" }
> = {
  "tokyonight-night": { label: "Tokyo Night", mode: "dark" },
  "tokyonight-storm": { label: "Tokyo Night Storm", mode: "dark" },
  "tokyonight-day": { label: "Tokyo Night Day", mode: "light" },
  "catppuccin-latte": { label: "Catppuccin Latte", mode: "light" },
  "catppuccin-frappe": { label: "Catppuccin Frappé", mode: "dark" },
  "catppuccin-macchiato": { label: "Catppuccin Macchiato", mode: "dark" },
  "catppuccin-mocha": { label: "Catppuccin Mocha", mode: "dark" },
};

export const DARK_THEMES = (Object.keys(THEMES) as ThemeName[]).filter(
  (n) => THEME_META[n].mode === "dark"
);

export const LIGHT_THEMES = (Object.keys(THEMES) as ThemeName[]).filter(
  (n) => THEME_META[n].mode === "light"
);

export const DEFAULT_LIGHT_THEME: ThemeName = "catppuccin-latte";
export const DEFAULT_DARK_THEME: ThemeName = "tokyonight-night";
```

**Step 2: Verify compile — should be clean now except theme-context.tsx and app.tsx**

Run: `bun x tsc --noEmit`
Expected: Errors only in `theme-context.tsx` and `app.tsx` about old interface.

**Step 3: Commit**

```bash
git add src/lib/themes/ src/lib/types.ts src/lib/config.ts
git commit -m "feat: add 5 new themes across Catppuccin and Tokyo Night families"
```

---

## Task 7: Update theme-context.tsx — three signals, two memos, new interface

**Files:**
- Modify: `src/lib/theme-context.tsx`

**Step 1: Replace the entire file**

```ts
// src/lib/theme-context.tsx

import type { Accessor, JSX } from "solid-js";
import { createContext, createMemo, createSignal, useContext } from "solid-js";
import { useServices } from "./services-context";
import type { Theme } from "./themes";
import { THEMES } from "./themes";
import type { AppSettings, ThemeMode, ThemeName } from "./types";

interface ThemeContextValue {
  darkThemeName: Accessor<ThemeName>;
  lightThemeName: Accessor<ThemeName>;
  setDarkTheme: (name: ThemeName) => void;
  setLightTheme: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  theme: Accessor<Theme>;
  themeMode: Accessor<ThemeMode>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface Props {
  children: JSX.Element;
  initialSettings: AppSettings;
}

function detectSystemPreference(): "light" | "dark" {
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(";");
    const bg = parseInt(parts[parts.length - 1] ?? "0", 10);
    return bg >= 8 ? "light" : "dark";
  }
  return "dark";
}

export function ThemeProvider(props: Props) {
  const { config } = useServices();

  const [lightThemeName, setLightThemeName] = createSignal<ThemeName>(
    props.initialSettings.lightTheme
  );
  const [darkThemeName, setDarkThemeName] = createSignal<ThemeName>(
    props.initialSettings.darkTheme
  );
  const [themeMode, setThemeMode] = createSignal<ThemeMode>(
    props.initialSettings.themeMode
  );

  const resolvedMode = createMemo<"light" | "dark">(() => {
    const mode = themeMode();
    if (mode !== "system") return mode;
    return detectSystemPreference();
  });

  const theme = createMemo<Theme>(() =>
    resolvedMode() === "light"
      ? THEMES[lightThemeName()]
      : THEMES[darkThemeName()]
  );

  function saveSettings() {
    config.saveSettings({
      lightTheme: lightThemeName(),
      darkTheme: darkThemeName(),
      themeMode: themeMode(),
    });
  }

  function setLightThemeAndSave(name: ThemeName) {
    setLightThemeName(name);
    saveSettings();
  }

  function setDarkThemeAndSave(name: ThemeName) {
    setDarkThemeName(name);
    saveSettings();
  }

  function setThemeModeAndSave(mode: ThemeMode) {
    setThemeMode(mode);
    saveSettings();
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        lightThemeName,
        darkThemeName,
        setLightTheme: setLightThemeAndSave,
        setDarkTheme: setDarkThemeAndSave,
        setThemeMode: setThemeModeAndSave,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be called inside ThemeProvider");
  }
  return ctx;
}
```

**Note on `saveSettings()`:** The function reads signal values via `lightThemeName()` etc. Since it's called *after* the setter runs, the values are up to date. This avoids passing the new value explicitly.

**Step 2: Verify compile**

Run: `bun x tsc --noEmit`
Expected: Error only in `app.tsx` on `initialTheme` prop — fixed next.

---

## Task 8: Update app.tsx — pass initialSettings to ThemeProvider

**Files:**
- Modify: `src/app.tsx:300,314`

**Step 1: Replace the two changed lines**

Old (line 300):
```ts
const initialTheme = config.readSettings().theme;
```

New:
```ts
const initialSettings = config.readSettings();
```

Old (line 314):
```tsx
<ThemeProvider initialTheme={initialTheme}>
```

New:
```tsx
<ThemeProvider initialSettings={initialSettings}>
```

**Step 2: Verify clean compile**

Run: `bun x tsc --noEmit`
Expected: 0 errors.

**Step 3: Run tests**

Run: `bun test`
Expected: 28 pass.

**Step 4: Commit**

```bash
git add src/lib/theme-context.tsx src/app.tsx
git commit -m "feat: add light/dark/system theme mode with separate light and dark theme selection"
```

---

## Task 9: Rewrite theme-modal.tsx — three-tab UI

**Files:**
- Modify: `src/components/modals/theme-modal.tsx`

**Step 1: Replace the entire file**

```tsx
// src/components/modals/theme-modal.tsx
import { useKeyboard } from "@opentui/solid";
import { createSignal, For, Show } from "solid-js";
import { useTheme } from "../../lib/theme-context";
import { DARK_THEMES, LIGHT_THEMES, THEME_META } from "../../lib/themes";
import type { ThemeMode, ThemeName } from "../../lib/types";
import { setModal } from "../../store";

type TabId = "mode" | "light" | "dark";
const TABS: TabId[] = ["mode", "light", "dark"];
const MODES: ThemeMode[] = ["system", "light", "dark"];
const MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function tabLabel(tab: TabId): string {
  if (tab === "mode") return "Mode";
  if (tab === "light") return "Light";
  return "Dark";
}

function itemsForTab(tab: TabId): string[] {
  if (tab === "mode") return MODES;
  if (tab === "light") return LIGHT_THEMES;
  return DARK_THEMES;
}

function initialCursorForTab(
  tab: TabId,
  themeMode: ThemeMode,
  lightTheme: ThemeName,
  darkTheme: ThemeName
): number {
  if (tab === "mode") return Math.max(0, MODES.indexOf(themeMode));
  if (tab === "light") return Math.max(0, LIGHT_THEMES.indexOf(lightTheme));
  return Math.max(0, DARK_THEMES.indexOf(darkTheme));
}

function isActiveItem(
  tab: TabId,
  item: string,
  themeMode: ThemeMode,
  lightTheme: ThemeName,
  darkTheme: ThemeName
): boolean {
  if (tab === "mode") return item === themeMode;
  if (tab === "light") return item === lightTheme;
  return item === darkTheme;
}

function displayName(tab: TabId, item: string): string {
  if (tab === "mode") return MODE_LABELS[item as ThemeMode] ?? item;
  return THEME_META[item as ThemeName]?.label ?? item;
}

export const ThemeModal = () => {
  const { theme, themeMode, lightThemeName, darkThemeName, setLightTheme, setDarkTheme, setThemeMode } = useTheme();

  const [activeTab, setActiveTab] = createSignal<TabId>("mode");
  const [cursor, setCursor] = createSignal(
    initialCursorForTab("mode", themeMode(), lightThemeName(), darkThemeName())
  );

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    setCursor(
      initialCursorForTab(tab, themeMode(), lightThemeName(), darkThemeName())
    );
  }

  function selectCurrent() {
    const tab = activeTab();
    const items = itemsForTab(tab);
    const item = items[cursor()];
    if (!item) return;
    if (tab === "mode") {
      setThemeMode(item as ThemeMode);
    } else if (tab === "light") {
      setLightTheme(item as ThemeName);
    } else {
      setDarkTheme(item as ThemeName);
    }
    setModal({ type: "none" });
  }

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "tab") {
      const nextIdx = (TABS.indexOf(activeTab()) + 1) % TABS.length;
      const nextTab = TABS[nextIdx];
      if (nextTab) switchTab(nextTab);
      return;
    }
    if (key.name === "j" || key.name === "down") {
      const max = itemsForTab(activeTab()).length - 1;
      setCursor((i) => Math.min(max, i + 1));
      return;
    }
    if (key.name === "k" || key.name === "up") {
      setCursor((i) => Math.max(0, i - 1));
      return;
    }
    if (key.name === "return" || key.name === "space") {
      selectCurrent();
    }
  });

  const t = () => theme();

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "30%",
        width: "40%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().accent,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>Theme</strong>
      </text>

      {/* Tab bar */}
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <For each={TABS}>
          {(tab, i) => (
            <>
              <span
                style={{
                  fg: activeTab() === tab ? t().cursorBgActive : t().textMuted,
                }}
              >
                {i() > 0 ? "  " : ""}[{tabLabel(tab)}]
              </span>
            </>
          )}
        </For>
      </text>

      {/* Items */}
      <For each={itemsForTab(activeTab())}>
        {(item, i) => {
          const isCursor = () => i() === cursor();
          const isActive = () =>
            isActiveItem(
              activeTab(),
              item,
              themeMode(),
              lightThemeName(),
              darkThemeName()
            );
          return (
            <text
              style={{
                fg: isCursor()
                  ? t().textInverted
                  : isActive()
                    ? t().accent
                    : t().text,
                bg: isCursor() ? t().cursorBgActive : "transparent",
                marginTop: 1,
              }}
            >
              {isCursor() ? "> " : "  "}
              {displayName(activeTab(), item)}
              {isActive() ? "  ●" : ""}
            </text>
          );
        }}
      </For>

      <text style={{ fg: t().textMuted, marginTop: 2 }}>
        <span style={{ fg: t().accent }}>tab</span>:switch
        <span style={{ fg: t().accent }}> j/k</span>:nav
        <span style={{ fg: t().accent }}> spc</span>:select
        <span style={{ fg: t().accentDanger }}> esc</span>:close
      </text>
    </box>
  );
};
```

**Step 2: Verify clean compile**

Run: `bun x tsc --noEmit`
Expected: 0 errors.

**Step 3: Run full test suite**

Run: `bun test`
Expected: 28 pass, 0 fail.

**Step 4: Run the app manually and exercise the theme modal**

```bash
bun run src/index.tsx
```

- Press `Shift+T` to open the theme modal
- Verify 3 tabs: `[Mode] [Light] [Dark]`
- Tab through tabs with `tab` key
- Navigate items with `j`/`k`, select with `space`
- Verify active item shows `●`
- Verify `esc` closes modal

**Step 5: Commit**

```bash
git add src/components/modals/theme-modal.tsx
git commit -m "feat: three-tab theme picker with separate light/dark selection and mode control"
```

---

## Task 10: Final cleanup and verification

**Step 1: Verify catppuccin-mocha.ts is deleted**

```bash
ls src/lib/themes/
```

Expected: `catppuccin.ts  index.ts  tokyo-night.ts  types.ts` — no `catppuccin-mocha.ts`.

**Step 2: Run full linter**

```bash
bun x ultracite check
```

Fix any issues with `bun x ultracite fix`, then re-check.

**Step 3: Run full test suite one more time**

Run: `bun test`
Expected: 28 pass.

**Step 4: Final commit if any lint fixes were needed**

```bash
git add -A
git commit -m "chore: lint fixes for theme system"
```
