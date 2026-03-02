import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import type { Project, Device, FcmMessage, ModalState } from "./lib/types"
import { listProjects, listDevices } from "./lib/config"

// Panel focus
export const [focused, setFocused] = createSignal<"projects" | "devices">("projects")

// Projects
export const [projects, setProjects] = createSignal<Project[]>([])
export const [projectIndex, setProjectIndex] = createSignal(0)
export const selectedProject = () => projects()[projectIndex()] ?? null

// Devices
export const [devices, setDevices] = createSignal<Device[]>([])
export const [deviceIndex, setDeviceIndex] = createSignal(0)
export const [selectedDeviceIds, setSelectedDeviceIds] = createSignal(new Set<string>())

// Modal
export const [modal, setModal] = createSignal<ModalState>({ type: "none" })

// Default message (edited in MessageModal, reused across sends)
export const [message, setMessage] = createStore<FcmMessage>({
  notification: { title: "", body: "" },
  data: {},
  android: { priority: "high" },
  apns: {
    headers: { "apns-priority": "10" },
    payload: { aps: { contentAvailable: 1, mutableContent: 1 } },
  },
})

export function loadProjects() {
  const ps = listProjects()
  setProjects(ps)
  setProjectIndex(0)
  if (ps.length > 0) loadDevicesForProject(ps[0].id)
}

export function loadDevicesForProject(projectId: string) {
  setDevices(listDevices(projectId))
  setDeviceIndex(0)
  setSelectedDeviceIds(new Set())
}

export function toggleDevice(id: string) {
  setSelectedDeviceIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}
