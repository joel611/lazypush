# Design: Tauri Base Project Setup

## Context
This is the foundational architecture for the FCM Push Notification Tester desktop application. We are transitioning from a single-file CLI script (`index.mjs`) to a full Tauri desktop application with React frontend. This change establishes the project structure, build tooling, and UI framework that all future features will build upon.

**Constraints:**
- Must work cross-platform (macOS, Windows, Linux)
- Desktop-only (not web or mobile)
- Local file storage (no database, no cloud sync)
- Firebase Admin SDK integration required (Node.js binding)

**Stakeholders:**
- Backend developers testing FCM notifications
- Mobile developers debugging push notification handling
- Future contributors to the project

## Goals / Non-Goals

**Goals:**
- Establish Tauri v2.x project structure with clear separation between frontend (React) and backend (Rust)
- Configure modern tooling: Vite for build, Biome for linting/formatting, TypeScript for type safety
- Set up shadcn/ui + Tailwind CSS for consistent, professional UI components
- Verify the setup works with a minimal "Hello World" UI
- Maintain backward compatibility with legacy `index.mjs` during transition

**Non-Goals:**
- Implementing FCM functionality (future change)
- Creating project/device/message management features (future changes)
- Migrating logic from `index.mjs` (future change)
- Setting up automated testing infrastructure (future change)

## Decisions

### Decision 1: Tauri v2.x with React + TypeScript Template
**Rationale:**
- Tauri provides smaller bundle size and better performance than Electron
- React is widely adopted and team is familiar with it
- TypeScript provides type safety for complex FCM message structures
- Vite (included in template) offers fast hot reload for development

**Alternatives Considered:**
- Vue/Svelte: Less ecosystem maturity for desktop apps, team less familiar
- Plain JavaScript: Type safety valuable for FCM API interactions
- Electron: Larger bundle size, higher memory usage

### Decision 2: shadcn/ui for UI Components
**Rationale:**
- Components are copied into project (full control, no version lock-in)
- Built on Radix UI (accessible, well-tested primitives)
- Tailwind CSS integration (utility-first styling)
- Professional look out of the box
- Easy customization for desktop app needs

**Alternatives Considered:**
- Material-UI: Heavier bundle, less control over component source
- Ant Design: Too opinionated, web-focused
- Building from scratch: Too time-consuming for MVP

### Decision 3: pnpm for Package Management
**Rationale:**
- Faster than npm and yarn (efficient disk space usage via hard links)
- Strict dependency resolution prevents phantom dependencies
- Better monorepo support (useful if we expand to plugins later)
- Native workspace support and robust lockfile format
- Growing adoption in modern JavaScript tooling

**Alternatives Considered:**
- npm: Standard but slower, less efficient disk usage
- yarn: Better than npm but pnpm has superior performance and strictness
- bun: Too new, limited ecosystem support for desktop apps

### Decision 4: Biome for Linting and Formatting
**Rationale:**
- Single tool replaces ESLint + Prettier (simpler setup)
- Written in Rust (aligns with Tauri backend, very fast)
- Zero-config defaults work well for most projects
- Growing adoption in the ecosystem

**Alternatives Considered:**
- ESLint + Prettier: Standard but requires two tools, slower
- Rome (Biome's predecessor): Abandoned project
- TypeScript-only linting: Insufficient for style consistency

### Decision 5: File-Based Data Storage (Future-Proofing)
**Rationale:**
- Desktop app with local-only data (no server)
- JSON files are human-readable and easy to debug
- Portable across systems (users can backup/restore easily)
- No database installation or migration complexity

**Implementation Note:**
While data storage is not part of this change, we're setting up `.gitignore` patterns now to prevent accidentally committing user data or Firebase credentials.

## Risks / Trade-offs

### Risk 1: Tauri v2.x Maturity
**Concern:** Tauri v2 is relatively new, may have breaking changes or missing features
**Mitigation:**
- Tauri v2 is production-ready as of 2024
- Strong community support and active maintenance
- Can fall back to Tauri v1 if critical issues arise

### Risk 2: Firebase Admin SDK in Tauri Context
**Concern:** Firebase Admin SDK is Node.js-based, may complicate Rust backend integration
**Mitigation:**
- Node.js runtime can be bundled with Tauri app
- Alternative: Use HTTP requests to Firebase REST API from Rust
- This base setup allows either approach

### Risk 3: Learning Curve for Contributors
**Concern:** Tauri + React + Rust + shadcn/ui is a lot of technologies
**Mitigation:**
- Comprehensive CLAUDE.md and openspec/project.md documentation
- Most work will be in React (familiar to web developers)
- Rust backend will be minimal Tauri commands (not complex async Rust)

### Trade-off: Component Library Weight
**Trade-off:** shadcn/ui copies components into source code (increases repo size)
**Benefit:** Full control over components, no breaking changes from updates
**Acceptable:** Components are small, and we only install what we need

## Migration Plan

### Phase 1: Base Setup (This Change)
1. Initialize Tauri project with React + TypeScript
2. Configure Biome, Tailwind CSS, shadcn/ui
3. Create minimal UI to verify setup
4. Update documentation

### Phase 2: Core Features (Future Changes)
1. Implement project management (create, select, delete)
2. Implement device registry (add, edit, remove devices)
3. Implement message templates (create, edit, send)
4. Migrate FCM sending logic from `index.mjs`

### Phase 3: Polish (Future Changes)
1. Add send history and logs
2. Implement import/export functionality
3. Add dark mode support
4. Optimize performance

### Backward Compatibility
- `index.mjs` remains functional and uncommitted during all phases
- Users can continue using CLI script while desktop app is in development
- Once desktop app reaches feature parity, `index.mjs` will be marked deprecated

### Rollback Plan
If Tauri setup proves problematic:
1. Archive this change without merging
2. Consider alternative: Progressive Web App (PWA) with local storage
3. Reassess Electron as fallback option

## Open Questions

1. **Q: Should we bundle Node.js runtime with the app, or use Tauri's HTTP client for Firebase?**
   **Status:** Defer to implementation phase. Start with Node.js approach (matches legacy script), evaluate performance later.

2. **Q: What window size and resizable constraints should we set?**
   **Status:** Start with 1200x800px, resizable. Adjust based on UI development.

3. **Q: Should we include a system tray icon for quick access?**
   **Status:** Not in this change. Consider after core features are built.

4. **Q: Do we need auto-update functionality?**
   **Status:** Not in MVP. Future consideration once app is stable.
