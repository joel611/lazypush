import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { Show } from "solid-js";
import { DebugConsole } from "./components/debug-console";
import { DeviceList } from "./components/device-list";
import { EnvironmentList } from "./components/environment-list";
import { DeviceModal } from "./components/modals/device-modal";
import { EnvironmentModal } from "./components/modals/environment-modal";
import { MessageModal } from "./components/modals/message-modal";
import { ProjectModal } from "./components/modals/project-modal";
import { SendModal } from "./components/modals/send-modal";
import { TemplateModal } from "./components/modals/template-modal";
import { ProjectList } from "./components/project-list";
import { StatusBar } from "./components/status-bar";
import { TemplateList } from "./components/template-list";
import {
  deleteEnvironment,
  deleteProject,
  saveDevices,
  saveTemplates,
} from "./lib/config";
import type { ModalState } from "./lib/types";
import {
  deviceIndex,
  devices,
  environmentIndex,
  environments,
  focused,
  loadDevicesForEnvironment,
  loadEnvironmentsForProject,
  loadProjects,
  loadTemplatesForProject,
  modal,
  projectIndex,
  projects,
  selectedEnvironment,
  selectedProject,
  selectedTemplate,
  sendLog,
  setConsoleOffset,
  setDeviceIndex,
  setEnvironmentIndex,
  setFocused,
  setModal,
  setProjectIndex,
  setTemplateIndex,
  templates,
  toggleDevice,
} from "./store";

const FOCUS_ORDER = [
  "projects",
  "environments",
  "templates",
  "devices",
  "console",
] as const;

const PANE_KEYS: Partial<Record<string, (typeof FOCUS_ORDER)[number]>> = {
  "1": "templates",
  "2": "environments",
  "3": "projects",
  "4": "devices",
  "5": "console",
};

interface KeyInput {
  ctrl?: boolean;
  name: string;
  sequence?: string;
}

function navName(key: KeyInput): string {
  if (key.name === "j") {
    return "down";
  }
  if (key.name === "k") {
    return "up";
  }
  return key.name;
}

