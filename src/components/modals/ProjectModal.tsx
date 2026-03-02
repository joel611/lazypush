import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, loadProjects } from "../../store"
import { saveProject } from "../../lib/config"
import type { Project } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  project?: Project
}

export const ProjectModal = (props: Props) => {
  const isEdit = !!props.project
  const [name, setName] = createSignal(props.project?.name ?? "")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    const project: Project = {
      id: props.project?.id ?? randomUUID(),
      name: name().trim(),
      createdAt: props.project?.createdAt ?? new Date().toISOString(),
    }
    saveProject(project)
    loadProjects()
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.name === "return") { submit(); return }
    if (key.name === "backspace") setName(n => n.slice(0, -1))
    else if (key.sequence && key.sequence.length === 1 && !key.ctrl) setName(n => n + key.sequence)
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "30%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Project" : "New Project"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box style={{ borderStyle: "single", borderColor: "#00FFFF", padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>enter</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
