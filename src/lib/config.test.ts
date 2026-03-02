import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import {
  __setConfigDir,
  appendSendLog,
  deleteEnvironment,
  deleteProject,
  listDevices,
  listEnvironments,
  listProjects,
  listTemplates,
  newSessionFileName,
  readSendLog,
  saveDevices,
  saveEnvironment,
  saveProject,
  saveTemplates,
} from "./config";

const SESSION_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/;

const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config");
__setConfigDir(TEST_CONFIG_DIR);

const PROJECT = { id: "p1", name: "My App", createdAt: "2026-01-01T00:00:00Z" };
const ENV = {
  id: "e1",
  name: "dev",
  serviceAccountPath: "/tmp/sa.json",
  createdAt: "2026-01-01T00:00:00Z",
};
const DEVICE = {
  id: "d1",
  name: "iPhone",
  platform: "ios" as const,
  token: "tok1",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("config — projects", () => {
  beforeEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));

  test("listProjects returns [] when none exist", () => {
    expect(listProjects()).toEqual([]);
  });

  test("saveProject + listProjects round-trips", () => {
    saveProject(PROJECT);
    expect(listProjects()).toEqual([PROJECT]);
  });

  test("deleteProject removes the project", () => {
    saveProject(PROJECT);
    deleteProject("p1");
    expect(listProjects()).toEqual([]);
  });

  test("listProjects migrates old format (serviceAccountPath in config.json)", () => {
    // Write old-format project manually
    const { mkdirSync, writeFileSync } = require("node:fs");
    const { join: pjoin } = require("node:path");
    const dir = pjoin(TEST_CONFIG_DIR, "projects", "old-p");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      pjoin(dir, "config.json"),
      JSON.stringify({
        id: "old-p",
        name: "Old",
        serviceAccountPath: "/tmp/old.json",
        createdAt: "2026-01-01T00:00:00Z",
      })
    );

    const projects = listProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual({
      id: "old-p",
      name: "Old",
      createdAt: "2026-01-01T00:00:00Z",
    });

    // Migration: default environment should have been created
    const envs = listEnvironments("old-p");
    expect(envs).toHaveLength(1);
    expect(envs[0].name).toBe("default");
    expect(envs[0].serviceAccountPath).toBe("/tmp/old.json");
  });
});

describe("config — environments", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    saveProject(PROJECT);
  });
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));

  test("listEnvironments returns [] for new project", () => {
    expect(listEnvironments("p1")).toEqual([]);
  });

  test("saveEnvironment + listEnvironments round-trips", () => {
    saveEnvironment("p1", ENV);
    expect(listEnvironments("p1")).toEqual([ENV]);
  });

  test("deleteEnvironment removes it", () => {
    saveEnvironment("p1", ENV);
    deleteEnvironment("p1", "e1");
    expect(listEnvironments("p1")).toEqual([]);
  });
});

describe("config — devices (per env)", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    saveProject(PROJECT);
    saveEnvironment("p1", ENV);
  });
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));

  test("listDevices returns [] for new env", () => {
    expect(listDevices("p1", "e1")).toEqual([]);
  });

  test("saveDevices + listDevices round-trips", () => {
    saveDevices("p1", "e1", [DEVICE]);
    expect(listDevices("p1", "e1")).toEqual([DEVICE]);
  });
});

describe("config — templates", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    saveProject(PROJECT);
  });
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));

  test("listTemplates returns [] for new project", () => {
    expect(listTemplates("p1")).toEqual([]);
  });

  test("saveTemplates + listTemplates round-trips", () => {
    const tpl = {
      id: "t1",
      name: "Login push",
      message: { notification: { title: "Hi", body: "Hello" } },
      createdAt: "2026-01-01T00:00:00Z",
    };
    saveTemplates("p1", [tpl]);
    expect(listTemplates("p1")).toEqual([tpl]);
  });
});

describe("config — session logging", () => {
  beforeEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    saveProject(PROJECT);
    saveEnvironment("p1", ENV);
  });
  afterEach(() => rmSync(TEST_CONFIG_DIR, { recursive: true, force: true }));

  test("appendSendLog creates file and accumulates entries", () => {
    const entry1 = {
      timestamp: "2026-01-01T14:00:00Z",
      targetType: "devices" as const,
      targetInfo: "iPhone",
      results: [{ deviceName: "iPhone", token: "tok", success: true }],
    };
    const entry2 = { ...entry1, timestamp: "2026-01-01T14:01:00Z" };
    const file = "2026-01-01_14-00-00.json";

    appendSendLog("p1", "e1", file, entry1);
    appendSendLog("p1", "e1", file, entry2);

    const log = readSendLog("p1", "e1", file);
    expect(log).toHaveLength(2);
    expect(log[0].timestamp).toBe("2026-01-01T14:00:00Z");
  });

  test("newSessionFileName returns a filename matching pattern", () => {
    expect(newSessionFileName()).toMatch(SESSION_FILE_PATTERN);
  });
});
