# Environments, Templates & Debug Console Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-project environments (each with own service account + devices), per-project message templates, topic/all send targets, and a persistent debug console that logs to disk.

**Architecture:** Storage moves from `projects/[id]/devices.json` to `projects/[id]/environments/[env-id]/devices.json`. Templates live at `projects/[id]/templates.json`. Send logs persist at `projects/[id]/environments/[env-id]/sessions/YYYY-MM-DD_HH-mm-ss.json`. The UI layout becomes a 5-panel design: left column (Templates | Environments | Projects stacked top-to-bottom), right column (Devices | DebugConsole stacked top-to-bottom). `ResultModal` is removed; results stream to `DebugConsole`.

**Tech Stack:** Bun, @opentui/solid (SolidJS reconciler for terminal), firebase-admin, bun:test

---

## Task 1: Update Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Replace the file contents**

```typescript
export interface Project {
  id: string
  name: string
  createdAt: string
}

export interface Environment {
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

export interface MessageTemplate {
  id: string
  name: string
  message: FcmMessage
  createdAt: string
}

export type SendTargetType = "devices" | "topic" | "all"

export interface SendLogEntry {
  timestamp: string
  templateName?: string
  targetType: SendTargetType
  targetInfo: string   // comma-joined device names, topic string, or "all"
  results: SendResult[]
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
  | { type: "environment"; environment?: Environment }
  | { type: "template"; template?: MessageTemplate }
  | { type: "device"; device?: Device }
  | { type: "message" }
  | { type: "send" }
```

**Step 2: Verify TypeScript compiles**

```bash
bun run --watch false src/index.tsx 2>&1 | head -20
```

Expected: no type errors (or only errors in files we haven't updated yet — those are fine for now).

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: update types for environments, templates, send log"
```

---

## Task 2: Rewrite config.ts — projects + environments + devices

**Files:**
- Modify: `src/lib/config.ts`
- Modify: `src/lib/config.test.ts`

**Step 1: Write the failing tests first**

Replace `src/lib/config.test.ts` entirely:

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { join } from "path"
import { rmSync } from "fs"
import * as config from "./config"

const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config")
config.__setConfigDir(TEST_CONFIG_DIR)

const PROJECT = { id: "p1", name: "My App", createdAt: "2026-01-01T00:00:00Z" }
const ENV = { id: "e1", name: "dev", serviceAccountPath: "/tmp/sa.json", createdAt: "2026-01-01T00:00:00Z" }
const DEVICE = { id: "d1", name: "iPhone", platform: "ios" as const, token: "tok1", createdAt: "2026-01-01T00:00:00Z" }

describe("config — projects", () => {
  beforeEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))

  test("listProjects returns [] when none exist", () => {
    expect(config.listProjects()).toEqual([])
  })

  test("saveProject + listProjects round-trips", () => {
    config.saveProject(PROJECT)
    expect(config.listProjects()).toEqual([PROJECT])
  })

  test("deleteProject removes the project", () => {
    config.saveProject(PROJECT)
    config.deleteProject("p1")
    expect(config.listProjects()).toEqual([])
  })

  test("listProjects migrates old format (serviceAccountPath in config.json)", () => {
    // Write old-format project manually
    const { mkdirSync, writeFileSync } = require("fs")
    const { join: pjoin } = require("path")
    const dir = pjoin(TEST_CONFIG_DIR, "projects", "old-p")
    mkdirSync(dir, { recursive: true })
    writeFileSync(pjoin(dir, "config.json"), JSON.stringify({
      id: "old-p", name: "Old", serviceAccountPath: "/tmp/old.json", createdAt: "2026-01-01T00:00:00Z"
    }))

    const projects = config.listProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toEqual({ id: "old-p", name: "Old", createdAt: "2026-01-01T00:00:00Z" })

    // Migration: default environment should have been created
    const envs = config.listEnvironments("old-p")
    expect(envs).toHaveLength(1)
    expect(envs[0].name).toBe("default")
    expect(envs[0].serviceAccountPath).toBe("/tmp/old.json")
  })
})

describe("config — environments", () => {
  beforeEach(() => { rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }); config.saveProject(PROJECT) })
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))

  test("listEnvironments returns [] for new project", () => {
    expect(config.listEnvironments("p1")).toEqual([])
  })

  test("saveEnvironment + listEnvironments round-trips", () => {
    config.saveEnvironment("p1", ENV)
    expect(config.listEnvironments("p1")).toEqual([ENV])
  })

  test("deleteEnvironment removes it", () => {
    config.saveEnvironment("p1", ENV)
    config.deleteEnvironment("p1", "e1")
    expect(config.listEnvironments("p1")).toEqual([])
  })
})

describe("config — devices (per env)", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    config.saveProject(PROJECT)
    config.saveEnvironment("p1", ENV)
  })
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))

  test("listDevices returns [] for new env", () => {
    expect(config.listDevices("p1", "e1")).toEqual([])
  })

  test("saveDevices + listDevices round-trips", () => {
    config.saveDevices("p1", "e1", [DEVICE])
    expect(config.listDevices("p1", "e1")).toEqual([DEVICE])
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
bun test src/lib/config.test.ts
```

Expected: FAIL — `listEnvironments is not a function`, `saveEnvironment is not a function`, etc.

**Step 3: Rewrite config.ts**

```typescript
import { join } from "path"
import { homedir } from "os"
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs"
import type { Project, Environment, Device } from "./types"

let CONFIG_DIR = join(homedir(), ".config", "lazypush")
const PROJECTS_DIR = () => join(CONFIG_DIR, "projects")
const ENV_DIR = (projectId: string, envId: string) =>
  join(PROJECTS_DIR(), projectId, "environments", envId)

/** For testing only */
export function __setConfigDir(dir: string) {
  CONFIG_DIR = dir
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true })
}

function safeReadJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, "utf-8")) as T } catch { return null }
}

// ─── Migration ────────────────────────────────────────────────────────────────

type LegacyProject = Project & { serviceAccountPath?: string }

function migrateProjectIfNeeded(raw: LegacyProject): Project {
  if (!raw.serviceAccountPath) return raw
  // Create default environment
  const envId = "env-default"
  const envDir = ENV_DIR(raw.id, envId)
  ensureDir(envDir)
  const envConfig: Environment = {
    id: envId,
    name: "default",
    serviceAccountPath: raw.serviceAccountPath,
    createdAt: raw.createdAt,
  }
  writeFileSync(join(envDir, "config.json"), JSON.stringify(envConfig, null, 2))
  // Rewrite project config without serviceAccountPath
  const { serviceAccountPath: _, ...clean } = raw
  const projectDir = join(PROJECTS_DIR(), raw.id)
  writeFileSync(join(projectDir, "config.json"), JSON.stringify(clean, null, 2))
  return clean
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function listProjects(): Project[] {
  const dir = PROJECTS_DIR()
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      const raw = safeReadJson<LegacyProject>(join(dir, e.name, "config.json"))
      if (!raw) return []
      return [migrateProjectIfNeeded(raw)]
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

// ─── Environments ─────────────────────────────────────────────────────────────

export function listEnvironments(projectId: string): Environment[] {
  const envsDir = join(PROJECTS_DIR(), projectId, "environments")
  if (!existsSync(envsDir)) return []
  return readdirSync(envsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      const cfg = safeReadJson<Environment>(join(envsDir, e.name, "config.json"))
      return cfg ? [cfg] : []
    })
}

export function saveEnvironment(projectId: string, env: Environment): void {
  const dir = ENV_DIR(projectId, env.id)
  ensureDir(dir)
  writeFileSync(join(dir, "config.json"), JSON.stringify(env, null, 2))
}

export function deleteEnvironment(projectId: string, envId: string): void {
  const dir = ENV_DIR(projectId, envId)
  if (existsSync(dir)) rmSync(dir, { recursive: true })
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export function listDevices(projectId: string, envId: string): Device[] {
  const path = join(ENV_DIR(projectId, envId), "devices.json")
  return safeReadJson<Device[]>(path) ?? []
}

export function saveDevices(projectId: string, envId: string, devices: Device[]): void {
  const dir = ENV_DIR(projectId, envId)
  ensureDir(dir)
  writeFileSync(join(dir, "devices.json"), JSON.stringify(devices, null, 2))
}
```

**Step 4: Run tests**

```bash
bun test src/lib/config.test.ts
```

Expected: all PASS.

**Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts
git commit -m "feat: add environments CRUD, per-env devices, old-format migration"
```

---

## Task 3: Add templates + session logging to config.ts

**Files:**
- Modify: `src/lib/config.ts`
- Modify: `src/lib/config.test.ts`

**Step 1: Add tests to `config.test.ts`**

Append these two describe blocks to the existing file:

```typescript
describe("config — templates", () => {
  beforeEach(() => { rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }); config.saveProject(PROJECT) })
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))

  test("listTemplates returns [] for new project", () => {
    expect(config.listTemplates("p1")).toEqual([])
  })

  test("saveTemplates + listTemplates round-trips", () => {
    const tpl = {
      id: "t1",
      name: "Login push",
      message: { notification: { title: "Hi", body: "Hello" } },
      createdAt: "2026-01-01T00:00:00Z",
    }
    config.saveTemplates("p1", [tpl])
    expect(config.listTemplates("p1")).toEqual([tpl])
  })
})

