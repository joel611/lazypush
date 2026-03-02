# lazypush Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor FCM push notification tester from Tauri desktop app to `lazypush` — a Bun-native TUI using `@opentui/solid` with config at `~/.config/lazypush/`.

**Architecture:** SolidJS component tree rendered by `@opentui/solid` into the terminal. Keyboard events handled globally via `useKeyboard`. Config read/written as JSON files under `~/.config/lazypush/projects/[id]/`. Firebase Admin SDK called directly from Bun.

**Tech Stack:** Bun, `@opentui/solid`, `solid-js`, `firebase-admin`

---

## Task 1: Clean up old code

**Files:**
- Delete: `src/`, `src-tauri/`, `dist/`, `public/`
- Delete: `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `postcss.config.js`, `tailwind.config.js`, `biome.json`, `index.html`, `pnpm-lock.yaml`, `.npmrc`
- Modify: `package.json` (full rewrite)
- Modify: `.gitignore`

**Step 1: Delete old directories and files**

```bash
rm -rf src/ src-tauri/ dist/ public/
rm -f vite.config.ts tsconfig.json tsconfig.node.json postcss.config.js tailwind.config.js biome.json index.html pnpm-lock.yaml .npmrc
```

**Step 2: Rewrite `package.json`**

```json
{
  "name": "lazypush",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.tsx",
    "test": "bun test"
  },
  "dependencies": {
    "@opentui/solid": "latest",
    "firebase-admin": "^13",
    "solid-js": "^1"
  }
}
```

**Step 3: Update `.gitignore`**

Replace existing contents:

```gitignore
node_modules/
*.json.bak

# Firebase service account files — NEVER commit these
*-firebase-adminsdk-*.json
*-adminsdk-*.json
serviceAccount*.json
service-account*.json
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove tauri desktop app, prep for lazypush TUI"
```

---

## Task 2: Bootstrap Bun + @opentui/solid

**Files:**
- Create: `tsconfig.json`
- Create: `bunfig.toml`
- Create: `src/index.tsx`

**Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"]
}
```

**Step 2: Create `bunfig.toml`**

```toml
preload = ["@opentui/solid/preload"]
```

**Step 3: Install dependencies**

```bash
bun install
```

**Step 4: Create minimal `src/index.tsx`**

```tsx
import { render } from "@opentui/solid"

const App = () => (
  <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
    <text>lazypush starting...</text>
  </box>
)

render(() => <App />)
```

**Step 5: Run to verify it starts**

```bash
bun run src/index.tsx
```

Expected: Terminal clears and shows "lazypush starting..." — press Ctrl+C to exit.

**Step 6: Commit**

```bash
git add tsconfig.json bunfig.toml src/index.tsx package.json
git commit -m "feat: bootstrap bun + @opentui/solid entry point"
```

---

## Task 3: Define types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Create `src/lib/types.ts`**

```typescript
export interface Project {
  id: string
  name: string
  serviceAccountPath: string
  createdAt: string
}

export interface Device {
  id: string
  name: string
  platform: "ios" | "android"
  token: string
  createdAt: string
}

export interface FcmMessage {
  notification: {
    title: string
    body: string
    imageUrl?: string
  }
  data?: Record<string, string>
  android?: {
    priority?: "high" | "normal"
  }
  apns?: {
    headers?: Record<string, string>
    payload?: {
      aps?: {
        contentAvailable?: number
        mutableContent?: number
      }
    }
  }
}

export interface SendResult {
  deviceName: string
  token: string
  success: boolean
  error?: string
}

export type ModalState =
  | { type: "none" }
  | { type: "project"; project?: Project }
  | { type: "device"; device?: Device }
  | { type: "message" }
  | { type: "result"; results: SendResult[] }
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared types"
```

---

