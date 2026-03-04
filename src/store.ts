import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type { ConfigProvider } from "./lib/config-provider";
import type {
  Device,
  Environment,
  FcmMessage,
  MessageTemplate,
  ModalState,
  Project,
  SendLogEntry,
} from "./lib/types";

// Panel focus — tab cycles in this order
export type FocusPanel =
  | "projects"
  | "environments"
  | "templates"
  | "devices"
  | "console";
export const [focused, setFocused] = createSignal<FocusPanel>("projects");

// Projects
export const [projects, setProjects] = createSignal<Project[]>([]);
export const [projectIndex, setProjectIndex] = createSignal(0); // cursor
export const [projectActiveIndex, setProjectActiveIndex] = createSignal(0); // activated via spacebar
export const selectedProject = () => projects()[projectActiveIndex()] ?? null;

// Environments
export const [environments, setEnvironments] = createSignal<Environment[]>([]);
export const [environmentIndex, setEnvironmentIndex] = createSignal(0); // cursor
export const [environmentActiveIndex, setEnvironmentActiveIndex] =
  createSignal(0); // activated via spacebar
export const selectedEnvironment = () =>
  environments()[environmentActiveIndex()] ?? null;

// Templates
export const [templates, setTemplates] = createSignal<MessageTemplate[]>([]);
export const [templateIndex, setTemplateIndex] = createSignal(0); // cursor
export const [templateActiveIndex, setTemplateActiveIndex] = createSignal(0); // activated via spacebar
export const selectedTemplate = () =>
  templates()[templateActiveIndex()] ?? null;

// Devices
export const [devices, setDevices] = createSignal<Device[]>([]);
export const [deviceIndex, setDeviceIndex] = createSignal(0);
export const [selectedDeviceIds, setSelectedDeviceIds] = createSignal(
  new Set<string>()
);

// Modal
export const [modal, setModal] = createSignal<ModalState>({ type: "none" });

// Message being composed (one-off or loaded from template)
export const [message, setMessage] = createStore<FcmMessage>({
  notification: { title: "", body: "" },
  data: {},
  android: { priority: "high" },
  apns: {
    headers: { "apns-priority": "10" },
    payload: { aps: { contentAvailable: true, mutableContent: true } },
  },
});

// Debug console
export const [sendLog, setSendLog] = createSignal<SendLogEntry[]>([]);
export const [consoleOffset, setConsoleOffset] = createSignal(0);

// Session file (created once per run on first send)
let _sessionFile: string | null = null;
export function getOrCreateSessionFile(config: ConfigProvider): string {
  if (!_sessionFile) {
    _sessionFile = config.newSessionFileName();
  }
  return _sessionFile;
}

// ─── Load functions ───────────────────────────────────────────────────────────

export function loadProjects(config: ConfigProvider) {
  const ps = config.listProjects();
  setProjects(ps);
  setProjectIndex(0);
  setProjectActiveIndex(0);
  setEnvironments([]);
  setEnvironmentIndex(0);
  setEnvironmentActiveIndex(0);
  setDevices([]);
  setSelectedDeviceIds(new Set<string>());
  if (ps.length > 0) {
    loadEnvironmentsForProject(config, ps[0].id);
  }
}

export function loadEnvironmentsForProject(
  config: ConfigProvider,
  projectId: string
) {
  const envs = config.listEnvironments(projectId);
  setEnvironments(envs);
  setEnvironmentIndex(0);
  setEnvironmentActiveIndex(0);
  setDevices([]);
  setSelectedDeviceIds(new Set<string>());
  loadTemplatesForProject(config, projectId);
  if (envs.length > 0) {
    loadDevicesForEnvironment(config, projectId, envs[0].id);
  }
}

export function loadTemplatesForProject(
  config: ConfigProvider,
  projectId: string
) {
  setTemplates(config.listTemplates(projectId));
  setTemplateIndex(0);
  setTemplateActiveIndex(0);
}

export function loadDevicesForEnvironment(
  config: ConfigProvider,
  projectId: string,
  envId: string
) {
  setDevices(config.listDevices(projectId, envId));
  setDeviceIndex(0);
  setSelectedDeviceIds(new Set<string>());
}

export function toggleDevice(id: string) {
  setSelectedDeviceIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}

export function appendToSendLog(entry: SendLogEntry) {
  setSendLog((prev) => [...prev, entry]);
  // Scroll console to bottom
  setConsoleOffset(sendLog().length - 1);
}
