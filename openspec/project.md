# Project Context

## Purpose
FCM Push Notification Tester is a cross-platform desktop application designed to help backend and mobile app developers test Firebase Cloud Messaging (FCM) push notifications for iOS and Android devices.

**Primary Goals:**
- Simplify push notification testing across multiple Firebase projects
- Provide an intuitive GUI for managing test devices and notification payloads
- Enable quick iteration on notification content, data payloads, and platform-specific configurations
- Replace manual CLI scripts with a professional desktop tool

**Target Users:**
- Backend developers testing notification delivery systems
- Mobile app developers debugging push notification handling
- QA engineers validating notification features

## Tech Stack
- **Frontend Framework**: React 18+
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components built with Radix UI and Tailwind CSS
- **Styling**: Tailwind CSS (required by shadcn/ui)
- **Desktop Framework**: [Tauri](https://tauri.app/) v2.x
- **Backend/Core**: Rust
- **Push Notifications**: Firebase Admin SDK (Node.js binding)
- **Runtime**: Node.js (for Firebase Admin SDK integration)
- **Data Storage**: File-based JSON storage (no database)
- **Build Tool**: Vite (typical for Tauri projects)

**Current Legacy Code:**
- `index.mjs`: Single-file CLI script using Firebase Admin SDK (to be migrated/replaced)

## Project Conventions

### Code Style
- **JavaScript/TypeScript**:
  - Use ES modules (`import`/`export`)
  - Prefer `const` over `let`, avoid `var`
  - Use async/await for asynchronous operations
  - TypeScript for type safety (strongly recommended)
  - **Tooling**: [Biome](https://biomejs.dev/) for formatting and linting
    - Replaces ESLint and Prettier with a single fast tool
    - Run `biome check` for linting
    - Run `biome format` for formatting
    - Configuration in `biome.json`

- **React**:
  - Use functional components with hooks
  - Follow React hooks rules (no hooks in conditionals/loops)
  - Component file naming: PascalCase (e.g., `DeviceList.tsx`)
  - Use proper component composition and prop drilling alternatives (Context API when needed)

- **shadcn/ui**:
  - Components are copied into the project (not installed as dependencies)
  - Located in `src/components/ui/` directory
  - Customize components as needed for desktop app requirements
  - Follow shadcn/ui's composition patterns and utilities

- **Tailwind CSS**:
  - Use utility classes for styling
  - Follow shadcn/ui's design tokens and color system
  - Use `cn()` utility for conditional classes

- **Rust**:
  - Follow `rustfmt` defaults
  - Use `clippy` for linting
  - Document public APIs with doc comments

### Architecture Patterns
- **Desktop Architecture**: Tauri's command pattern
  - Frontend communicates with Rust backend via Tauri commands
  - Rust handles file I/O, Firebase SDK integration, and system operations
  - Frontend handles UI/UX and user input validation

- **Data Storage Pattern**:
  - File-based storage organized by project folders
  - Each project gets its own directory under `data/projects/[project-id]/`
  - Auto-save on every change (no explicit save button)
  - JSON format for all configuration files

- **Project Structure**:
  ```
  data/projects/[project-id]/
    ├── config.json       # Project metadata and Firebase credentials path
    ├── devices.json      # Device registry
    └── messages.json     # Message templates
  ```

- **Firebase Integration**:
  - Multiple Firebase projects supported simultaneously
  - Service account JSON files stored locally and referenced by path
  - Each project maintains its own Firebase Admin SDK instance

### Testing Strategy
- **Unit Tests**: Test individual components and utility functions
- **Integration Tests**: Test Tauri commands and Firebase SDK interactions
- **Manual Testing**: Primary method for UI/UX validation
- **Real Device Testing**: Test with actual iOS/Android devices using real FCM tokens

### Git Workflow
- **Main Branch**: `main` (stable releases)
- **Feature Branches**: `feature/description-of-feature`
- **Commit Convention**: Conventional Commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `chore:` for maintenance tasks
  - `docs:` for documentation updates
- **No Force Push**: Avoid rewriting history on shared branches

## Domain Context

### Firebase Cloud Messaging (FCM)
FCM is Google's cross-platform messaging solution that enables sending notifications and data messages to mobile devices.

**Key Concepts:**
- **Device Token**: Unique identifier for each app installation used to target specific devices
- **Multicast Messages**: Send to multiple tokens in a single API call (up to 500 tokens)
- **Topic Messaging**: Send to all devices subscribed to a topic
- **Service Account**: JSON credential file that authenticates with Firebase APIs

**Platform-Specific Configuration:**
- **iOS (APNs)**: Requires `apns` payload with headers and `aps` object
- **Android**: Uses `android` priority settings and data payload conventions

**Message Structure:**
- `notification`: Standard notification displayed to users (title, body, image)
- `data`: Custom key-value pairs passed to the app (even when backgrounded)
- `android`: Android-specific configuration (priority, sound, etc.)
- `apns`: iOS-specific configuration (content-available, mutable-content, etc.)

### Testing Scenarios
Common notification testing scenarios this tool should support:
1. Simple text notifications
2. Rich notifications with images
3. Deep linking / navigation to specific app screens
4. Data-only messages (no notification UI)
5. Different priority levels (normal vs high)
6. Background vs foreground delivery
7. Custom actions and buttons

## Important Constraints

### Technical Constraints
- **Local Only**: All data stored locally, no cloud sync or remote storage
- **Firebase Dependency**: Requires valid Firebase project with FCM enabled
- **Service Account Required**: Users must have access to Firebase service account JSON files
- **Network Required**: Internet connection needed to send notifications via FCM
- **Platform Limits**: FCM rate limits and quotas apply (e.g., 500 tokens per multicast)

### Security Constraints
- **Credential Security**: Service account files contain sensitive credentials and must never be committed to git
- **Local Storage**: Application data stored in user's local file system (not encrypted by default)
- **No Credential Validation**: Application trusts user-provided service account files

### User Experience Constraints
- **Desktop Only**: Not a web or mobile application
- **Manual Token Management**: Users must manually obtain and input FCM tokens from their devices
- **No Automatic Device Discovery**: Cannot automatically detect available test devices

## External Dependencies

### Firebase Admin SDK
- **Purpose**: Send push notifications via FCM
- **API**: `firebase-admin/messaging` module
- **Methods Used**:
  - `sendEachForMulticast()`: Send to multiple tokens
  - `send()`: Send single message
  - `subscribeToTopic()` / `unsubscribeFromTopic()`: Topic management (future feature)

### Firebase Service Account
- **Format**: JSON file downloaded from Firebase Console
- **Location**: Project Settings → Service Accounts → Generate New Private Key
- **Permissions Required**: Firebase Cloud Messaging API access

### Platform Requirements
- **Tauri System Dependencies**: Platform-specific requirements (WebView, system libraries)
- **Node.js**: Required for Firebase Admin SDK
- **Rust Toolchain**: Required for building Tauri backend
