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
