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
