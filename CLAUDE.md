# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**lazypush** is a Bun-native terminal UI (TUI) tool for testing Firebase Cloud Messaging (FCM) push notifications. Uses `@opentui/solid` (SolidJS reconciler for OpenTUI).

**Tech Stack:**
- **Runtime**: Bun
- **TUI**: @opentui/solid (SolidJS)
- **Firebase**: firebase-admin (npm)
- **Config**: `~/.config/lazypush/` (JSON files)

## Development Commands

```bash
bun run src/index.tsx   # Run the TUI
bun test                # Run unit tests
```

## Architecture

The TUI is rendered by `@opentui/solid` into the terminal using a SolidJS reconciler.

**Component tree:**
```
App
├── ProjectList
├── DeviceList
├── StatusBar
└── modals/
    ├── ProjectModal
    ├── DeviceModal
    ├── MessageModal
    └── ResultModal
```

**Key design decisions:**
- Keyboard routing lives in `App.tsx` via `useKeyboard()` — all key events funnel here
- Reactive state lives in `src/store.ts` using SolidJS `createSignal` and `createStore`
- Config read/write is the exclusive responsibility of `src/lib/config.ts`
- Firebase Admin SDK is called directly from Bun in `src/lib/fcm.ts` — no IPC layer
- Types are defined in `src/lib/types.ts`

**Data flow:**
```
keyboard event → App.tsx handler → store.ts (state update)
                                 → config.ts (disk write)
                                 → fcm.ts (Firebase send) → result modal
```

**Storage layout** (`~/.config/lazypush/`):
```
~/.config/lazypush/
└── projects/
    └── [project-id]/
        ├── config.json    # Project name and service account path
        └── devices.json   # Array of device objects
```

## FCM Domain Knowledge

### Key Concepts
- **Device Token**: Unique identifier for each app installation (not per device, per app install)
- **Multicast**: Batch send to multiple tokens (max 500 per call)
- **Topic Messaging**: Broadcast to all subscribers of a topic
- **Service Account**: JSON credential file from Firebase Console

### Platform Differences
**iOS (APNs):**
- Requires `apns` payload with specific headers
- `contentAvailable: 1` for background delivery
- `mutableContent: 1` for notification service extensions
- Priority: "5" (normal) or "10" (high)

**Android:**
- Uses `android` object for platform-specific config
- `priority: 'high'` for immediate delivery
- Data payload structure more flexible than iOS

### Common Testing Scenarios
1. **Simple notification**: Title + body only
2. **Rich notification**: With image and custom actions
3. **Deep linking**: Navigate to specific screen on tap
4. **Data-only**: Background message with no notification UI
5. **Priority testing**: High vs normal delivery
6. **Foreground vs background**: App state handling

## Code Conventions

### OpenTUI Styling Rules (@opentui/solid)
- `<text>` color: `style={{ fg: "#FFF" }}` — NOT `color:` (HTML CSS, ignored)
- `<text>` background: `style={{ bg: "#000" }}` — NOT `backgroundColor:` (that's only for `<box>`)
- `<span>` color: `style={{ fg: "#FFF" }}` — NOT `fg="#FFF"` (direct prop silently ignored by reconciler)
- `<box>` background: `backgroundColor:` is correct — do NOT change to `bg:`
- When debugging prop issues, check `setProperty()` in `node_modules/@opentui/solid/index.js`

### OpenTUI Keyboard Handling
- **Uppercase key normalization**: OpenTUI lowercases all uppercase keystrokes and sets `shift: true`. `Shift+T` → `{ name: "t", shift: true }`, NOT `{ name: "T" }`. Always use `key.name === "t" && key.shift` pattern for shift-key bindings.
- **Local KeyInput interface**: `src/app.tsx` defines its own `KeyInput` — add `shift?: boolean` when adding shift-key handlers.

### Ultracite (Biome Linter) Gotchas
- **No nested ternaries**: `noNestedTernary` rule fires on `a ? b : c ? d : e`. Extract a helper function instead.
- **Unused import removal**: Linter strips imports with no usage before commit. Always add import + first usage in the same edit.

- **Runtime**: Bun — no transpile step; run and test with `bun` directly
- **Reactivity**: SolidJS patterns — `createSignal`, `createStore`, `createMemo`; avoid mutable state outside the store
- **Components**: PascalCase files in `src/components/`; functional components only
- **No console.log** in production code
- **Types**: all shared types defined in `src/lib/types.ts`
- **Config I/O**: all disk reads/writes go through `src/lib/config.ts` — no direct `fs` calls elsewhere

### Git Workflow
- **Main branch**: `main` (stable releases)
- **Feature branches**: `feature/descriptive-name`
- **Commit format**: Conventional Commits
  - `feat:` new features
  - `fix:` bug fixes
  - `chore:` maintenance
  - `docs:` documentation

## Security and Credentials

**Critical**: Service account JSON files contain sensitive credentials.

- **Never commit** service account files (already in `.gitignore`)
- Files stored in user's filesystem, app stores path reference only
- No credential validation or encryption in app (trusts user-provided files)
- Local storage only, no cloud sync

## Project Context

For detailed project conventions, tech stack, and domain knowledge, see:
- `openspec/project.md`: Comprehensive project context
- `README.md`: User-facing documentation and roadmap
- `openspec/AGENTS.md`: OpenSpec workflow for spec-driven development