describe("config — session logging", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    config.saveProject(PROJECT)
    config.saveEnvironment("p1", ENV)
  })
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }))

  test("appendSendLog creates file and accumulates entries", () => {
    const entry1 = {
      timestamp: "2026-01-01T14:00:00Z",
      targetType: "devices" as const,
      targetInfo: "iPhone",
      results: [{ deviceName: "iPhone", token: "tok", success: true }],
    }
    const entry2 = { ...entry1, timestamp: "2026-01-01T14:01:00Z" }
    const file = "2026-01-01_14-00-00.json"

    config.appendSendLog("p1", "e1", file, entry1)
    config.appendSendLog("p1", "e1", file, entry2)

    const log = config.readSendLog("p1", "e1", file)
    expect(log).toHaveLength(2)
    expect(log[0].timestamp).toBe("2026-01-01T14:00:00Z")
  })

  test("newSessionFileName returns a filename matching pattern", () => {
    expect(config.newSessionFileName()).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/)
  })
})
```

**Step 2: Run to confirm fail**

```bash
bun test src/lib/config.test.ts
```

Expected: FAIL — `listTemplates`, `appendSendLog`, `readSendLog`, `newSessionFileName` not found.

**Step 3: Add to config.ts**

Append to the end of `src/lib/config.ts`:

```typescript
// ─── Templates ────────────────────────────────────────────────────────────────

import type { MessageTemplate, SendLogEntry } from "./types"

export function listTemplates(projectId: string): MessageTemplate[] {
  const path = join(PROJECTS_DIR(), projectId, "templates.json")
  return safeReadJson<MessageTemplate[]>(path) ?? []
}

export function saveTemplates(projectId: string, templates: MessageTemplate[]): void {
  const dir = join(PROJECTS_DIR(), projectId)
  ensureDir(dir)
  writeFileSync(join(dir, "templates.json"), JSON.stringify(templates, null, 2))
}