## Task 4: Config lib (read/write ~/.config/lazypush/)

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/config.test.ts`

**Step 1: Write the failing test first — `src/lib/config.test.ts`**

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { join } from "path"
import { rmSync, existsSync } from "fs"
import * as config from "./config"

// Use a temp dir for tests
const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config")

// Patch CONFIG_DIR for tests
config.__setConfigDir(TEST_CONFIG_DIR)

describe("config", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
  })

  afterEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
  })

  test("listProjects returns empty array when no projects exist", () => {
    expect(config.listProjects()).toEqual([])
  })

  test("saveProject creates config.json and listProjects returns it", () => {
    const project = {
      id: "test-id",
      name: "Test Project",
      serviceAccountPath: "/tmp/sa.json",
      createdAt: "2026-01-01T00:00:00Z",
    }
    config.saveProject(project)
    const projects = config.listProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toEqual(project)
  })

  test("deleteProject removes the project directory", () => {
    const project = {
      id: "del-id",
      name: "Delete Me",
      serviceAccountPath: "/tmp/sa.json",
      createdAt: "2026-01-01T00:00:00Z",
    }
    config.saveProject(project)
    config.deleteProject("del-id")
    expect(config.listProjects()).toEqual([])
  })

  test("listDevices returns empty array for new project", () => {
    expect(config.listDevices("no-project")).toEqual([])
  })

  test("saveDevices persists and listDevices returns them", () => {
    const devices = [
      {
        id: "d1",
        name: "My iPhone",
        platform: "ios" as const,
        token: "tok1",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]
    // need a project dir first
    config.saveProject({ id: "p1", name: "P", serviceAccountPath: "/tmp/sa.json", createdAt: "" })
    config.saveDevices("p1", devices)
    expect(config.listDevices("p1")).toEqual(devices)
  })
})
```

**Step 2: Run test to confirm it fails**

```bash
bun test src/lib/config.test.ts
```

Expected: FAIL — `config.ts` does not exist yet.

**Step 3: Create `src/lib/config.ts`**

```typescript
import { join } from "path"
import { homedir } from "os"
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs"
import type { Project, Device } from "./types"

let CONFIG_DIR = join(homedir(), ".config", "lazypush")
let PROJECTS_DIR = () => join(CONFIG_DIR, "projects")

/** For testing only — overrides the config directory */
export function __setConfigDir(dir: string) {
  CONFIG_DIR = dir
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true })
}

export function listProjects(): Project[] {
  const projectsDir = PROJECTS_DIR()
  if (!existsSync(projectsDir)) return []

  return readdirSync(projectsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      const configPath = join(projectsDir, e.name, "config.json")
      if (!existsSync(configPath)) return []
      try {
        return [JSON.parse(readFileSync(configPath, "utf-8")) as Project]
      } catch {
        return []
      }
    })
}

export function saveProject(project: Project): void {
  const dir = join(PROJECTS_DIR(), project.id)
  ensureDir(dir)
  writeFileSync(join(dir, "config.json"), JSON.stringify(project, null, 2))
}

export function deleteProject(id: string): void {
  const dir = join(PROJECTS_DIR(), id)
  if (existsSync(dir)) rmSync(dir, { recursive: true })
}

export function listDevices(projectId: string): Device[] {
  const path = join(PROJECTS_DIR(), projectId, "devices.json")
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Device[]
  } catch {
    return []
  }
}

export function saveDevices(projectId: string, devices: Device[]): void {
  const dir = join(PROJECTS_DIR(), projectId)
  ensureDir(dir)
  writeFileSync(join(dir, "devices.json"), JSON.stringify(devices, null, 2))
}
```

**Step 4: Run tests to confirm they pass**

```bash
bun test src/lib/config.test.ts
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts
git commit -m "feat: add config lib for reading/writing ~/.config/lazypush/"
```

---

## Task 5: FCM lib

**Files:**
- Create: `src/lib/fcm.ts`

> Note: FCM tests require a real Firebase project — skip unit tests here, tested via integration through the TUI.

**Step 1: Create `src/lib/fcm.ts`**

