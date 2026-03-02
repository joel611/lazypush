# lazypush — TUI Redesign Design Doc

**Date**: 2026-03-02
**Status**: Approved

## Summary

Refactor the FCM push notification tester from a Tauri desktop app (React + Rust) to a Bun-native terminal UI app called **lazypush**, using `@opentui/solid` (SolidJS reconciler for OpenTUI). Remove all desktop app code. Config stored at `~/.config/lazypush/`.

## Goals

- MVP: select project → select devices → send FCM notification
- Manage projects and devices from within the TUI
- Config files in `~/.config/lazypush/` (also manually editable)
- Rename project to `lazypush`

## Non-Goals

- Message templates persistence (message composed ad-hoc per session)
- Send history
- Debug panel
- Topic-based messaging

## Technology Stack

| Concern | Choice |
|---------|--------|
| Runtime | Bun |
| TUI framework | @opentui/solid |
| UI paradigm | SolidJS (fine-grained reactivity) |
| Firebase | firebase-admin (npm) |
| Config storage | `~/.config/lazypush/` JSON files |

## Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│  lazypush                                               │
├────────────────────┬────────────────────────────────────┤
│  Projects          │  Devices                           │
│  ──────────────    │  ────────────────────────          │
│  > My Project 1    │  [x] John's iPhone (ios)           │
│    My Project 2    │  [ ] Samsung Galaxy (android)      │
│                    │  [x] Pixel 7 (android)             │
├────────────────────┴────────────────────────────────────┤
│  n:new-project  a:add-device  e:edit  D:delete          │
│  m:message  s:send  q:quit                              │
└─────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑`/`↓` | Navigate within focused panel |
| `Tab` | Switch focus between Projects/Devices panels |
| `n` | New project modal |
| `a` | Add device to selected project |
| `e` | Edit selected item |
| `D` | Delete selected item |
| `Space` | Toggle device selection |
| `m` | Open message composer modal |
| `s` / `Enter` | Send notification to selected devices |
| `q` | Quit |

### Modals

1. **Project modal** — project name + service account file path (text inputs)
2. **Device modal** — device name + platform (ios/android toggle) + FCM token
3. **Message modal** — notification title, body, data (JSON textarea), platform options (apns/android)
4. **Result overlay** — per-device success/failure after send

## Data Architecture

### Config Location

```
~/.config/lazypush/
└── projects/
    └── [project-uuid]/
        ├── config.json    # name, serviceAccountPath, createdAt
        └── devices.json   # array of device objects
```

### config.json

```json
{
  "id": "uuid",
  "name": "My Project",
  "serviceAccountPath": "/abs/path/to/service-account.json",
  "createdAt": "2026-03-02T00:00:00Z"
}
```

### devices.json

```json
[
  {
    "id": "uuid",
    "name": "John's iPhone",
    "platform": "ios",
    "token": "fcm-token",
    "createdAt": "2026-03-02T00:00:00Z"
  }
]
```

## File Structure

```
lazypush/
├── src/
│   ├── index.tsx              # Entry point (Bun + OpenTUI bootstrap)
│   ├── App.tsx                # Root layout component
│   ├── store.ts               # SolidJS reactive store (signals)
│   ├── components/
│   │   ├── ProjectList.tsx
│   │   ├── DeviceList.tsx
│   │   ├── StatusBar.tsx
│   │   └── modals/
│   │       ├── ProjectModal.tsx
│   │       ├── DeviceModal.tsx
│   │       ├── MessageModal.tsx
│   │       └── ResultModal.tsx
│   └── lib/
│       ├── config.ts          # Read/write ~/.config/lazypush/
│       ├── fcm.ts             # firebase-admin wrapper
│       └── types.ts           # Shared TypeScript types
├── package.json               # Bun workspace, @opentui/solid, firebase-admin
└── tsconfig.json
```

## Cleanup (Files to Remove)

- `src/` (entire React/Tauri frontend)
- `src-tauri/` (entire Rust backend)
- `dist/`
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.node.json`
- `postcss.config.js`
- `tailwind.config.js`
- `biome.json`
- `index.html`
- `public/`
- `pnpm-lock.yaml`
- `.npmrc`

## Firebase Sending Flow

1. On send: read service account JSON from `serviceAccountPath`
2. Initialize firebase-admin app with the credential (or reuse cached instance)
3. Call `getMessaging().sendEachForMulticast({ tokens, ...message })`
4. Display result modal with per-device success/failure
