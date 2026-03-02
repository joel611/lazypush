import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, selectedProject, loadEnvironmentsForProject } from "../../store"
import { saveEnvironment } from "../../lib/config"
import type { Environment } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  environment?: Environment
}

type Field = "name" | "path"

export const EnvironmentModal = (props: Props) => {
  const isEdit = !!props.environment
  const [name, setName] = createSignal(props.environment?.name ?? "")
  const [path, setPath] = createSignal(props.environment?.serviceAccountPath ?? "")
  const [field, setField] = createSignal<Field>("name")
  const [error, setError] = createSignal("")

  function submit() {
    if (!name().trim()) { setError("Name is required"); return }
    if (!path().trim()) { setError("Service account path is required"); return }
    const proj = selectedProject()
    if (!proj) return
    const env: Environment = {
      id: props.environment?.id ?? randomUUID(),
      name: name().trim(),
      serviceAccountPath: path().trim(),
      createdAt: props.environment?.createdAt ?? new Date().toISOString(),
    }
    saveEnvironment(proj.id, env)
    loadEnvironmentsForProject(proj.id)
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
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else setPath(p => p.slice(0, -1))
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") setName(n => n + key.sequence)
      else setPath(p => p + key.sequence)
    }
  })

  const active = (f: Field) => field() === f ? "#00FFFF" : "#444444"

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "15%",
        width: "70%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Environment" : "New Environment"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name (e.g. dev, uat, prod)</text>
      <box style={{ borderStyle: "single", borderColor: active("name"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Service Account Path</text>
      <box style={{ borderStyle: "single", borderColor: active("path"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{path() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next
        <span style={{ color: "#00FFFF" }}> enter</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
