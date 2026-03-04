// src/lib/demo.ts
import type { ConfigProvider, SendProvider } from "./config-provider";
import type {
  Device,
  Environment,
  FcmMessage,
  MessageTemplate,
  Project,
  SendLogEntry,
  SendResult,
} from "./types";

// ─── Fixture data ─────────────────────────────────────────────────────────────

const DEMO_PROJECT: Project = {
  id: "demo-project",
  name: "Demo App",
  createdAt: "2026-01-01T00:00:00Z",
};

const DEMO_ENVIRONMENTS: Environment[] = [
  {
    id: "demo-dev",
    name: "Development",
    serviceAccountPath: "demo",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "demo-staging",
    name: "Staging",
    serviceAccountPath: "demo",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "demo-prod",
    name: "Production",
    serviceAccountPath: "demo",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

function makeDemoDevices(prefix: string): Device[] {
  return [
    {
      id: `${prefix}-ios-1`,
      name: "iPhone 15 Pro",
      platform: "ios",
      token: `${prefix}-ios-aabbccdd1122334455`,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: `${prefix}-ios-2`,
      name: "iPad Air",
      platform: "ios",
      token: `${prefix}-ios-eeff001122334455`,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: `${prefix}-android-1`,
      name: "Pixel 8",
      platform: "android",
      token: `${prefix}-android-aabbccdd66778899`,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: `${prefix}-android-2`,
      name: "Samsung S24",
      platform: "android",
      token: `${prefix}-android-eeff0011aabbccdd`,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];
}

const DEMO_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-simple",
    name: "Simple Notification",
    message: {
      notification: { title: "Hello!", body: "This is a test notification." },
    },
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl-deep-link",
    name: "Deep Link",
    message: {
      notification: { title: "Open App", body: "Tap to navigate to home." },
      data: { screen: "home", action: "open" },
    },
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl-data-only",
    name: "Data Only",
    message: {
      notification: { title: "", body: "" },
      data: { type: "sync", payload: "refresh" },
    },
    createdAt: "2026-01-01T00:00:00Z",
  },
];

// ─── DemoConfigProvider ────────────────────────────────────────────────────────

export function createDemoConfigProvider(): ConfigProvider {
  let projects: Project[] = [DEMO_PROJECT];

  const environments: Record<string, Environment[]> = {
    "demo-project": [...DEMO_ENVIRONMENTS],
  };

  const devices: Record<string, Record<string, Device[]>> = {
    "demo-project": {
      "demo-dev": makeDemoDevices("dev"),
      "demo-staging": makeDemoDevices("staging"),
      "demo-prod": makeDemoDevices("prod"),
    },
  };

  const templates: Record<string, MessageTemplate[]> = {
    "demo-project": [...DEMO_TEMPLATES],
  };

  const sendLogs: Record<string, SendLogEntry[]> = {};

  return {
    listProjects: () => projects,

    saveProject: (p) => {
      const idx = projects.findIndex((x) => x.id === p.id);
      projects =
        idx >= 0
          ? projects.map((x) => (x.id === p.id ? p : x))
          : [...projects, p];
    },

    deleteProject: (id) => {
      projects = projects.filter((x) => x.id !== id);
    },

    listEnvironments: (projectId) => environments[projectId] ?? [],

    saveEnvironment: (projectId, env) => {
      const envs = environments[projectId] ?? [];
      const idx = envs.findIndex((x) => x.id === env.id);
      environments[projectId] =
        idx >= 0
          ? envs.map((x) => (x.id === env.id ? env : x))
          : [...envs, env];
    },

    deleteEnvironment: (projectId, envId) => {
      environments[projectId] = (environments[projectId] ?? []).filter(
        (x) => x.id !== envId
      );
    },

    listDevices: (projectId, envId) => devices[projectId]?.[envId] ?? [],

    saveDevices: (projectId, envId, devs) => {
      devices[projectId] ??= {};
      devices[projectId][envId] = devs;
    },

    listTemplates: (projectId) => templates[projectId] ?? [],

    saveTemplates: (projectId, tpls) => {
      templates[projectId] = tpls;
    },

    appendSendLog: (projectId, envId, sessionFile, entry) => {
      const key = `${projectId}/${envId}/${sessionFile}`;
      sendLogs[key] = [...(sendLogs[key] ?? []), entry];
    },

    newSessionFileName: () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.json`;
    },

    readSettings: () => ({ theme: "tokyonight-night" as const }),
    saveSettings: () => {
      /* demo mode: no persistence */
    },
  };
}

// ─── MockSendProvider ─────────────────────────────────────────────────────────

export const MockSendProvider: SendProvider = {
  sendNotification: async (
    _serviceAccountPath: string,
    devs: Device[],
    _msg: FcmMessage
  ): Promise<SendResult[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return devs.map((d) => ({
      deviceName: d.name,
      token: d.token,
      success: true,
    }));
  },

  sendToTopic: async (
    _serviceAccountPath: string,
    topic: string,
    _msg: FcmMessage
  ): Promise<SendResult> => {
    await new Promise((r) => setTimeout(r, 300));
    return { deviceName: `topic:${topic}`, token: "", success: true };
  },
};