```typescript
import type { App } from "firebase-admin/app"
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { readFileSync } from "fs"
import type { FcmMessage, SendResult } from "./types"

// Cache apps by service account path to avoid re-initializing
const appCache = new Map<string, App>()

function getFirebaseApp(serviceAccountPath: string): App {
  if (appCache.has(serviceAccountPath)) {
    return appCache.get(serviceAccountPath)!
  }
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"))
  const appName = `lazypush-${serviceAccountPath}`
  const app = initializeApp({ credential: cert(serviceAccount) }, appName)
  appCache.set(serviceAccountPath, app)
  return app
}

export async function sendNotification(
  serviceAccountPath: string,
  devices: { name: string; token: string }[],
  message: FcmMessage
): Promise<SendResult[]> {
  const app = getFirebaseApp(serviceAccountPath)
  const response = await getMessaging(app).sendEachForMulticast({
    tokens: devices.map((d) => d.token),
    ...message,
  })

  return devices.map((device, i) => ({
    deviceName: device.name,
    token: device.token,
    success: response.responses[i].success,
    error: response.responses[i].error?.message,
  }))
}
```

**Step 2: Commit**

```bash
git add src/lib/fcm.ts
git commit -m "feat: add FCM send wrapper using firebase-admin"
```

---

## Task 6: Reactive store

**Files:**
- Create: `src/store.ts`

**Step 1: Create `src/store.ts`**

```typescript
import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { Project, Device, FcmMessage, ModalState } from "./lib/types"
import { listProjects, listDevices } from "./lib/config"

// Panel focus
export const [focused, setFocused] = createSignal<"projects" | "devices">("projects")

// Projects
export const [projects, setProjects] = createSignal<Project[]>([])
export const [projectIndex, setProjectIndex] = createSignal(0)
export const selectedProject = () => projects()[projectIndex()] ?? null

// Devices
export const [devices, setDevices] = createSignal<Device[]>([])
export const [deviceIndex, setDeviceIndex] = createSignal(0)
export const [selectedDeviceIds, setSelectedDeviceIds] = createSignal(new Set<string>())

// Modal
export const [modal, setModal] = createSignal<ModalState>({ type: "none" })

// Default message (edited in MessageModal, reused across sends)
export const [message, setMessage] = createStore<FcmMessage>({
  notification: { title: "", body: "" },
  data: {},
  android: { priority: "high" },
  apns: {
    headers: { "apns-priority": "10" },
    payload: { aps: { contentAvailable: 1, mutableContent: 1 } },
  },
})

export function loadProjects() {
  const ps = listProjects()
  setProjects(ps)
  setProjectIndex(0)
  if (ps.length > 0) loadDevicesForProject(ps[0].id)
}

export function loadDevicesForProject(projectId: string) {
  setDevices(listDevices(projectId))
  setDeviceIndex(0)
  setSelectedDeviceIds(new Set())
}

export function toggleDevice(id: string) {
  setSelectedDeviceIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}
```

**Step 2: Commit**

```bash
git add src/store.ts
git commit -m "feat: add SolidJS reactive store"
```

---

## Task 7: ProjectList component

**Files:**
- Create: `src/components/ProjectList.tsx`

**Step 1: Create `src/components/ProjectList.tsx`**

```tsx
import { For } from "solid-js"
import { projects, projectIndex, focused } from "../store"

interface Props {
  width: number
}

export const ProjectList = (props: Props) => {
  const isFocused = () => focused() === "projects"

  return (
    <box
      style={{
        width: props.width,
        height: "100%",
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Projects</text>
      <For each={projects()}>
        {(project, i) => (
          <text
            style={{
              color: i() === projectIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === projectIndex() ? "#00FFFF" : "transparent",
            }}
          >
            {i() === projectIndex() ? "> " : "  "}{project.name}
          </text>
        )}
      </For>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ProjectList.tsx
git commit -m "feat: add ProjectList component"
```

---

## Task 8: DeviceList component

**Files:**
- Create: `src/components/DeviceList.tsx`

**Step 1: Create `src/components/DeviceList.tsx`**

