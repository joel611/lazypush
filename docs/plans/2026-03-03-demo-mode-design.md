# Demo Mode Design

**Date:** 2026-03-03
**Feature:** `--demo` CLI flag

## Goal

Start lazypush with pre-populated fixture data (1 project, 3 environments, templates, devices) without needing real Firebase credentials. Send operations simulate realistic results instead of hitting FCM.

## Architecture

Two interface contracts replace direct imports of `config.ts` and `fcm.ts`:

```
src/lib/config-provider.ts   — ConfigProvider + SendProvider interfaces
src/lib/demo.ts              — DemoConfigProvider + MockSendProvider + fixture data
```

Existing implementations are wrapped:
- `config.ts` exports a `DiskConfigProvider` object
- `fcm.ts` exports a `RealSendProvider` object

The providers are selected in `index.tsx` based on `--demo` flag, passed as props to `App`, and distributed via SolidJS context (`useServices()` hook).

## Interfaces

### ConfigProvider

```ts
interface ConfigProvider {
  listProjects(): Project[]
  saveProject(p: Project): void
  deleteProject(id: string): void
  listEnvironments(projectId: string): Environment[]
  saveEnvironment(projectId: string, env: Environment): void
  deleteEnvironment(projectId: string, envId: string): void
  listDevices(projectId: string, envId: string): Device[]
  saveDevices(projectId: string, envId: string, devices: Device[]): void
  listTemplates(projectId: string): MessageTemplate[]
  saveTemplates(projectId: string, templates: MessageTemplate[]): void
  appendSendLog(projectId: string, envId: string, sessionFile: string, entry: SendLogEntry): void
  newSessionFileName(): string
}
```

### SendProvider

```ts
interface SendProvider {
  sendNotification(serviceAccountPath: string, devices: Device[], msg: FcmMessage): Promise<SendResult[]>
  sendToTopic(serviceAccountPath: string, topic: string, msg: FcmMessage): Promise<SendResult>
}
```

## Demo Fixture Data

- **Project:** "Demo App"
- **Environments:** "Development", "Staging", "Production"
- **Templates (per project):**
  - "Simple Notification" — title + body only
  - "Deep Link" — title + body + data `{ screen: "home" }`
  - "Data Only" — no notification, data payload only
- **Devices (per environment):** 4 devices — 2 iOS + 2 Android with fake tokens
- **MockSendProvider:** returns `{ success: true }` for all devices after 300ms delay

## Data Flow

```
index.tsx
  └─ parse --demo → select DemoConfigProvider / RealSendProvider
  └─ <App services={...} />
       └─ ServicesContext.Provider
            └─ useServices() in modals + app handlers
            └─ loadProjects(config), loadEnvironmentsForProject(config, id), etc.
```

## Files Changed

| File | Change |
|------|--------|
| `src/index.tsx` | Parse `--demo`, create providers, pass to `<App>` |
| `src/app.tsx` | Accept `services` prop, provide context, pass config to store loaders |
| `src/store.ts` | Load functions accept `ConfigProvider` param |
| `src/lib/config.ts` | Wrap as `DiskConfigProvider` |
| `src/lib/fcm.ts` | Wrap as `RealSendProvider` |
| `src/lib/config-provider.ts` | New — interfaces |
| `src/lib/demo.ts` | New — fixture data + demo providers |
| `src/components/modals/send-modal.tsx` | `useServices().send` |
| `src/components/modals/project-modal.tsx` | `useServices().config` |
| `src/components/modals/environment-modal.tsx` | `useServices().config` |
| `src/components/modals/device-modal.tsx` | `useServices().config` |
| `src/components/modals/template-modal.tsx` | `useServices().config` |

## Not Changed

`device-list`, `environment-list`, `project-list`, `template-list`, `debug-console`, `status-bar`, `message-modal` — read-only from store, no config/fcm imports.
