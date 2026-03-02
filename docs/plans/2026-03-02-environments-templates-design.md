# Design: Environments, Templates & Debug Console

Date: 2026-03-02

## Overview

Add two major features to lazypush:
1. **Environments per project** — each project has multiple environments (dev, uat, prod, etc.), each with its own service account JSON and own device list.
2. **Message templates** — per-project saved message payloads that can be reused at send time with any target type (devices, topic, or all).

Also adds a **persistent debug console** (in-session log + persisted to disk) and a full **5-panel layout redesign**.

---

## Storage Layout

```
~/.config/lazypush/
└── projects/
    └── [project-id]/
        ├── config.json          # { id, name, createdAt }  — serviceAccountPath removed
        ├── templates.json       # MessageTemplate[]
        └── environments/
            └── [env-id]/
                ├── config.json  # { id, name, serviceAccountPath, createdAt }
                ├── devices.json # Device[]
                └── sessions/
                    └── YYYY-MM-DD_HH-mm-ss.json  # SendLogEntry[]
```

---

## Types

```ts
// Modified — remove serviceAccountPath
interface Project {
  id: string
  name: string
  createdAt: string
}

interface Environment {
  id: string
  name: string                 // e.g. "dev", "uat", "prod"
  serviceAccountPath: string
  createdAt: string
}

interface MessageTemplate {
  id: string
  name: string                 // e.g. "Silent background push"
  message: FcmMessage
  createdAt: string
}

interface SendLogEntry {
  timestamp: string
  templateName?: string
  targetType: "devices" | "topic" | "all"
  targetInfo: string           // device names joined / topic string / "all"
  results: SendResult[]
}
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Templates         │ Devices (checkboxes)                     │
│ ─────────────     │ ─────────────────────────────────────── │
│ [T] Login push    │ [x] iPhone 14 (ios)                     │
│ [T] Silent data   │ [ ] Pixel 7 (android)                   │
│ [T] Deep link     │ [ ] iPad Pro (ios)                       │
│                   │                                          │
│ Environments      ├──────────────────────────────────────── │
│ ─────────────     │ Debug Console                            │
│ [E] dev           │ ─────────────────────────────────────── │
│ [E] uat           │ 14:22:01 ✓ Login push → devices (2/2)  │
│ [E] prod          │ 14:20:44 ✗ Silent data → topic/news     │
│                   │           ERR: invalid token             │
│ Projects          │                                          │
│ ─────────────     │                                          │
│ [P] MyApp         │                                          │
│ [P] AdminApp      │                                          │
├───────────────────┴──────────────────────────────────────── │
│ [tab]:focus  [s]:send  [m]:compose  [t]:template  [q]:quit  │
└─────────────────────────────────────────────────────────────┘
```

**Panel focus order** (`tab` cycles): Projects → Environments → Templates → Devices → Console

---

## Keyboard Actions

| Context | Key | Action |
|---------|-----|--------|
| Projects / Environments / Templates | `↑↓` | Navigate list |
| Projects / Environments / Templates | `n` | New item |
| Projects / Environments / Templates | `e` | Edit selected |
| Projects / Environments / Templates | `D` | Delete selected |
| Devices | `↑↓` | Navigate |
| Devices | `space` | Toggle checkbox |
| Devices | `a` | Add device |
| Devices | `e` | Edit device |
| Devices | `D` | Delete device |
| Console | `↑↓` | Scroll log |
| Global | `s` / `enter` | Open send modal |
| Global | `m` | Compose one-off message |
| Global | `q` | Quit |

---

## Send Modal Flow

```
Press s →  [Send As]
           > Selected devices (N checked)
             Topic → prompts for topic string
             All devices in env
```

Templates store message payload only. Target type is chosen at send time.

---

## Component Tree

```
App
├── LeftPanel
│   ├── TemplateList
│   ├── EnvironmentList
│   └── ProjectList
├── RightPanel
│   ├── DeviceList
│   └── DebugConsole
└── modals/
    ├── ProjectModal      (name only — no service account)
    ├── EnvironmentModal  (name + service account path)
    ├── TemplateModal     (name + message fields)
    ├── DeviceModal       (unchanged)
    ├── SendModal         (choose target: devices / topic / all)
    └── MessageModal      (compose one-off, not saved as template)
```

`ResultModal` is removed — results go to DebugConsole.

---

## Data Flow

```
keyboard → App.tsx → store.ts
                   → config.ts (environments, templates, devices, sessions)
                   → fcm.ts    (uses selectedEnvironment.serviceAccountPath)
                              → DebugConsole (appends SendLogEntry)
                              → sessions/YYYY-MM-DD_HH-mm-ss.json (persisted)
```

---

## Store Changes

New signals/stores:
- `environments` — list for selected project
- `selectedEnvironment` — active env
- `environmentIndex`
- `templates` — list for selected project
- `templateIndex`
- `sendLog` — `SendLogEntry[]` (in-memory, displayed in DebugConsole)
- `consoleScrollOffset`
- `focused` — expands to `"projects" | "environments" | "templates" | "devices" | "console"`

---

## Session Persistence

- Session file created on first send: `environments/[env-id]/sessions/YYYY-MM-DD_HH-mm-ss.json`
- Each send appends a `SendLogEntry` to the file
- In-memory `sendLog` mirrors the file for display in DebugConsole

---

## Migration

Existing projects with `serviceAccountPath` in `config.json` need a one-time migration:
- On startup, detect old format (has `serviceAccountPath`)
- Auto-create a default environment named `"default"` with that path
- Remove `serviceAccountPath` from `config.json`
