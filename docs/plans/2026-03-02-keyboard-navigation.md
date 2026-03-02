# Keyboard Navigation Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `1-5` pane jump keys and `j`/`k` nvim-style movement, with numbered title prefixes on each panel.

**Architecture:** All key handling lives in `App.tsx`. Each panel component owns its own title rendering. Changes are purely additive — arrow keys keep working, tab keeps working.

**Tech Stack:** Bun, SolidJS (`@opentui/solid`), TypeScript

---

### Task 1: Add `1-5` pane jump and `j`/`k` movement to App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add PANE_KEYS map below FOCUS_ORDER**

In `src/App.tsx`, after line 28 (`const FOCUS_ORDER = ...`), add:

```ts
const PANE_KEYS: Partial<Record<string, typeof FOCUS_ORDER[number]>> = {
  "1": "templates",
  "2": "environments",
  "3": "projects",
  "4": "devices",
  "5": "console",
}
```

**Step 2: Add pane jump handler at top of useKeyboard callback**

Inside `useKeyboard((key) => {`, after the `if (modal().type !== "none") return` guard, add:

```ts
// Number keys jump to pane
const pane = PANE_KEYS[key.name]
if (pane) { setFocused(pane); return }
```

**Step 3: Add nav alias before panel-specific blocks**

After the global handlers (`q`, `tab`, `m`, `s`/`return`) and before the `// ── Projects panel` comment, add:

```ts
// nvim movement aliases
const nav = key.name === "j" ? "down" : key.name === "k" ? "up" : key.name
```

**Step 4: Replace `key.name` with `nav` for up/down checks in all 5 panel blocks**

In each `if (focused() === "...")` block, change every:
- `key.name === "up"` → `nav === "up"`
- `key.name === "down"` → `nav === "down"`

Panels to update: `projects`, `environments`, `templates`, `devices`, `console`

All other `key.name` checks (`"n"`, `"e"`, `"D"`, `"space"`, `"a"`) stay unchanged.

**Step 5: Verify the full keyboard handler looks correct**

Final structure inside `useKeyboard`:
```
guard: modal check
pane jump: PANE_KEYS
global: q, tab, m, s/return
nav alias: const nav = ...
projects block: nav === "up"/"down", key.name for n/e/D
environments block: same pattern
templates block: same pattern
devices block: same pattern
console block: same pattern
```

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add 1-5 pane jump and j/k movement"
```

---

### Task 2: Add numbered title prefixes to all 5 panel components

**Files:**
- Modify: `src/components/TemplateList.tsx`
- Modify: `src/components/EnvironmentList.tsx`
- Modify: `src/components/ProjectList.tsx`
- Modify: `src/components/DeviceList.tsx`
- Modify: `src/components/DebugConsole.tsx`

**Step 1: Update TemplateList title (pane 1)**

Change line 23 in `src/components/TemplateList.tsx` from:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>Templates</text>
```
to:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>
  <span style={{ color: "#00FFFF" }}>1</span> Templates
</text>
```

**Step 2: Update EnvironmentList title (pane 2)**

Change line 23 in `src/components/EnvironmentList.tsx` from:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>Environments</text>
```
to:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>
  <span style={{ color: "#00FFFF" }}>2</span> Environments
</text>
```

**Step 3: Update ProjectList title (pane 3)**

Change line 23 in `src/components/ProjectList.tsx` from:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>Projects</text>
```
to:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>
  <span style={{ color: "#00FFFF" }}>3</span> Projects
</text>
```

**Step 4: Update DeviceList title (pane 4)**

Change line 22 in `src/components/DeviceList.tsx` from:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>Devices</text>
```
to:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>
  <span style={{ color: "#00FFFF" }}>4</span> Devices
</text>
```

**Step 5: Update DebugConsole title (pane 5)**

Change line 23 in `src/components/DebugConsole.tsx` from:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>Debug Console</text>
```
to:
```tsx
<text style={{ color: "#FFFFFF", bold: true }}>
  <span style={{ color: "#00FFFF" }}>5</span> Debug Console
</text>
```

**Step 6: Commit**

```bash
git add src/components/TemplateList.tsx src/components/EnvironmentList.tsx src/components/ProjectList.tsx src/components/DeviceList.tsx src/components/DebugConsole.tsx
git commit -m "feat: add numbered title prefixes to all panels"
```

---

### Task 3: Update StatusBar hints

**Files:**
- Modify: `src/components/StatusBar.tsx`

**Step 1: Replace `tab:focus` with `1-5:pane` and add `j/k:↑↓`**

Change the hints line in `src/components/StatusBar.tsx`. Replace:
```tsx
<span style={{ color: "#00FFFF" }}>tab</span>:focus
```
with:
```tsx
<span style={{ color: "#00FFFF" }}>1-5</span>:pane
<span style={{ color: "#00FFFF" }}> j/k</span>:↑↓
```

(Keep all other hints: `n`, `e`, `D`, `m`, `t`, `s`, `q` unchanged)

**Step 2: Commit**

```bash
git add src/components/StatusBar.tsx
git commit -m "feat: update StatusBar hints for keyboard navigation"
```