```tsx
import { For } from "solid-js"
import { devices, deviceIndex, selectedDeviceIds, focused } from "../store"

export const DeviceList = () => {
  const isFocused = () => focused() === "devices"

  return (
    <box
      style={{
        flexGrow: 1,
        height: "100%",
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Devices</text>
      <For each={devices()}>
        {(device, i) => {
          const isSelected = () => selectedDeviceIds().has(device.id)
          const isCurrent = () => i() === deviceIndex()
          return (
            <text
              style={{
                color: isCurrent() ? "#000000" : "#CCCCCC",
                backgroundColor: isCurrent() ? "#00FFFF" : "transparent",
              }}
            >
              {isSelected() ? "[x] " : "[ ] "}
              {device.name}
              <span style={{ color: "#888888" }}> ({device.platform})</span>
            </text>
          )
        }}
      </For>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/DeviceList.tsx
git commit -m "feat: add DeviceList component"
```

---

## Task 9: StatusBar component

**Files:**
- Create: `src/components/StatusBar.tsx`

**Step 1: Create `src/components/StatusBar.tsx`**

```tsx
import { focused, modal } from "../store"
import { Show } from "solid-js"

export const StatusBar = () => {
  const isModal = () => modal().type !== "none"
  const isProjects = () => focused() === "projects"

  return (
    <box
      style={{
        width: "100%",
        flexDirection: "column",
        padding: 1,
        backgroundColor: "#222222",
      }}
    >
      <Show when={!isModal()}>
        <text style={{ color: "#888888" }}>
          <span style={{ color: "#00FFFF" }}>tab</span>:switch
          <span style={{ color: "#00FFFF" }}> n</span>:new-project
          <span style={{ color: "#00FFFF" }}> a</span>:add-device
          <span style={{ color: "#00FFFF" }}> e</span>:edit
          <span style={{ color: "#FF4444" }}> D</span>:delete
          <span style={{ color: "#00FFFF" }}> m</span>:message
          <span style={{ color: "#00FF00" }}> s</span>:send
          <span style={{ color: "#FF4444" }}> q</span>:quit
        </text>
      </Show>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/StatusBar.tsx
git commit -m "feat: add StatusBar component"
```

---

## Task 10: ProjectModal

**Files:**
- Create: `src/components/modals/ProjectModal.tsx`

**Step 1: Create `src/components/modals/ProjectModal.tsx`**

```tsx
import { createSignal, onMount } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, loadProjects, projects, projectIndex } from "../../store"
import { saveProject } from "../../lib/config"
import type { Project } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  project?: Project
}

export const ProjectModal = (props: Props) => {
  const isEdit = !!props.project
  const [name, setName] = createSignal(props.project?.name ?? "")
  const [path, setPath] = createSignal(props.project?.serviceAccountPath ?? "")
  const [field, setField] = createSignal<"name" | "path">("name")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    if (!path().trim()) { setError("Service account path is required"); return }
    const project: Project = {
      id: props.project?.id ?? randomUUID(),
      name: name().trim(),
      serviceAccountPath: path().trim(),
      createdAt: props.project?.createdAt ?? new Date().toISOString(),
    }
    saveProject(project)
    loadProjects()
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "tab") { setField(f => f === "name" ? "path" : "name"); return }
    if (key.name === "return") {
      if (field() === "name") { setField("path"); return }
      submit()
      return
    }
    // Basic text editing for focused field
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else setPath(p => p.slice(0, -1))
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") setName(n => n + key.sequence)
      else setPath(p => p + key.sequence)
    }
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Project" : "New Project"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box style={{ borderStyle: "single", borderColor: field() === "name" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Service Account Path</text>
      <box style={{ borderStyle: "single", borderColor: field() === "path" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{path() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next field
        <span style={{ color: "#00FFFF" }}> enter</span>:confirm
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/ProjectModal.tsx
git commit -m "feat: add ProjectModal component"
```

---

## Task 11: DeviceModal

**Files:**
- Create: `src/components/modals/DeviceModal.tsx`

**Step 1: Create `src/components/modals/DeviceModal.tsx`**

