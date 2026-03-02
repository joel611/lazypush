<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

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

## High-Level Architecture

### Tauri Communication Pattern
The application follows Tauri's **command pattern** for frontend-backend communication:

1. **Frontend (React)** handles UI/UX and user interactions
2. **Rust Backend** handles:
   - File system operations (reading/writing project data)
   - Firebase Admin SDK initialization and messaging
   - Service account file validation
3. **Tauri Commands** bridge the two layers using `#[tauri::command]` annotations

Example flow for sending a notification:
```
User clicks "Send" → React component → invoke('send_notification', { ... })
→ Rust command handler → Firebase Admin SDK → FCM API → Returns result → React updates UI
```

### Data Storage Architecture

**File-based storage** organized by project:
```
data/projects/[project-uuid]/
├── config.json       # Project name, service account path, metadata
├── devices.json      # Array of device objects (name, platform, token)
└── messages.json     # Array of message template objects
```

**Key Design Decisions:**
- **Auto-save**: All changes persist immediately (no save button)
- **Project Isolation**: Each Firebase project gets its own folder
- **No Database**: Simple JSON files for portability and transparency
- **Service Account Storage**: JSON files stored locally, referenced by absolute path

### Firebase Integration Pattern

**Multiple Projects Support:**
- Each project maintains its own Firebase Admin SDK instance
- Service account files are stored outside the app (user's filesystem)
- Application stores only the path reference, not the credentials themselves

**Message Structure:**
FCM messages have four main components:
- `notification`: Title, body, image (displayed to user)
- `data`: Custom key-value pairs (always delivered to app)
- `android`: Android-specific config (priority, sound, etc.)
- `apns`: iOS-specific config (content-available, mutable-content, etc.)

**Sending Methods:**
- `sendEachForMulticast()`: Primary method for sending to multiple devices (up to 500 tokens)
- `send()`: Single device sending
- Topic-based: Future feature for broadcasting to subscribed devices

### Legacy Script Architecture (`index.mjs`)

**Current implementation** (to be migrated to Tauri):
- Single-file script using Firebase Admin SDK directly
- Credentials loaded from local JSON files (lines 6, 10)
- Active project selected by swapping `cert()` parameter (line 14)
- FCM tokens hardcoded in array (lines 17-32)
- Two message payload examples (rich notifications vs simple navigation)

**Migration Strategy:**
The Tauri app will replicate this logic but with:
- GUI for project/device/message management
- Persistent storage instead of code editing
- Multiple projects active simultaneously

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

### TypeScript/React
- Use **Biome** for formatting and linting (configured in `biome.json`)
- Functional components with hooks only
- Component files: PascalCase (e.g., `DeviceList.tsx`)
- Use `cn()` utility for conditional Tailwind classes

### shadcn/ui Components
- Components are **copied** into `src/components/ui/` (not npm packages)
- Customize freely for desktop app needs
- Follow composition patterns from shadcn/ui docs

### Rust
- Use `rustfmt` for formatting
- Run `clippy` for lints
- Document all public APIs with doc comments
- Tauri commands should be in separate modules (not all in `main.rs`)

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