function handleProjectsKey(key: KeyInput, nav: string) {
  if (nav === "up") {
    const next = Math.max(0, projectIndex() - 1);
    setProjectIndex(next);
    const proj = projects()[next];
    if (proj) {
      loadEnvironmentsForProject(proj.id);
    }
  }
  if (nav === "down") {
    const next = Math.min(projects().length - 1, projectIndex() + 1);
    setProjectIndex(next);
    const proj = projects()[next];
    if (proj) {
      loadEnvironmentsForProject(proj.id);
    }
  }
  if (key.name === "n") {
    setModal({ type: "project" });
  }
  if (key.name === "e") {
    const proj = selectedProject();
    if (proj) {
      setModal({ type: "project", project: proj });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    if (proj) {
      deleteProject(proj.id);
      loadProjects();
    }
  }
}

function handleEnvironmentsKey(key: KeyInput, nav: string) {
  if (nav === "up") {
    const next = Math.max(0, environmentIndex() - 1);
    setEnvironmentIndex(next);
    const proj = selectedProject();
    const env = environments()[next];
    if (proj && env) {
      loadDevicesForEnvironment(proj.id, env.id);
    }
  }
  if (nav === "down") {
    const next = Math.min(environments().length - 1, environmentIndex() + 1);
    setEnvironmentIndex(next);
    const proj = selectedProject();
    const env = environments()[next];
    if (proj && env) {
      loadDevicesForEnvironment(proj.id, env.id);
    }
  }
  if (key.name === "n" && selectedProject()) {
    setModal({ type: "environment" });
  }
  if (key.name === "e") {
    const env = selectedEnvironment();
    if (env) {
      setModal({ type: "environment", environment: env });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    const env = selectedEnvironment();
    if (proj && env) {
      deleteEnvironment(proj.id, env.id);
      loadEnvironmentsForProject(proj.id);
    }
  }
}

function handleTemplatesKey(key: KeyInput, nav: string) {
  if (nav === "up") {
    setTemplateIndex((i) => Math.max(0, i - 1));
  }
  if (nav === "down") {
    setTemplateIndex((i) => Math.min(templates().length - 1, i + 1));
  }
  if (key.name === "n" && selectedProject()) {
    setModal({ type: "template" });
  }
  if (key.name === "e") {
    const tpl = selectedTemplate();
    if (tpl) {
      setModal({ type: "template", template: tpl });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    const tpl = selectedTemplate();
    if (proj && tpl) {
      const updated = templates().filter((t) => t.id !== tpl.id);
      saveTemplates(proj.id, updated);
      loadTemplatesForProject(proj.id);
    }
  }
}

function handleDevicesKey(key: KeyInput, nav: string) {
  if (nav === "up") {
    setDeviceIndex((i) => Math.max(0, i - 1));
  }
  if (nav === "down") {
    setDeviceIndex((i) => Math.min(devices().length - 1, i + 1));
  }
  if (key.name === "space") {
    const dev = devices()[deviceIndex()];
    if (dev) {
      toggleDevice(dev.id);
    }
  }
  if (key.name === "a" && selectedProject() && selectedEnvironment()) {
    setModal({ type: "device" });
  }
  if (key.name === "e") {
    const dev = devices()[deviceIndex()];
    if (dev) {
      setModal({ type: "device", device: dev });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    const env = selectedEnvironment();
    if (!(proj && env)) {
      return;
    }
    const dev = devices()[deviceIndex()];
    if (!dev) {
      return;
    }
    const updated = devices().filter((d) => d.id !== dev.id);
    saveDevices(proj.id, env.id, updated);
    loadDevicesForEnvironment(proj.id, env.id);
  }
}

function handleConsoleKey(nav: string) {
  if (nav === "up") {
    setConsoleOffset((o) => Math.max(0, o - 1));
  }
  if (nav === "down") {
    setConsoleOffset((o) => Math.min(sendLog().length - 1, o + 1));
  }
}

function handleKey(key: KeyInput) {
  if (modal().type !== "none") {
    return;
  }
  const pane = PANE_KEYS[key.name];
  if (pane) {
    setFocused(pane);
    return;
  }
  if (key.name === "q") {
    process.exit(0);
  }
  if (key.name === "m") {
    setModal({ type: "message" });
    return;
  }
  if (key.name === "s" || key.name === "return") {
    const env = selectedEnvironment();
    if (env) {
      setModal({ type: "send" });
    }
    return;
  }
  const nav = navName(key);
  const f = focused();
  if (f === "projects") {
    handleProjectsKey(key, nav);
  } else if (f === "environments") {
    handleEnvironmentsKey(key, nav);
  } else if (f === "templates") {
    handleTemplatesKey(key, nav);
  } else if (f === "devices") {
    handleDevicesKey(key, nav);
  } else if (f === "console") {
    handleConsoleKey(nav);
  }
}

export const App = () => {
  const dims = useTerminalDimensions();
  loadProjects();

  useKeyboard(handleKey);

  const W = () => dims().width ?? 80;
  const H = () => dims().height ?? 24;
  const leftW = () => Math.floor(W() * 0.35);
  const leftH = () => H() - 3; // minus status bar
  const panelH = () => Math.floor(leftH() / 3);
  const devicesH = () => Math.floor(leftH() * 0.6);
  const consoleH = () => leftH() - devicesH();

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        {/* Left column */}
        <box style={{ width: leftW(), flexDirection: "column" }}>
          <TemplateList height={panelH()} width={leftW()} />
          <EnvironmentList height={panelH()} width={leftW()} />
          <ProjectList height={panelH()} width={leftW()} />
        </box>
        {/* Right column */}
        <box style={{ flexGrow: 1, flexDirection: "column" }}>
          <DeviceList height={devicesH()} />
          <DebugConsole height={consoleH()} />
        </box>
      </box>
      <StatusBar />

      <Show when={modal().type === "project"}>
        <ProjectModal
          project={
            (modal() as Extract<ModalState, { type: "project" }>).project
          }
        />
      </Show>
      <Show when={modal().type === "environment"}>
        <EnvironmentModal
          environment={
            (modal() as Extract<ModalState, { type: "environment" }>)
              .environment
          }
        />
      </Show>
      <Show when={modal().type === "template"}>
        <TemplateModal
          template={
            (modal() as Extract<ModalState, { type: "template" }>).template
          }
        />
      </Show>
      <Show when={modal().type === "device"}>
        <DeviceModal
          device={(modal() as Extract<ModalState, { type: "device" }>).device}
        />
      </Show>
      <Show when={modal().type === "message"}>
        <MessageModal />
      </Show>
      <Show when={modal().type === "send"}>
        <SendModal />
      </Show>
    </box>
  );
};