```tsx
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, loadDevicesForProject, selectedProject } from "../../store"
import { listDevices, saveDevices } from "../../lib/config"
import type { Device } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  device?: Device
}

type Field = "name" | "platform" | "token"

export const DeviceModal = (props: Props) => {
  const isEdit = !!props.device
  const [name, setName] = createSignal(props.device?.name ?? "")
  const [platform, setPlatform] = createSignal<"ios" | "android">(props.device?.platform ?? "ios")
  const [token, setToken] = createSignal(props.device?.token ?? "")
  const [field, setField] = createSignal<Field>("name")
  const [error, setError] = createSignal("")

  const fields: Field[] = ["name", "platform", "token"]

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    if (!token().trim()) { setError("Token is required"); return }
    const project = selectedProject()
    if (!project) return
    const device: Device = {
      id: props.device?.id ?? randomUUID(),
      name: name().trim(),
      platform: platform(),
      token: token().trim(),
      createdAt: props.device?.createdAt ?? new Date().toISOString(),
    }
    const existing = listDevices(project.id)
    const updated = isEdit
      ? existing.map(d => d.id === device.id ? device : d)
      : [...existing, device]
    saveDevices(project.id, updated)
    loadDevicesForProject(project.id)
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "tab") {
      const idx = fields.indexOf(field())
      setField(fields[(idx + 1) % fields.length])
      return
    }
    if (key.name === "return") {
      const idx = fields.indexOf(field())
      if (idx < fields.length - 1) { setField(fields[idx + 1]); return }
      submit()
      return
    }
    if (field() === "platform") {
      if (key.name === "left" || key.name === "right") setPlatform(p => p === "ios" ? "android" : "ios")
      return
    }
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else if (field() === "token") setToken(t => t.slice(0, -1))
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") setName(n => n + key.sequence)
      else if (field() === "token") setToken(t => t + key.sequence)
    }
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "15%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Device" : "Add Device"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box style={{ borderStyle: "single", borderColor: field() === "name" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Platform</text>
      <box style={{ borderStyle: "single", borderColor: field() === "platform" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: platform() === "ios" ? "#00FFFF" : "#888888" }}>ios</text>
        <text style={{ color: "#888888" }}>  |  </text>
        <text style={{ color: platform() === "android" ? "#00FFFF" : "#888888" }}>android</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>FCM Token</text>
      <box style={{ borderStyle: "single", borderColor: field() === "token" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{token() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next
        <span style={{ color: "#00FFFF" }}> ←→</span>:toggle platform
        <span style={{ color: "#00FFFF" }}> enter</span>:confirm
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/DeviceModal.tsx
git commit -m "feat: add DeviceModal component"
```

---

## Task 12: MessageModal

**Files:**
- Create: `src/components/modals/MessageModal.tsx`

**Step 1: Create `src/components/modals/MessageModal.tsx`**

```tsx
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, message, setMessage } from "../../store"

type Field = "title" | "body" | "data"

export const MessageModal = () => {
  const [field, setField] = createSignal<Field>("title")
  const [dataStr, setDataStr] = createSignal(
    Object.keys(message.data ?? {}).length > 0
      ? JSON.stringify(message.data, null, 2)
      : ""
  )
  const [error, setError] = createSignal("")

  const fields: Field[] = ["title", "body", "data"]

  function save() {
    let data: Record<string, string> | undefined
    if (dataStr().trim()) {
      try {
        data = JSON.parse(dataStr().trim())
      } catch {
        setError("data must be valid JSON")
        return
      }
    }
    setMessage("notification", "title", message.notification.title)
    setMessage("notification", "body", message.notification.body)
    setMessage("data", data ?? {})
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "tab") {
      const idx = fields.indexOf(field())
      setField(fields[(idx + 1) % fields.length])
      return
    }
    if (key.name === "return" && field() !== "data") {
      const idx = fields.indexOf(field())
      if (idx < fields.length - 1) { setField(fields[idx + 1]); return }
      save()
      return
    }
    // ctrl+s saves from any field
    if (key.ctrl && key.name === "s") { save(); return }

    if (key.name === "backspace") {
      if (field() === "title") setMessage("notification", "title", message.notification.title.slice(0, -1))
      else if (field() === "body") setMessage("notification", "body", message.notification.body.slice(0, -1))
      else if (field() === "data") setDataStr(d => d.slice(0, -1))
    } else if (key.sequence && !key.ctrl) {
      const char = field() === "data" && key.name === "return" ? "\n" : key.sequence
      if (char.length === 1 || (field() === "data" && char === "\n")) {
        if (field() === "title") setMessage("notification", "title", message.notification.title + char)
        else if (field() === "body") setMessage("notification", "body", message.notification.body + char)
        else if (field() === "data") setDataStr(d => d + char)
      }
    }
  })

  const active = (f: Field) => field() === f ? "#00FFFF" : "#444444"

  return (
    <box
      style={{
        position: "absolute",
        top: "10%",
        left: "15%",
        width: "70%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Compose Message</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Title</text>
      <box style={{ borderStyle: "single", borderColor: active("title"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{message.notification.title || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Body</text>
      <box style={{ borderStyle: "single", borderColor: active("body"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{message.notification.body || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Data (JSON)</text>
      <box style={{ borderStyle: "single", borderColor: active("data"), padding: 1, height: 5 }}>
        <text style={{ color: "#FFFFFF" }}>{dataStr() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next field
        <span style={{ color: "#00FFFF" }}> ctrl+s</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/MessageModal.tsx
git commit -m "feat: add MessageModal component"
```

