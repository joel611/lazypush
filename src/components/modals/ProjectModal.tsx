import { createSignal, onMount } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, loadProjects, projects, projectIndex } from "../../store"
import { saveProject } from "../../lib/config"
import type { Project } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  project?: Project
}

export const ProjectModal = (props: Props) => {
  const isEdit = !!props.project
  const [name, setName] = createSignal(props.project?.name ?? "")
  const [path, setPath] = createSignal(props.project?.serviceAccountPath ?? "")
  const [field, setField] = createSignal<"name" | "path">("name")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    if (!path().trim()) { setError("Service account path is required"); return }
    const project: Project = {
      id: props.project?.id ?? randomUUID(),
      name: name().trim(),
      serviceAccountPath: path().trim(),
      createdAt: props.project?.createdAt ?? new Date().toISOString(),
    }
    saveProject(project)
    loadProjects()
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "tab") { setField(f => f === "name" ? "path" : "name"); return }
    if (key.name === "return") {
      if (field() === "name") { setField("path"); return }
      submit()
      return
    }
    // Basic text editing for focused field
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else setPath(p => p.slice(0, -1))
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") setName(n => n + key.sequence)
      else setPath(p => p + key.sequence)
    }
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Project" : "New Project"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box style={{ borderStyle: "single", borderColor: field() === "name" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Service Account Path</text>
      <box style={{ borderStyle: "single", borderColor: field() === "path" ? "#00FFFF" : "#444444", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{path() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next field
        <span style={{ color: "#00FFFF" }}> enter</span>:confirm
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
