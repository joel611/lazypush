import { join } from "path"
import { homedir } from "os"
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs"
import type { Project, Environment, Device, MessageTemplate, SendLogEntry } from "./types"

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

// ─── Templates ────────────────────────────────────────────────────────────────

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