---

## Task 13: ResultModal

**Files:**
- Create: `src/components/modals/ResultModal.tsx`

**Step 1: Create `src/components/modals/ResultModal.tsx`**

```tsx
import { For } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal } from "../../store"
import type { SendResult } from "../../lib/types"

interface Props {
  results: SendResult[]
}

export const ResultModal = (props: Props) => {
  const successCount = () => props.results.filter(r => r.success).length

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "return" || key.name === "q") {
      setModal({ type: "none" })
    }
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: successCount() === props.results.length ? "#00FF00" : "#FF4444",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>
        Send Results — {successCount()}/{props.results.length} succeeded
      </text>
      <For each={props.results}>
        {(result) => (
          <text style={{ marginTop: 1, color: result.success ? "#00FF00" : "#FF4444" }}>
            {result.success ? "✓" : "✗"} {result.deviceName}
            {result.error ? `: ${result.error}` : ""}
          </text>
        )}
      </For>
      <text style={{ color: "#888888", marginTop: 2 }}>
        <span style={{ color: "#00FFFF" }}>enter/esc</span>:close
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/ResultModal.tsx
git commit -m "feat: add ResultModal component"
```

---

## Task 14: App.tsx — main layout and keyboard routing

**Files:**
- Create: `src/App.tsx`

**Step 1: Create `src/App.tsx`**

