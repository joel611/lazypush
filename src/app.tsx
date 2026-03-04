// src/app.tsx
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
import { ThemeModal } from "./components/modals/theme-modal";
import { ProjectList } from "./components/project-list";
import { StatusBar } from "./components/status-bar";
import { TemplateList } from "./components/template-list";
import type { ConfigProvider } from "./lib/config-provider";
import type { AppServices } from "./lib/services-context";
import { ServicesContext } from "./lib/services-context";
import { ThemeProvider } from "./lib/theme-context";
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
  sendLog,
  setConsoleOffset,
  setDeviceIndex,
  setEnvironmentActiveIndex,
  setEnvironmentIndex,
  setFocused,
  setModal,
  setProjectActiveIndex,
  setProjectIndex,
  setTemplateActiveIndex,
  setTemplateIndex,
  templateIndex,
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
  shift?: boolean;
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

function handleProjectsKey(config: ConfigProvider, key: KeyInput, nav: string) {
  if (nav === "up") {
    setProjectIndex((i) => Math.max(0, i - 1));
  }
  if (nav === "down") {
    setProjectIndex((i) => Math.min(projects().length - 1, i + 1));
  }
  if (key.name === "space") {
    const idx = projectIndex();
    setProjectActiveIndex(idx);
    const proj = projects()[idx];
    if (proj) {
      loadEnvironmentsForProject(config, proj.id);
    }
  }
  if (key.name === "n") {
    setModal({ type: "project" });
  }
  if (key.name === "e") {
    const proj = projects()[projectIndex()];
    if (proj) {
      setModal({ type: "project", project: proj });
    }
  }
  if (key.name === "D") {
    const proj = projects()[projectIndex()];
    if (proj) {
      config.deleteProject(proj.id);
      loadProjects(config);
    }
  }
}

function handleEnvironmentsKey(
  config: ConfigProvider,
  key: KeyInput,
  nav: string
) {
  if (nav === "up") {
    setEnvironmentIndex((i) => Math.max(0, i - 1));
  }
  if (nav === "down") {
    setEnvironmentIndex((i) => Math.min(environments().length - 1, i + 1));
  }
  if (key.name === "space") {
    const idx = environmentIndex();
    setEnvironmentActiveIndex(idx);
    const proj = selectedProject();
    const env = environments()[idx];
    if (proj && env) {
      loadDevicesForEnvironment(config, proj.id, env.id);
    }
  }
  if (key.name === "n" && selectedProject()) {
    setModal({ type: "environment" });
  }
  if (key.name === "e") {
    const env = environments()[environmentIndex()];
    if (env) {
      setModal({ type: "environment", environment: env });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    const env = environments()[environmentIndex()];
    if (proj && env) {
      config.deleteEnvironment(proj.id, env.id);
      loadEnvironmentsForProject(config, proj.id);
    }
  }
}

function handleTemplatesKey(
  config: ConfigProvider,
  key: KeyInput,
  nav: string
) {
  if (nav === "up") {
    setTemplateIndex((i) => Math.max(0, i - 1));
  }
  if (nav === "down") {
    setTemplateIndex((i) => Math.min(templates().length - 1, i + 1));
  }
  if (key.name === "space") {
    setTemplateActiveIndex(templateIndex());
  }
  if (key.name === "n" && selectedProject()) {
    setModal({ type: "template" });
  }
  if (key.name === "e") {
    const tpl = templates()[templateIndex()];
    if (tpl) {
      setModal({ type: "template", template: tpl });
    }
  }
  if (key.name === "D") {
    const proj = selectedProject();
    const tpl = templates()[templateIndex()];
    if (proj && tpl) {
      config.saveTemplates(
        proj.id,
        templates().filter((t) => t.id !== tpl.id)
      );
      loadTemplatesForProject(config, proj.id);
    }
  }
}

function handleDevicesKey(config: ConfigProvider, key: KeyInput, nav: string) {
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
    config.saveDevices(
      proj.id,
      env.id,
      devices().filter((d) => d.id !== dev.id)
    );
    loadDevicesForEnvironment(config, proj.id, env.id);
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

function handleKey(config: ConfigProvider, key: KeyInput) {
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
  if (key.name === "t" && key.shift) {
    setModal({ type: "theme" });
    return;
  }
  if (key.name === "m") {
    setModal({ type: "message" });
    return;
  }
  if (key.name === "s" || key.name === "return") {
    if (selectedEnvironment()) {
      setModal({ type: "send" });
    }
    return;
  }
  const nav = navName(key);
  const f = focused();
  if (f === "projects") {
    handleProjectsKey(config, key, nav);
  } else if (f === "environments") {
    handleEnvironmentsKey(config, key, nav);
  } else if (f === "templates") {
    handleTemplatesKey(config, key, nav);
  } else if (f === "devices") {
    handleDevicesKey(config, key, nav);
  } else if (f === "console") {
    handleConsoleKey(nav);
  }
}

interface Props {
  services: AppServices;
}

export const App = (props: Props) => {
  const { config } = props.services;
  const dims = useTerminalDimensions();
  loadProjects(config);

  const initialTheme = config.readSettings().theme;

  useKeyboard((key) => handleKey(config, key));

  const W = () => dims().width ?? 80;
  const H = () => dims().height ?? 24;
  const leftW = () => Math.floor(W() * 0.35);
  const leftH = () => H() - 3;
  const panelH = () => Math.floor(leftH() / 3);
  const devicesH = () => Math.floor(leftH() * 0.6);
  const consoleH = () => leftH() - devicesH();

  return (
    <ServicesContext.Provider value={props.services}>
      <ThemeProvider initialTheme={initialTheme}>
        <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
          <box style={{ flexDirection: "row", flexGrow: 1 }}>
            <box style={{ width: leftW(), flexDirection: "column" }}>
              <TemplateList height={panelH()} width={leftW()} />
              <EnvironmentList height={panelH()} width={leftW()} />
              <ProjectList height={panelH()} width={leftW()} />
            </box>
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
              device={
                (modal() as Extract<ModalState, { type: "device" }>).device
              }
            />
          </Show>
          <Show when={modal().type === "message"}>
            <MessageModal />
          </Show>
          <Show when={modal().type === "send"}>
            <SendModal />
          </Show>
          <Show when={modal().type === "theme"}>
            <ThemeModal />
          </Show>
        </box>
      </ThemeProvider>
    </ServicesContext.Provider>
  );
};
