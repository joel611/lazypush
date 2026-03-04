# Theme Picker Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

Add a ThemeContext to lazypush that replaces all hardcoded hex color values with semantic theme tokens. Ship two themes: `tokyonight-night` and `catppuccin-mocha`. A `T` keypress opens a theme picker modal. Selected theme persists to `~/.config/lazypush/settings.json`.

---

## 1. Semantic Token Set

21 tokens covering all 16 hardcoded hex values currently in the codebase:

```typescript
interface Theme {
  name: string
  // Panels
  panelBg: string              // transparent
  panelBorder: string          // unfocused panel border
  panelBorderActive: string    // focused panel border
  // Modals
  modalBg: string              // modal background
  modalBorder: string          // modal border / focused field border
  // Chrome
  statusBarBg: string          // status bar background
  // Text
  text: string                 // primary text
  textMuted: string            // secondary / label text
  textDim: string              // very dim (inactive cursor bg, non-focused items)
  textInverted: string         // text rendered on accent backgrounds
  // Accents
  accent: string               // primary accent (cyan-family)
  accentTemplate: string       // template mode (orange-family)
  accentSuccess: string        // success / send (green-family)
  accentDanger: string         // error / delete / quit (red-family)
  // Cursor / selection
  cursorBg: string             // inactive cursor row background
  cursorBgActive: string       // active (selected) cursor row background
  paneLabel: string            // pane number labels 1–5
  // Fields
  fieldBorder: string          // inactive field border in modals
  fieldBorderActive: string    // active field border in modals
  // Lists
  deviceText: string           // non-focused device list items
  selectOptionBg: string       // selected send-option row background
}
```

---

## 2. Theme Definitions (`src/lib/themes.ts`)

### `tokyonight-night`
```
panelBorder:       #292e42   panelBorderActive: #7aa2f7
modalBg:           #16161e   modalBorder:       #7aa2f7
statusBarBg:       #16161e
text:              #c0caf5   textMuted:         #565f89   textDim:  #414868
textInverted:      #1a1b26
accent:            #7dcfff   accentTemplate:    #e0af68
accentSuccess:     #9ece6a   accentDanger:      #f7768e
cursorBg:          #292e42   cursorBgActive:    #7aa2f7
paneLabel:         #e0af68
fieldBorder:       #292e42   fieldBorderActive: #7aa2f7
deviceText:        #9aa5ce   selectOptionBg:    #1a2b47
```

### `catppuccin-mocha`
```
panelBorder:       #313244   panelBorderActive: #89b4fa
modalBg:           #181825   modalBorder:       #89b4fa
statusBarBg:       #181825
text:              #cdd6f4   textMuted:         #6c7086   textDim:  #585b70
textInverted:      #1e1e2e
accent:            #89dceb   accentTemplate:    #fab387
accentSuccess:     #a6e3a1   accentDanger:      #f38ba8
cursorBg:          #313244   cursorBgActive:    #89b4fa
paneLabel:         #f9e2af
fieldBorder:       #45475a   fieldBorderActive: #89b4fa
deviceText:        #bac2de   selectOptionBg:    #1e3a5f
```

Both themes are exported from `src/lib/themes.ts` in a `THEMES` registry:
```typescript
export const THEMES: Record<ThemeName, Theme> = {
  "tokyonight-night": tokyoNightTheme,
  "catppuccin-mocha": catppuccinMochaTheme,
}
export type ThemeName = keyof typeof THEMES
export const DEFAULT_THEME: ThemeName = "tokyonight-night"
```

---

## 3. ThemeContext (`src/lib/theme-context.tsx`)

```typescript
type ThemeContextValue = {
  theme: Accessor<Theme>
  setThemeName: (name: ThemeName) => void
}
export const ThemeContext = createContext<ThemeContextValue>()
export function useTheme() { return useContext(ThemeContext)! }
```

**ThemeProvider:**
- Accepts `initialTheme: ThemeName` prop (read from settings at startup)
- Holds `createSignal<Theme>` internally
- `setThemeName` updates the signal AND persists to settings via `useServices().config`
- Wraps children with `ThemeContext.Provider`