```tsx
import { Show } from "solid-js"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import {
  focused, setFocused,
  projects, projectIndex, setProjectIndex, selectedProject,
  devices, deviceIndex, setDeviceIndex,
  toggleDevice, selectedDeviceIds,
  modal, setModal,
  message,
  loadProjects, loadDevicesForProject,
} from "./store"
import { ProjectList } from "./components/ProjectList"
import { DeviceList } from "./components/DeviceList"
import { StatusBar } from "./components/StatusBar"
import { ProjectModal } from "./components/modals/ProjectModal"
import { DeviceModal } from "./components/modals/DeviceModal"
import { MessageModal } from "./components/modals/MessageModal"
import { ResultModal } from "./components/modals/ResultModal"
import { deleteProject, listDevices, saveDevices } from "./lib/config"
import { sendNotification } from "./lib/fcm"

export const App = () => {
  const dims = useTerminalDimensions()

  // Load data on mount
  loadProjects()

  useKeyboard((key) => {
    // Block all navigation when a modal is open
    if (modal().type !== "none") return

    if (key.name === "q") process.exit(0)

    if (key.name === "tab") {
      setFocused(f => f === "projects" ? "devices" : "projects")
      return
    }

    // Project panel navigation
    if (focused() === "projects") {
      if (key.name === "up") {
        setProjectIndex(i => Math.max(0, i - 1))
        const proj = projects()[Math.max(0, projectIndex() - 1)]
        if (proj) loadDevicesForProject(proj.id)
      }
      if (key.name === "down") {
        setProjectIndex(i => Math.min(projects().length - 1, i + 1))
        const proj = projects()[Math.min(projects().length - 1, projectIndex() + 1)]
        if (proj) loadDevicesForProject(proj.id)
      }
      if (key.name === "n") setModal({ type: "project" })
      if (key.name === "e" && selectedProject()) setModal({ type: "project", project: selectedProject()! })
      if (key.name === "D" && selectedProject()) {
        deleteProject(selectedProject()!.id)
        loadProjects()
      }
    }

    // Device panel navigation
    if (focused() === "devices") {
      if (key.name === "up") setDeviceIndex(i => Math.max(0, i - 1))
      if (key.name === "down") setDeviceIndex(i => Math.min(devices().length - 1, i + 1))
      if (key.name === "space") {
        const dev = devices()[deviceIndex()]
        if (dev) toggleDevice(dev.id)
      }
      if (key.name === "a" && selectedProject()) setModal({ type: "device" })
      if (key.name === "e") {
        const dev = devices()[deviceIndex()]
        if (dev) setModal({ type: "device", device: dev })
      }
      if (key.name === "D") {
        const proj = selectedProject()
        if (!proj) return
        const dev = devices()[deviceIndex()]
        if (!dev) return
        const updated = devices().filter(d => d.id !== dev.id)
        saveDevices(proj.id, updated)
        loadDevicesForProject(proj.id)
      }
    }

    // Global
    if (key.name === "m") setModal({ type: "message" })

    if (key.name === "s" || key.name === "return") {
      const proj = selectedProject()
      if (!proj) return
      const targets = devices().filter(d => selectedDeviceIds().has(d.id))
      if (targets.length === 0) return
      sendNotification(proj.serviceAccountPath, targets, message)
        .then(results => setModal({ type: "result", results }))
        .catch(err => setModal({ type: "result", results: [{ deviceName: "Error", token: "", success: false, error: String(err) }] }))
    }
  })

  const projectPanelWidth = Math.floor((dims().width ?? 80) * 0.35)

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        <ProjectList width={projectPanelWidth} />
        <DeviceList />
      </box>
      <StatusBar />

      <Show when={modal().type === "project"}>
        <ProjectModal project={(modal() as any).project} />
      </Show>
      <Show when={modal().type === "device"}>
        <DeviceModal device={(modal() as any).device} />
      </Show>
      <Show when={modal().type === "message"}>
        <MessageModal />
      </Show>
      <Show when={modal().type === "result"}>
        <ResultModal results={(modal() as any).results} />
      </Show>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add App layout with keyboard routing and modal wiring"
```

---

## Task 15: Wire up index.tsx and smoke test

**Files:**
- Modify: `src/index.tsx`

**Step 1: Update `src/index.tsx`**

```tsx
import { render } from "@opentui/solid"
import { App } from "./App"

render(() => <App />)
```

**Step 2: Run and smoke test**

```bash
bun run src/index.tsx
```

Walk through these manually:

1. App starts — shows empty Projects and Devices panels
2. Press `n` — ProjectModal opens
3. Tab to path field, enter a service account path, press Enter — project saved, appears in list
4. Press `a` — DeviceModal opens
5. Fill name, toggle platform with `←→`, enter token — device saved
6. Press `Space` on device to select it (checkbox fills)
7. Press `m` — MessageModal opens, fill title/body, Ctrl+S to save
8. Press `s` — sends notification, ResultModal shows success/failure
9. Press `Esc` — result closes
10. Press `q` — exits

**Step 3: Commit**

```bash
git add src/index.tsx
git commit -m "feat: finalize entry point, lazypush MVP complete"
```

---

## Task 16: Update project metadata

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Rewrite `CLAUDE.md` header section**

Replace the Project Overview section to reflect the new stack:

```markdown
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
```

**Step 2: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README for lazypush TUI"
```

---

## Done

The MVP is complete when:
- `bun run src/index.tsx` launches the TUI
- Projects and devices can be added/edited/deleted from the TUI
- A notification can be sent and results shown
- Config persists between runs in `~/.config/lazypush/`
