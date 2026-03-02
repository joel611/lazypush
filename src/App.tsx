import { Show } from "solid-js"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import {
  focused, setFocused,
  projects, projectIndex, setProjectIndex, selectedProject,
  environments, environmentIndex, setEnvironmentIndex, selectedEnvironment,
  templates, templateIndex, setTemplateIndex, selectedTemplate,
  devices, deviceIndex, setDeviceIndex,
  toggleDevice, selectedDeviceIds,
  modal, setModal,
  consoleOffset, setConsoleOffset, sendLog,
  loadProjects, loadEnvironmentsForProject, loadDevicesForEnvironment, loadTemplatesForProject,
} from "./store"
import { ProjectList } from "./components/ProjectList"
import { EnvironmentList } from "./components/EnvironmentList"
import { TemplateList } from "./components/TemplateList"
import { DeviceList } from "./components/DeviceList"
import { DebugConsole } from "./components/DebugConsole"
import { StatusBar } from "./components/StatusBar"
import { ProjectModal } from "./components/modals/ProjectModal"
import { EnvironmentModal } from "./components/modals/EnvironmentModal"
import { TemplateModal } from "./components/modals/TemplateModal"
import { DeviceModal } from "./components/modals/DeviceModal"
import { MessageModal } from "./components/modals/MessageModal"
import { SendModal } from "./components/modals/SendModal"
import { deleteProject, deleteEnvironment, saveDevices, saveTemplates } from "./lib/config"

const FOCUS_ORDER = ["projects", "environments", "templates", "devices", "console"] as const

const PANE_KEYS: Partial<Record<string, typeof FOCUS_ORDER[number]>> = {
  "1": "templates",
  "2": "environments",
  "3": "projects",
  "4": "devices",
  "5": "console",
}