ThemeProvider must be **inside** `ServicesProvider` so it can call `useServices().config.saveSettings()`.

**Provider nesting in `src/index.tsx`:**
```tsx
<ServicesProvider config={config} send={send}>
  <ThemeProvider initialTheme={initialThemeName}>
    <App />
  </ThemeProvider>
</ServicesProvider>
```

`initialThemeName` is resolved before render by calling `config.readSettings()` synchronously.

---

## 4. Settings Persistence (`src/lib/config.ts`)

New file: `~/.config/lazypush/settings.json`
```json
{ "theme": "tokyonight-night" }
```

Two new functions added to `ConfigProvider` interface and `FileSystemConfigProvider` implementation:
```typescript
readSettings(): AppSettings          // reads settings.json, falls back to defaults
saveSettings(settings: AppSettings): void
```

New type in `src/lib/types.ts`:
```typescript
interface AppSettings {
  theme: ThemeName
}
```

---

## 5. Theme Picker Modal (`src/components/modals/theme-modal.tsx`)

**Trigger:** `T` key in App.tsx (when no modal open, same pattern as `m` for message modal).
**New modal type** added to `ModalState`:
```typescript
| { type: "theme" }
```

**UI layout:**
```
┌─── Theme ──────────────────────────────────────┐
│                                                 │
│  > tokyonight-night  ●                         │
│    catppuccin-mocha                             │
│                                                 │
│  [↑↓] navigate  [enter/spc] select  [esc] close│
└─────────────────────────────────────────────────┘
```

- `>` = cursor row (navigation highlight)
- `●` = currently active theme
- `↑/↓` or `j/k` — move cursor
- `enter` or `space` — apply theme (calls `setThemeName`, closes modal)
- `esc` — close without change

Styling uses `useTheme()` internally (so the modal renders in the current theme while browsing).

---

## 6. Component Migration Pattern

Every component replaces inline hex literals with theme token lookups:

```tsx
// Before
<box borderColor="#00FFFF" />

// After
const t = useTheme()
<box borderColor={t().accent} />
```

Components affected (all 12):
- `project-list.tsx`, `environment-list.tsx`, `template-list.tsx`
- `device-list.tsx`, `debug-console.tsx`, `status-bar.tsx`
- `modals/project-modal.tsx`, `environment-modal.tsx`, `template-modal.tsx`
- `modals/device-modal.tsx`, `message-modal.tsx`, `send-modal.tsx`

---

## 7. Status Bar Update

Add `T` hint to status bar:
```
[T]:theme
```
Styled with `t().accent` (cyan-family), consistent with other nav hints.

---

## 8. Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `src/lib/themes.ts` | **Create** | Theme interface, 2 theme defs, THEMES registry |
| `src/lib/theme-context.tsx` | **Create** | ThemeContext, ThemeProvider, useTheme |
| `src/components/modals/theme-modal.tsx` | **Create** | Theme picker modal |
| `src/lib/types.ts` | **Modify** | Add `AppSettings`, `ThemeName`, `{ type: "theme" }` to ModalState |
| `src/lib/config.ts` | **Modify** | Add `readSettings()`, `saveSettings()` to interface + impl |
| `src/index.tsx` | **Modify** | Read initial theme, wrap with ThemeProvider |
| `src/app.tsx` | **Modify** | Add `T` key handler → `setModal({ type: "theme" })`, render ThemeModal |
| `src/components/status-bar.tsx` | **Modify** | Add `[T]:theme` hint, migrate colors |
| All 12 component files | **Modify** | Replace hardcoded hex with `useTheme()` tokens |

---

## 9. Verification

1. `bun run src/index.tsx` — app renders without errors
2. Press `T` — theme modal opens showing 2 themes
3. Select `catppuccin-mocha` — all panels, modals, status bar recolor instantly
4. Quit and relaunch — theme persists (check `~/.config/lazypush/settings.json`)
5. `bun test` — all tests pass
6. `bun x ultracite check` — no lint errors
