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
