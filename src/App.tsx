import { Show } from "solid-js"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import {
  focused, setFocused,
  projects, projectIndex, setProjectIndex, selectedProject,
  devices, deviceIndex, setDeviceIndex,
  toggleDevice, selectedDeviceIds,
  modal, setModal,
  message,
  loadProjects, loadDevicesForProject,
} from "./store"
import { ProjectList } from "./components/ProjectList"
import { DeviceList } from "./components/DeviceList"
import { StatusBar } from "./components/StatusBar"
import { ProjectModal } from "./components/modals/ProjectModal"
import { DeviceModal } from "./components/modals/DeviceModal"
import { MessageModal } from "./components/modals/MessageModal"
import { ResultModal } from "./components/modals/ResultModal"
import { deleteProject, listDevices, saveDevices } from "./lib/config"
import { sendNotification } from "./lib/fcm"

export const App = () => {
  const dims = useTerminalDimensions()

  // Load data on mount
  loadProjects()

  useKeyboard((key) => {
    // Block all navigation when a modal is open
    if (modal().type !== "none") return

    if (key.name === "q") process.exit(0)

    if (key.name === "tab") {
      setFocused(f => f === "projects" ? "devices" : "projects")
      return
    }

    // Project panel navigation
    if (focused() === "projects") {
      if (key.name === "up") {
        setProjectIndex(i => Math.max(0, i - 1))
        const proj = projects()[Math.max(0, projectIndex() - 1)]
        if (proj) loadDevicesForProject(proj.id)
      }
      if (key.name === "down") {
        setProjectIndex(i => Math.min(projects().length - 1, i + 1))
        const proj = projects()[Math.min(projects().length - 1, projectIndex() + 1)]
        if (proj) loadDevicesForProject(proj.id)
      }
      if (key.name === "n") setModal({ type: "project" })
      if (key.name === "e" && selectedProject()) setModal({ type: "project", project: selectedProject()! })
      if (key.name === "D" && selectedProject()) {
        deleteProject(selectedProject()!.id)
        loadProjects()
      }
    }

    // Device panel navigation
    if (focused() === "devices") {
      if (key.name === "up") setDeviceIndex(i => Math.max(0, i - 1))
      if (key.name === "down") setDeviceIndex(i => Math.min(devices().length - 1, i + 1))
      if (key.name === "space") {
        const dev = devices()[deviceIndex()]
        if (dev) toggleDevice(dev.id)
      }
      if (key.name === "a" && selectedProject()) setModal({ type: "device" })
      if (key.name === "e") {
        const dev = devices()[deviceIndex()]
        if (dev) setModal({ type: "device", device: dev })
      }
      if (key.name === "D") {
        const proj = selectedProject()
        if (!proj) return
        const dev = devices()[deviceIndex()]
        if (!dev) return
        const updated = devices().filter(d => d.id !== dev.id)
        saveDevices(proj.id, updated)
        loadDevicesForProject(proj.id)
      }
    }

    // Global
    if (key.name === "m") setModal({ type: "message" })

    if (key.name === "s" || key.name === "return") {
      const proj = selectedProject()
      if (!proj) return
      const targets = devices().filter(d => selectedDeviceIds().has(d.id))
      if (targets.length === 0) return
      sendNotification(proj.serviceAccountPath, targets, message)
        .then(results => setModal({ type: "result", results }))
        .catch(err => setModal({ type: "result", results: [{ deviceName: "Error", token: "", success: false, error: String(err) }] }))
    }
  })

  const projectPanelWidth = Math.floor((dims().width ?? 80) * 0.35)

  return (
    <box style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", flexGrow: 1 }}>
        <ProjectList width={projectPanelWidth} />
        <DeviceList />
      </box>
      <StatusBar />

      <Show when={modal().type === "project"}>
        <ProjectModal project={(modal() as any).project} />
      </Show>
      <Show when={modal().type === "device"}>
        <DeviceModal device={(modal() as any).device} />
      </Show>
      <Show when={modal().type === "message"}>
        <MessageModal />
      </Show>
      <Show when={modal().type === "result"}>
        <ResultModal results={(modal() as any).results} />
      </Show>
    </box>
  )
}
