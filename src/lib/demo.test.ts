// src/lib/demo.test.ts
import { describe, expect, test } from "bun:test";
import { createDemoConfigProvider, MockSendProvider } from "./demo";

describe("createDemoConfigProvider — fixture reads", () => {
  test("listProjects returns 1 project named 'Demo App'", () => {
    const c = createDemoConfigProvider();
    const ps = c.listProjects();
    expect(ps).toHaveLength(1);
    expect(ps[0].name).toBe("Demo App");
  });

  test("listEnvironments returns 3 envs for demo project", () => {
    const c = createDemoConfigProvider();
    expect(c.listEnvironments("demo-project")).toHaveLength(3);
  });

  test("listDevices returns 4 devices for demo-dev", () => {
    const c = createDemoConfigProvider();
    expect(c.listDevices("demo-project", "demo-dev")).toHaveLength(4);
  });

  test("listDevices returns 2 ios + 2 android", () => {
    const c = createDemoConfigProvider();
    const devs = c.listDevices("demo-project", "demo-dev");
    expect(devs.filter((d) => d.platform === "ios")).toHaveLength(2);
    expect(devs.filter((d) => d.platform === "android")).toHaveLength(2);
  });

  test("listTemplates returns 3 templates", () => {
    const c = createDemoConfigProvider();
    expect(c.listTemplates("demo-project")).toHaveLength(3);
  });
});

describe("createDemoConfigProvider — mutations are in-memory", () => {
  test("saveProject adds a project", () => {
    const c = createDemoConfigProvider();
    c.saveProject({ id: "x", name: "X", createdAt: "2026-01-01T00:00:00Z" });
    expect(c.listProjects()).toHaveLength(2);
  });

  test("deleteProject removes it", () => {
    const c = createDemoConfigProvider();
    c.deleteProject("demo-project");
    expect(c.listProjects()).toHaveLength(0);
  });

  test("saveEnvironment adds an env", () => {
    const c = createDemoConfigProvider();
    c.saveEnvironment("demo-project", {
      id: "demo-qa",
      name: "QA",
      serviceAccountPath: "demo",
      createdAt: "2026-01-01T00:00:00Z",
    });
    expect(c.listEnvironments("demo-project")).toHaveLength(4);
  });

  test("deleteEnvironment removes it", () => {
    const c = createDemoConfigProvider();
    c.deleteEnvironment("demo-project", "demo-dev");
    expect(c.listEnvironments("demo-project")).toHaveLength(2);
  });

  test("saveDevices replaces device list", () => {
    const c = createDemoConfigProvider();
    c.saveDevices("demo-project", "demo-dev", []);
    expect(c.listDevices("demo-project", "demo-dev")).toHaveLength(0);
  });

  test("saveTemplates replaces template list", () => {
    const c = createDemoConfigProvider();
    c.saveTemplates("demo-project", []);
    expect(c.listTemplates("demo-project")).toHaveLength(0);
  });
});

describe("MockSendProvider", () => {
  test("sendNotification returns success for each device", async () => {
    const devs = [
      {
        id: "1",
        name: "iPhone",
        platform: "ios" as const,
        token: "tok1",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Pixel",
        platform: "android" as const,
        token: "tok2",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    const msg = { notification: { title: "T", body: "B" } };
    const results = await MockSendProvider.sendNotification("", devs, msg);
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.success).toBe(true);
    }
  });

  test("sendToTopic returns success with topic name", async () => {
    const msg = { notification: { title: "T", body: "B" } };
    const result = await MockSendProvider.sendToTopic("", "news", msg);
    expect(result.success).toBe(true);
    expect(result.deviceName).toBe("topic:news");
  });
});