export const App = () => {
  const dims = useTerminalDimensions()
  loadProjects()

  useKeyboard((key) => {
    if (modal().type !== "none") return

    // Number keys jump to pane
    const pane = PANE_KEYS[key.name]
    if (pane) { setFocused(pane); return }

    if (key.name === "q") process.exit(0)

    // Global: compose one-off message
    if (key.name === "m") { setModal({ type: "message" }); return }

    // Global: open send modal
    if (key.name === "s" || key.name === "return") {
      const env = selectedEnvironment()
      if (!env) return
      setModal({ type: "send" })
      return
    }

    // nvim movement aliases
    const nav = key.name === "j" ? "down" : key.name === "k" ? "up" : key.name

    // ── Projects panel ──────────────────────────────────────────────────────
    if (focused() === "projects") {
      if (nav === "up") {
        const next = Math.max(0, projectIndex() - 1)
        setProjectIndex(next)
        const proj = projects()[next]
        if (proj) loadEnvironmentsForProject(proj.id)
      }
      if (nav === "down") {
        const next = Math.min(projects().length - 1, projectIndex() + 1)
        setProjectIndex(next)
        const proj = projects()[next]
        if (proj) loadEnvironmentsForProject(proj.id)
      }
      if (key.name === "n") setModal({ type: "project" })
      if (key.name === "e" && selectedProject()) setModal({ type: "project", project: selectedProject()! })
      if (key.name === "D" && selectedProject()) {
        deleteProject(selectedProject()!.id)
        loadProjects()
      }
    }

    // ── Environments panel ──────────────────────────────────────────────────
    if (focused() === "environments") {
      if (nav === "up") {
        const next = Math.max(0, environmentIndex() - 1)
        setEnvironmentIndex(next)
        const proj = selectedProject()
        const env = environments()[next]
        if (proj && env) loadDevicesForEnvironment(proj.id, env.id)
      }
      if (nav === "down") {
        const next = Math.min(environments().length - 1, environmentIndex() + 1)
        setEnvironmentIndex(next)
        const proj = selectedProject()
        const env = environments()[next]
        if (proj && env) loadDevicesForEnvironment(proj.id, env.id)
      }
      if (key.name === "n" && selectedProject()) setModal({ type: "environment" })
      if (key.name === "e" && selectedEnvironment()) setModal({ type: "environment", environment: selectedEnvironment()! })
      if (key.name === "D" && selectedProject() && selectedEnvironment()) {
        deleteEnvironment(selectedProject()!.id, selectedEnvironment()!.id)
        loadEnvironmentsForProject(selectedProject()!.id)
      }
    }

    // ── Templates panel ─────────────────────────────────────────────────────
    if (focused() === "templates") {
      if (nav === "up") setTemplateIndex(i => Math.max(0, i - 1))
      if (nav === "down") setTemplateIndex(i => Math.min(templates().length - 1, i + 1))
      if (key.name === "n" && selectedProject()) setModal({ type: "template" })
      if (key.name === "e" && selectedTemplate()) setModal({ type: "template", template: selectedTemplate()! })
      if (key.name === "D" && selectedProject() && selectedTemplate()) {
        const updated = templates().filter(t => t.id !== selectedTemplate()!.id)
        saveTemplates(selectedProject()!.id, updated)
        loadTemplatesForProject(selectedProject()!.id)
      }
    }

    // ── Devices panel ───────────────────────────────────────────────────────
    if (focused() === "devices") {
      if (nav === "up") setDeviceIndex(i => Math.max(0, i - 1))
      if (nav === "down") setDeviceIndex(i => Math.min(devices().length - 1, i + 1))
      if (key.name === "space") {
        const dev = devices()[deviceIndex()]
        if (dev) toggleDevice(dev.id)
      }
      if (key.name === "a" && selectedProject() && selectedEnvironment()) setModal({ type: "device" })
      if (key.name === "e") {
        const dev = devices()[deviceIndex()]
        if (dev) setModal({ type: "device", device: dev })
      }
      if (key.name === "D") {
        const proj = selectedProject()
        const env = selectedEnvironment()
        if (!proj || !env) return
        const dev = devices()[deviceIndex()]
        if (!dev) return
        const updated = devices().filter(d => d.id !== dev.id)
        saveDevices(proj.id, env.id, updated)
        loadDevicesForEnvironment(proj.id, env.id)
      }
    }

    // ── Console panel ───────────────────────────────────────────────────────
    if (focused() === "console") {
      if (nav === "up") setConsoleOffset(o => Math.max(0, o - 1))
      if (nav === "down") setConsoleOffset(o => Math.min(sendLog().length - 1, o + 1))
    }
  })

  const W = () => dims().width ?? 80
  const H = () => dims().height ?? 24
  const leftW = () => Math.floor(W() * 0.35)
  const leftH = () => H() - 3  // minus status bar
  const panelH = () => Math.floor(leftH() / 3)
  const devicesH = () => Math.floor(leftH() * 0.6)
  const consoleH = () => leftH() - devicesH()

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        {/* Left column */}
        <box style={{ width: leftW(), flexDirection: "column" }}>
          <TemplateList width={leftW()} height={panelH()} />
          <EnvironmentList width={leftW()} height={panelH()} />
          <ProjectList width={leftW()} height={panelH()} />
        </box>
        {/* Right column */}
        <box style={{ flexGrow: 1, flexDirection: "column" }}>
          <DeviceList height={devicesH()} />
          <DebugConsole height={consoleH()} />
        </box>
      </box>
      <StatusBar />

      <Show when={modal().type === "project"}>
        <ProjectModal project={(modal() as any).project} />
      </Show>
      <Show when={modal().type === "environment"}>
        <EnvironmentModal environment={(modal() as any).environment} />
      </Show>
      <Show when={modal().type === "template"}>
        <TemplateModal template={(modal() as any).template} />
      </Show>
      <Show when={modal().type === "device"}>
        <DeviceModal device={(modal() as any).device} />
      </Show>
      <Show when={modal().type === "message"}>
        <MessageModal />
      </Show>
      <Show when={modal().type === "send"}>
        <SendModal />
      </Show>
    </box>
  )
}