// ─── Session Logging ──────────────────────────────────────────────────────────

export function newSessionFileName(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.json`
}

export function appendSendLog(
  projectId: string,
  envId: string,
  sessionFile: string,
  entry: SendLogEntry
): void {
  const dir = join(ENV_DIR(projectId, envId), "sessions")
  ensureDir(dir)
  const path = join(dir, sessionFile)
  const existing = safeReadJson<SendLogEntry[]>(path) ?? []
  writeFileSync(path, JSON.stringify([...existing, entry], null, 2))
}

export function readSendLog(projectId: string, envId: string, sessionFile: string): SendLogEntry[] {
  const path = join(ENV_DIR(projectId, envId), "sessions", sessionFile)
  return safeReadJson<SendLogEntry[]>(path) ?? []
}
```

Note: The `import type` at the top of the append block must actually move to the top of the file. In the actual edit, add `MessageTemplate, SendLogEntry` to the existing import line at line 4.

**Step 4: Run tests**

```bash
bun test src/lib/config.test.ts
```

Expected: all PASS.

**Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts
git commit -m "feat: add template CRUD and session log persistence"
```

---

## Task 4: Update fcm.ts — add topic and all-devices send

**Files:**
- Modify: `src/lib/fcm.ts`

**Step 1: Add `sendToTopic` and update the import**

Replace `src/lib/fcm.ts` entirely:

```typescript
import type { App } from "firebase-admin/app"
import { initializeApp, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { readFileSync } from "fs"
import type { FcmMessage, SendResult } from "./types"

const appCache = new Map<string, App>()

function getFirebaseApp(serviceAccountPath: string): App {
  if (appCache.has(serviceAccountPath)) return appCache.get(serviceAccountPath)!
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"))
  const app = initializeApp({ credential: cert(serviceAccount) }, `lazypush-${serviceAccountPath}`)
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

export async function sendToTopic(
  serviceAccountPath: string,
  topic: string,
  message: FcmMessage
): Promise<SendResult> {
  const app = getFirebaseApp(serviceAccountPath)
  try {
    await getMessaging(app).send({ topic, ...message })
    return { deviceName: `topic:${topic}`, token: "", success: true }
  } catch (err) {
    return { deviceName: `topic:${topic}`, token: "", success: false, error: String(err) }
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/fcm.ts
git commit -m "feat: add sendToTopic for FCM topic messaging"
```

---

## Task 5: Rewrite store.ts

**Files:**
- Modify: `src/store.ts`

**Step 1: Replace store.ts entirely**

```typescript
import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { Project, Environment, Device, MessageTemplate, FcmMessage, ModalState, SendLogEntry } from "./lib/types"
import {
  listProjects, listEnvironments, listDevices, listTemplates,
  newSessionFileName,
} from "./lib/config"

// Panel focus — tab cycles in this order
export type FocusPanel = "projects" | "environments" | "templates" | "devices" | "console"
export const [focused, setFocused] = createSignal<FocusPanel>("projects")

// Projects
export const [projects, setProjects] = createSignal<Project[]>([])
export const [projectIndex, setProjectIndex] = createSignal(0)
export const selectedProject = () => projects()[projectIndex()] ?? null

// Environments
export const [environments, setEnvironments] = createSignal<Environment[]>([])
export const [environmentIndex, setEnvironmentIndex] = createSignal(0)
export const selectedEnvironment = () => environments()[environmentIndex()] ?? null

// Templates
export const [templates, setTemplates] = createSignal<MessageTemplate[]>([])
export const [templateIndex, setTemplateIndex] = createSignal(0)
export const selectedTemplate = () => templates()[templateIndex()] ?? null

// Devices
export const [devices, setDevices] = createSignal<Device[]>([])
export const [deviceIndex, setDeviceIndex] = createSignal(0)
export const [selectedDeviceIds, setSelectedDeviceIds] = createSignal(new Set<string>())

// Modal
export const [modal, setModal] = createSignal<ModalState>({ type: "none" })

// Message being composed (one-off or loaded from template)
export const [message, setMessage] = createStore<FcmMessage>({
  notification: { title: "", body: "" },
  data: {},
  android: { priority: "high" },
  apns: {
    headers: { "apns-priority": "10" },
    payload: { aps: { contentAvailable: 1, mutableContent: 1 } },
  },
})

// Debug console
export const [sendLog, setSendLog] = createSignal<SendLogEntry[]>([])
export const [consoleOffset, setConsoleOffset] = createSignal(0)

// Session file (created once per run on first send)
let _sessionFile: string | null = null
export function getOrCreateSessionFile(): string {
  if (!_sessionFile) _sessionFile = newSessionFileName()
  return _sessionFile
}

// ─── Load functions ───────────────────────────────────────────────────────────

export function loadProjects() {
  const ps = listProjects()
  setProjects(ps)
  setProjectIndex(0)
  setEnvironments([])
  setEnvironmentIndex(0)
  setDevices([])
  setSelectedDeviceIds(new Set())
  if (ps.length > 0) loadEnvironmentsForProject(ps[0].id)
}

export function loadEnvironmentsForProject(projectId: string) {
  const envs = listEnvironments(projectId)
  setEnvironments(envs)
  setEnvironmentIndex(0)
  setDevices([])
  setSelectedDeviceIds(new Set())
  loadTemplatesForProject(projectId)
  if (envs.length > 0) loadDevicesForEnvironment(projectId, envs[0].id)
}

export function loadTemplatesForProject(projectId: string) {
  setTemplates(listTemplates(projectId))
  setTemplateIndex(0)
}

export function loadDevicesForEnvironment(projectId: string, envId: string) {
  setDevices(listDevices(projectId, envId))
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

export function appendToSendLog(entry: SendLogEntry) {
  setSendLog((prev) => [...prev, entry])
  // Scroll console to bottom
  setConsoleOffset(sendLog().length - 1)
}
```

**Step 2: Verify no syntax errors**

```bash
bun run --watch false src/index.tsx 2>&1 | head -30
```

Expected: type errors only in files not yet updated (App.tsx, components), not in store.ts itself.

**Step 3: Commit**

```bash
git add src/store.ts
git commit -m "feat: expand store for environments, templates, send log, 5-panel focus"
```

---

## Task 6: Update ProjectModal — remove serviceAccountPath field

**Files:**
- Modify: `src/components/modals/ProjectModal.tsx`

**Step 1: Replace ProjectModal.tsx**

```typescript
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, loadProjects } from "../../store"
import { saveProject } from "../../lib/config"
import type { Project } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  project?: Project
}

export const ProjectModal = (props: Props) => {
  const isEdit = !!props.project
  const [name, setName] = createSignal(props.project?.name ?? "")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    const project: Project = {
      id: props.project?.id ?? randomUUID(),
      name: name().trim(),
      createdAt: props.project?.createdAt ?? new Date().toISOString(),
    }
    saveProject(project)
    loadProjects()
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "return") { submit(); return }
    if (key.name === "backspace") setName(n => n.slice(0, -1))
    else if (key.sequence && key.sequence.length === 1 && !key.ctrl) setName(n => n + key.sequence)
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "30%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Project" : "New Project"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box style={{ borderStyle: "single", borderColor: "#00FFFF", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>enter</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/ProjectModal.tsx
git commit -m "feat: simplify ProjectModal (name only, no service account)"
```

---

## Task 7: Add EnvironmentModal

**Files:**
- Create: `src/components/modals/EnvironmentModal.tsx`

**Step 1: Create the file**

```typescript
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, selectedProject, loadEnvironmentsForProject } from "../../store"
import { saveEnvironment } from "../../lib/config"
import type { Environment } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  environment?: Environment
}

type Field = "name" | "path"

export const EnvironmentModal = (props: Props) => {
  const isEdit = !!props.environment
  const [name, setName] = createSignal(props.environment?.name ?? "")
  const [path, setPath] = createSignal(props.environment?.serviceAccountPath ?? "")
  const [field, setField] = createSignal<Field>("name")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    if (!path().trim()) { setError("Service account path is required"); return }
    const proj = selectedProject()
    if (!proj) return
    const env: Environment = {
      id: props.environment?.id ?? randomUUID(),
      name: name().trim(),
      serviceAccountPath: path().trim(),
      createdAt: props.environment?.createdAt ?? new Date().toISOString(),
    }
    saveEnvironment(proj.id, env)
    loadEnvironmentsForProject(proj.id)
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
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else setPath(p => p.slice(0, -1))
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") setName(n => n + key.sequence)
      else setPath(p => p + key.sequence)
    }
  })

  const active = (f: Field) => field() === f ? "#00FFFF" : "#444444"

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "15%",
        width: "70%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Environment" : "New Environment"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name (e.g. dev, uat, prod)</text>
      <box style={{ borderStyle: "single", borderColor: active("name"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Service Account Path</text>
      <box style={{ borderStyle: "single", borderColor: active("path"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{path() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next
        <span style={{ color: "#00FFFF" }}> enter</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/EnvironmentModal.tsx
git commit -m "feat: add EnvironmentModal"
```

---

## Task 8: Add TemplateModal

**Files:**
- Create: `src/components/modals/TemplateModal.tsx`

**Step 1: Create the file**

```typescript
import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, selectedProject, templates, loadTemplatesForProject, message } from "../../store"
import { saveTemplates } from "../../lib/config"
import type { MessageTemplate } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  template?: MessageTemplate
}

type Field = "name" | "title" | "body" | "data"

export const TemplateModal = (props: Props) => {
  const isEdit = !!props.template
  const [name, setName] = createSignal(props.template?.name ?? "")
  const [title, setTitle] = createSignal(props.template?.message.notification.title ?? message.notification.title)
  const [body, setBody] = createSignal(props.template?.message.notification.body ?? message.notification.body)
  const [dataStr, setDataStr] = createSignal(
    props.template?.message.data ? JSON.stringify(props.template.message.data, null, 2) : ""
  )
  const [field, setField] = createSignal<Field>("name")
  const [error, setError] = createSignal("")

  const fields: Field[] = ["name", "title", "body", "data"]

  function submit() {
    if (!name().trim()) { setError("Template name is required"); return }
    let data: Record<string, string> | undefined
    if (dataStr().trim()) {
      try { data = JSON.parse(dataStr().trim()) } catch { setError("data must be valid JSON"); return }
    }
    const proj = selectedProject()
    if (!proj) return
    const tpl: MessageTemplate = {
      id: props.template?.id ?? randomUUID(),
      name: name().trim(),
      message: {
        notification: { title: title(), body: body() },
        data,
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" }, payload: { aps: { contentAvailable: 1, mutableContent: 1 } } },
      },
      createdAt: props.template?.createdAt ?? new Date().toISOString(),
    }
    const updated = isEdit
      ? templates().map(t => t.id === tpl.id ? tpl : t)
      : [...templates(), tpl]
    saveTemplates(proj.id, updated)
    loadTemplatesForProject(proj.id)
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.ctrl && key.name === "s") { submit(); return }
    if (key.name === "tab") {
      const idx = fields.indexOf(field())
      setField(fields[(idx + 1) % fields.length])
      return
    }
    if (key.name === "return" && field() !== "data") {
      const idx = fields.indexOf(field())
      if (idx < fields.length - 1) { setField(fields[idx + 1]); return }
      submit(); return
    }
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else if (field() === "title") setTitle(t => t.slice(0, -1))
      else if (field() === "body") setBody(b => b.slice(0, -1))
      else if (field() === "data") setDataStr(d => d.slice(0, -1))
    } else if (key.sequence && !key.ctrl) {
      const char = field() === "data" && key.name === "return" ? "\n" : key.sequence
      if (char.length === 1 || (field() === "data" && char === "\n")) {
        if (field() === "name") setName(n => n + char)
        else if (field() === "title") setTitle(t => t + char)
        else if (field() === "body") setBody(b => b + char)
        else if (field() === "data") setDataStr(d => d + char)
      }
    }
  })

  const active = (f: Field) => field() === f ? "#00FFFF" : "#444444"

  return (
    <box
      style={{
        position: "absolute",
        top: "5%",
        left: "10%",
        width: "80%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#FFAA00",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Template" : "New Template"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Template Name</text>
      <box style={{ borderStyle: "single", borderColor: active("name"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Notification Title</text>
      <box style={{ borderStyle: "single", borderColor: active("title"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{title() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Notification Body</text>
      <box style={{ borderStyle: "single", borderColor: active("body"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{body() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Data (JSON)</text>
      <box style={{ borderStyle: "single", borderColor: active("data"), padding: 1, height: 4 }}>
        <text style={{ color: "#FFFFFF" }}>{dataStr() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#FFAA00" }}>tab</span>:next
        <span style={{ color: "#FFAA00" }}> ctrl+s</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/TemplateModal.tsx
git commit -m "feat: add TemplateModal for creating and editing message templates"
```

---

## Task 9: Add SendModal

**Files:**
- Create: `src/components/modals/SendModal.tsx`

**Step 1: Create the file**

The SendModal presents three options: selected devices, topic, all devices. If "topic" is chosen it shows an inline text input.

```typescript
import { createSignal } from "solid-js"
import { Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import {
  setModal, selectedProject, selectedEnvironment,
  devices, selectedDeviceIds, templates, templateIndex,
  message, appendToSendLog, getOrCreateSessionFile,
} from "../../store"
import { sendNotification, sendToTopic } from "../../lib/fcm"
import { appendSendLog } from "../../lib/config"
import type { SendTargetType, SendLogEntry } from "../../lib/types"

type Option = "devices" | "topic" | "all"

export const SendModal = () => {
  const [option, setOption] = createSignal<Option>("devices")
  const [topicStr, setTopicStr] = createSignal("")
  const [enteringTopic, setEnteringTopic] = createSignal(false)
  const options: Option[] = ["devices", "topic", "all"]

  const selectedCount = () => selectedDeviceIds().size

  async function doSend() {
    const proj = selectedProject()
    const env = selectedEnvironment()
    if (!proj || !env) return

    setModal({ type: "none" })

    const tpl = templates()[templateIndex()]
    const msg = tpl ? tpl.message : message
    const templateName = tpl?.name

    let results
    let targetType: SendTargetType
    let targetInfo: string

    if (option() === "topic") {
      targetType = "topic"
      targetInfo = topicStr()
      const r = await sendToTopic(env.serviceAccountPath, topicStr(), msg)
      results = [r]
    } else if (option() === "all") {
      targetType = "all"
      targetInfo = "all"
      results = await sendNotification(env.serviceAccountPath, devices(), msg)
    } else {
      targetType = "devices"
      const targets = devices().filter(d => selectedDeviceIds().has(d.id))
      targetInfo = targets.map(d => d.name).join(", ")
      results = await sendNotification(env.serviceAccountPath, targets, msg)
    }

    const entry: SendLogEntry = {
      timestamp: new Date().toISOString(),
      templateName,
      targetType,
      targetInfo,
      results,
    }
    appendToSendLog(entry)
    appendSendLog(proj.id, env.id, getOrCreateSessionFile(), entry)
  }

  useKeyboard((key) => {
    if (enteringTopic()) {
      if (key.name === "escape") { setEnteringTopic(false); return }
      if (key.name === "return") { doSend(); return }
      if (key.name === "backspace") setTopicStr(t => t.slice(0, -1))
      else if (key.sequence && key.sequence.length === 1 && !key.ctrl) setTopicStr(t => t + key.sequence)
      return
    }

    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "up") setOption(o => { const i = options.indexOf(o); return options[Math.max(0, i - 1)] })
    if (key.name === "down") setOption(o => { const i = options.indexOf(o); return options[Math.min(options.length - 1, i + 1)] })
    if (key.name === "return") {
      if (option() === "topic") { setEnteringTopic(true); return }
      doSend()
    }
  })

  const highlight = (o: Option) => option() === o ? "#00FFFF" : "#CCCCCC"
  const bg = (o: Option) => option() === o ? "#003333" : "transparent"

  return (
    <box
      style={{
        position: "absolute",
        top: "25%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FF00",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Send As</text>
      <box style={{ backgroundColor: bg("devices"), padding: 1, marginTop: 1 }}>
        <text style={{ color: highlight("devices") }}>
          {option() === "devices" ? "> " : "  "}Selected devices ({selectedCount()} checked)
        </text>
      </box>
      <box style={{ backgroundColor: bg("topic"), padding: 1 }}>
        <text style={{ color: highlight("topic") }}>
          {option() === "topic" ? "> " : "  "}Topic
        </text>
      </box>
      <Show when={option() === "topic" && enteringTopic()}>
        <box style={{ borderStyle: "single", borderColor: "#00FF00", padding: 1 }}>
          <text style={{ color: "#FFFFFF" }}>{topicStr() || " "}</text>
        </box>
      </Show>
      <box style={{ backgroundColor: bg("all"), padding: 1 }}>
        <text style={{ color: highlight("all") }}>
          {option() === "all" ? "> " : "  "}All devices in env ({devices().length} total)
        </text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FF00" }}>↑↓</span>:choose
        <span style={{ color: "#00FF00" }}> enter</span>:send
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/modals/SendModal.tsx
git commit -m "feat: add SendModal with device/topic/all target selection"
```

---

## Task 10: Add EnvironmentList component

**Files:**
- Create: `src/components/EnvironmentList.tsx`

**Step 1: Create the file**

```typescript
import { For } from "solid-js"
import { environments, environmentIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const EnvironmentList = (props: Props) => {
  const isFocused = () => focused() === "environments"

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FF88" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Environments</text>
      <For each={environments()}>
        {(env, i) => (
          <text
            style={{
              color: i() === environmentIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === environmentIndex() ? "#00FF88" : "transparent",
            }}
          >
            {i() === environmentIndex() ? "> " : "  "}{env.name}
          </text>
        )}
      </For>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/EnvironmentList.tsx
git commit -m "feat: add EnvironmentList component"
```

---

## Task 11: Add TemplateList component

**Files:**
- Create: `src/components/TemplateList.tsx`

**Step 1: Create the file**

```typescript
import { For } from "solid-js"
import { templates, templateIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const TemplateList = (props: Props) => {
  const isFocused = () => focused() === "templates"

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#FFAA00" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Templates</text>
      <For each={templates()}>
        {(tpl, i) => (
          <text
            style={{
              color: i() === templateIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === templateIndex() ? "#FFAA00" : "transparent",
            }}
          >
            {i() === templateIndex() ? "> " : "  "}{tpl.name}
          </text>
        )}
      </For>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/TemplateList.tsx
git commit -m "feat: add TemplateList component"
```

---

## Task 12: Add DebugConsole component

**Files:**
- Create: `src/components/DebugConsole.tsx`

**Step 1: Create the file**

```typescript
import { For } from "solid-js"
import { sendLog, consoleOffset, focused } from "../store"

interface Props {
  height: number
}

export const DebugConsole = (props: Props) => {
  const isFocused = () => focused() === "console"

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#AAAAFF" : "#666666",
        padding: 1,
        overflow: "hidden",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Debug Console</text>
      <For each={sendLog().slice(consoleOffset())}>
        {(entry) => {
          const ts = new Date(entry.timestamp).toLocaleTimeString()
          const allOk = entry.results.every(r => r.success)
          const okCount = entry.results.filter(r => r.success).length
          const icon = allOk ? "✓" : "✗"
          const iconColor = allOk ? "#00FF00" : "#FF4444"
          const label = entry.templateName ? `${entry.templateName}` : "(one-off)"
          const target = entry.targetType === "topic"
            ? `topic:${entry.targetInfo}`
            : entry.targetType === "all"
            ? "all"
            : `devices (${okCount}/${entry.results.length})`

          return (
            <box style={{ flexDirection: "column", marginTop: 0 }}>
              <text>
                <span style={{ color: "#888888" }}>{ts} </span>
                <span style={{ color: iconColor }}>{icon} </span>
                <span style={{ color: "#FFFFFF" }}>{label}</span>
                <span style={{ color: "#888888" }}> → {target}</span>
              </text>
              <For each={entry.results.filter(r => !r.success)}>
                {(r) => (
                  <text style={{ color: "#FF4444", marginLeft: 2 }}>
                    ERR {r.deviceName}: {r.error}
                  </text>
                )}
              </For>
            </box>
          )
        }}
      </For>
    </box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/DebugConsole.tsx
git commit -m "feat: add DebugConsole with send log display"
```

---

## Task 13: Update DeviceList and ProjectList

**Files:**
- Modify: `src/components/DeviceList.tsx`
- Modify: `src/components/ProjectList.tsx`

**Step 1: Update DeviceList.tsx — add height prop**

```typescript
import { For } from "solid-js"
import { devices, deviceIndex, selectedDeviceIds, focused } from "../store"

interface Props {
  height: number
}

export const DeviceList = (props: Props) => {
  const isFocused = () => focused() === "devices"

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
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

**Step 2: Update ProjectList.tsx — add height prop**

```typescript
import { For } from "solid-js"
import { projects, projectIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const ProjectList = (props: Props) => {
  const isFocused = () => focused() === "projects"

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
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

**Step 3: Commit**

```bash
git add src/components/DeviceList.tsx src/components/ProjectList.tsx
git commit -m "feat: add height prop to DeviceList and ProjectList"
```

---

## Task 14: Update StatusBar

**Files:**
- Modify: `src/components/StatusBar.tsx`

**Step 1: Replace StatusBar.tsx**

```typescript
import { focused, modal } from "../store"
import { Show } from "solid-js"

export const StatusBar = () => {
  const isModal = () => modal().type !== "none"

  return (
    <box style={{ width: "100%", padding: 1, backgroundColor: "#222222" }}>
      <Show when={!isModal()}>
        <text style={{ color: "#888888" }}>
          <span style={{ color: "#00FFFF" }}>tab</span>:focus
          <span style={{ color: "#00FFFF" }}> n</span>:new
          <span style={{ color: "#00FFFF" }}> e</span>:edit
          <span style={{ color: "#FF4444" }}> D</span>:delete
          <span style={{ color: "#00FFFF" }}> m</span>:compose
          <span style={{ color: "#FFAA00" }}> t</span>:template
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
git commit -m "feat: update StatusBar hints for 5-panel layout"
```

---

## Task 15: Rewrite App.tsx — 5-panel layout + full keyboard routing

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/modals/ResultModal.tsx` (no longer needed)

**Step 1: Delete ResultModal**

```bash
rm src/components/modals/ResultModal.tsx
git add -A
```

**Step 2: Replace App.tsx entirely**

```typescript
import { Show } from "solid-js"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import {
  focused, setFocused,
  projects, projectIndex, setProjectIndex, selectedProject,
  environments, environmentIndex, setEnvironmentIndex, selectedEnvironment,
  templates, templateIndex, setTemplateIndex, selectedTemplate,
  devices, deviceIndex, setDeviceIndex,
  toggleDevice, selectedDeviceIds,
  modal, setModal,
  message, setMessage,
  consoleOffset, setConsoleOffset, sendLog,
  loadProjects, loadEnvironmentsForProject, loadDevicesForEnvironment,
} from "./store"
import { ProjectList } from "./components/ProjectList"
import { EnvironmentList } from "./components/EnvironmentList"
import { TemplateList } from "./components/TemplateList"
import { DeviceList } from "./components/DeviceList"
import { DebugConsole } from "./components/DebugConsole"
import { StatusBar } from "./components/StatusBar"
import { ProjectModal } from "./components/modals/ProjectModal"
import { EnvironmentModal } from "./components/modals/EnvironmentModal"
import { TemplateModal } from "./components/modals/TemplateModal"
import { DeviceModal } from "./components/modals/DeviceModal"
import { MessageModal } from "./components/modals/MessageModal"
import { SendModal } from "./components/modals/SendModal"
import { deleteProject, deleteEnvironment, saveDevices, listDevices, saveTemplates, listTemplates } from "./lib/config"

const FOCUS_ORDER = ["projects", "environments", "templates", "devices", "console"] as const

export const App = () => {
  const dims = useTerminalDimensions()
  loadProjects()

  useKeyboard((key) => {
    if (modal().type !== "none") return

    if (key.name === "q") process.exit(0)

    // Tab cycles through panels
    if (key.name === "tab") {
      const idx = FOCUS_ORDER.indexOf(focused() as any)
      setFocused(FOCUS_ORDER[(idx + 1) % FOCUS_ORDER.length])
      return
    }

    // Global: compose one-off message
    if (key.name === "m") { setModal({ type: "message" }); return }

    // Global: open send modal
    if (key.name === "s" || key.name === "return") {
      const env = selectedEnvironment()
      if (!env) return
      setModal({ type: "send" })
      return
    }

    // ── Projects panel ──────────────────────────────────────────────────────
    if (focused() === "projects") {
      if (key.name === "up") {
        const next = Math.max(0, projectIndex() - 1)
        setProjectIndex(next)
        const proj = projects()[next]
        if (proj) loadEnvironmentsForProject(proj.id)
      }
      if (key.name === "down") {
        const next = Math.min(projects().length - 1, projectIndex() + 1)
        setProjectIndex(next)
        const proj = projects()[next]
        if (proj) loadEnvironmentsForProject(proj.id)
      }
      if (key.name === "n") setModal({ type: "project" })
      if (key.name === "e" && selectedProject()) setModal({ type: "project", project: selectedProject()! })
      if (key.name === "D" && selectedProject()) {
        deleteProject(selectedProject()!.id)
        loadProjects()
      }
    }

    // ── Environments panel ──────────────────────────────────────────────────
    if (focused() === "environments") {
      if (key.name === "up") {
        const next = Math.max(0, environmentIndex() - 1)
        setEnvironmentIndex(next)
        const proj = selectedProject()
        const env = environments()[next]
        if (proj && env) loadDevicesForEnvironment(proj.id, env.id)
      }
      if (key.name === "down") {
        const next = Math.min(environments().length - 1, environmentIndex() + 1)
        setEnvironmentIndex(next)
        const proj = selectedProject()
        const env = environments()[next]
        if (proj && env) loadDevicesForEnvironment(proj.id, env.id)
      }
      if (key.name === "n" && selectedProject()) setModal({ type: "environment" })
      if (key.name === "e" && selectedEnvironment()) setModal({ type: "environment", environment: selectedEnvironment()! })
      if (key.name === "D" && selectedProject() && selectedEnvironment()) {
        deleteEnvironment(selectedProject()!.id, selectedEnvironment()!.id)
        loadEnvironmentsForProject(selectedProject()!.id)
      }
    }

    // ── Templates panel ─────────────────────────────────────────────────────
    if (focused() === "templates") {
      if (key.name === "up") setTemplateIndex(i => Math.max(0, i - 1))
      if (key.name === "down") setTemplateIndex(i => Math.min(templates().length - 1, i + 1))
      if (key.name === "n" && selectedProject()) setModal({ type: "template" })
      if (key.name === "e" && selectedTemplate()) setModal({ type: "template", template: selectedTemplate()! })
      if (key.name === "D" && selectedProject() && selectedTemplate()) {
        const updated = templates().filter(t => t.id !== selectedTemplate()!.id)
        saveTemplates(selectedProject()!.id, updated)
        const ts = listTemplates(selectedProject()!.id)
        // reload via store helper
        const { loadTemplatesForProject } = require("./store")
        loadTemplatesForProject(selectedProject()!.id)
      }
    }

    // ── Devices panel ───────────────────────────────────────────────────────
    if (focused() === "devices") {
      if (key.name === "up") setDeviceIndex(i => Math.max(0, i - 1))
      if (key.name === "down") setDeviceIndex(i => Math.min(devices().length - 1, i + 1))
      if (key.name === "space") {
        const dev = devices()[deviceIndex()]
        if (dev) toggleDevice(dev.id)
      }
      if (key.name === "a" && selectedProject() && selectedEnvironment()) setModal({ type: "device" })
      if (key.name === "e") {
        const dev = devices()[deviceIndex()]
        if (dev) setModal({ type: "device", device: dev })
      }
      if (key.name === "D") {
        const proj = selectedProject()
        const env = selectedEnvironment()
        if (!proj || !env) return
        const dev = devices()[deviceIndex()]
        if (!dev) return
        const updated = devices().filter(d => d.id !== dev.id)
        saveDevices(proj.id, env.id, updated)
        loadDevicesForEnvironment(proj.id, env.id)
      }
    }

    // ── Console panel ───────────────────────────────────────────────────────
    if (focused() === "console") {
      if (key.name === "up") setConsoleOffset(o => Math.max(0, o - 1))
      if (key.name === "down") setConsoleOffset(o => Math.min(sendLog().length - 1, o + 1))
    }
  })

  const W = () => dims().width ?? 80
  const H = () => dims().height ?? 24
  const leftW = () => Math.floor(W() * 0.35)
  const leftH = () => H() - 3  // minus status bar
  const panelH = () => Math.floor(leftH() / 3)
  const devicesH = () => Math.floor(leftH() * 0.6)
  const consoleH = () => leftH() - devicesH()

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        {/* Left column */}
        <box style={{ width: leftW(), flexDirection: "column" }}>
          <TemplateList width={leftW()} height={panelH()} />
          <EnvironmentList width={leftW()} height={panelH()} />
          <ProjectList width={leftW()} height={panelH()} />
        </box>
        {/* Right column */}
        <box style={{ flexGrow: 1, flexDirection: "column" }}>
          <DeviceList height={devicesH()} />
          <DebugConsole height={consoleH()} />
        </box>
      </box>
      <StatusBar />

      <Show when={modal().type === "project"}>
        <ProjectModal project={(modal() as any).project} />
      </Show>
      <Show when={modal().type === "environment"}>
        <EnvironmentModal environment={(modal() as any).environment} />
      </Show>
      <Show when={modal().type === "template"}>
        <TemplateModal template={(modal() as any).template} />
      </Show>
      <Show when={modal().type === "device"}>
        <DeviceModal device={(modal() as any).device} />
      </Show>
      <Show when={modal().type === "message"}>
        <MessageModal />
      </Show>
      <Show when={modal().type === "send"}>
        <SendModal />
      </Show>
    </box>
  )
}
```

Note: The `require("./store")` in the templates `D` handler is a workaround for the circular dependency; replace it with a direct import of `loadTemplatesForProject` at the top-level import instead.

**Step 3: Fix the templates delete handler** — replace the `require` call with importing `loadTemplatesForProject` at the top of the file alongside other store imports.

**Step 4: Run the app manually**

```bash
bun run src/index.tsx
```

Verify:
- 5 panels visible
- `tab` cycles focus (highlighted border changes)
- Arrow keys navigate each panel
- `n` opens appropriate modal in each panel
- `s` opens SendModal
- Sends log to DebugConsole
- Session file created under `~/.config/lazypush/projects/[id]/environments/[env-id]/sessions/`

**Step 5: Run tests**

```bash
bun test
```

Expected: all passing.

**Step 6: Commit**

```bash
git add src/App.tsx src/components/modals/ResultModal.tsx
git commit -m "feat: 5-panel layout, full keyboard routing, wire all modals and send flow"
```

---

## Task 16: Update DeviceModal to use environment

**Files:**
- Modify: `src/components/modals/DeviceModal.tsx`

The `DeviceModal` currently calls `saveDevices(proj.id, updated)` with the old 2-arg signature. It needs the new 3-arg signature: `saveDevices(proj.id, env.id, updated)`.

**Step 1: Read current DeviceModal**

Open `src/components/modals/DeviceModal.tsx` and find any calls to `saveDevices` or `listDevices`.

**Step 2: Update the imports and calls**

- Import `selectedEnvironment` from store
- Change any `saveDevices(proj.id, ...)` → `saveDevices(proj.id, env.id, ...)`
- Change any `listDevices(proj.id)` → `listDevices(proj.id, env.id)`
- Update the post-save reload to call `loadDevicesForEnvironment(proj.id, env.id)` instead of `loadDevicesForProject(proj.id)`

**Step 3: Run the app**

```bash
bun run src/index.tsx
```

Add a device, confirm it saves and appears in the list.

**Step 4: Commit**

```bash
git add src/components/modals/DeviceModal.tsx
git commit -m "fix: update DeviceModal to use per-environment device storage"
```

---

## Final Verification

**Step 1: Run all tests**

```bash
bun test
```

Expected: all PASS.

**Step 2: Manual end-to-end smoke test**

```bash
bun run src/index.tsx
```

Checklist:
- [ ] Create a project (name only)
- [ ] Create an environment (name + service account path)
- [ ] Add a device to the environment
- [ ] Create a message template
- [ ] Press `s` → SendModal appears → send to selected device
- [ ] DebugConsole shows the send result
- [ ] Session file written to `~/.config/lazypush/projects/[id]/environments/[env-id]/sessions/`
- [ ] Old-format project (with `serviceAccountPath` in config.json) auto-migrates on startup

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: environments, templates, debug console — complete"
```
