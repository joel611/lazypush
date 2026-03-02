import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import {
  listDevices,
  listEnvironments,
  listProjects,
  listTemplates,
  newSessionFileName,
} from "./lib/config";
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
export const [projectIndex, setProjectIndex] = createSignal(0);
export const selectedProject = () => projects()[projectIndex()] ?? null;

// Environments
export const [environments, setEnvironments] = createSignal<Environment[]>([]);
export const [environmentIndex, setEnvironmentIndex] = createSignal(0);
export const selectedEnvironment = () =>
  environments()[environmentIndex()] ?? null;

// Templates
export const [templates, setTemplates] = createSignal<MessageTemplate[]>([]);
export const [templateIndex, setTemplateIndex] = createSignal(0);
export const selectedTemplate = () => templates()[templateIndex()] ?? null;

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
    payload: { aps: { contentAvailable: 1, mutableContent: 1 } },
  },
});

// Debug console
export const [sendLog, setSendLog] = createSignal<SendLogEntry[]>([]);
export const [consoleOffset, setConsoleOffset] = createSignal(0);

// Session file (created once per run on first send)
let _sessionFile: string | null = null;
export function getOrCreateSessionFile(): string {
  if (!_sessionFile) {
    _sessionFile = newSessionFileName();
  }
  return _sessionFile;
}

// ─── Load functions ───────────────────────────────────────────────────────────

export function loadProjects() {
  const ps = listProjects();
  setProjects(ps);
  setProjectIndex(0);
  setEnvironments([]);
  setEnvironmentIndex(0);
  setDevices([]);
  setSelectedDeviceIds(new Set());
  if (ps.length > 0) {
    loadEnvironmentsForProject(ps[0].id);
  }
}

export function loadEnvironmentsForProject(projectId: string) {
  const envs = listEnvironments(projectId);
  setEnvironments(envs);
  setEnvironmentIndex(0);
  setDevices([]);
  setSelectedDeviceIds(new Set());
  loadTemplatesForProject(projectId);
  if (envs.length > 0) {
    loadDevicesForEnvironment(projectId, envs[0].id);
  }
}

export function loadTemplatesForProject(projectId: string) {
  setTemplates(listTemplates(projectId));
  setTemplateIndex(0);
}

export function loadDevicesForEnvironment(projectId: string, envId: string) {
  setDevices(listDevices(projectId, envId));
  setDeviceIndex(0);
  setSelectedDeviceIds(new Set());
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
