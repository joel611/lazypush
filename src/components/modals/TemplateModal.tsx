import { createSignal } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal, selectedProject, templates, loadTemplatesForProject, message } from "../../store"
import { saveTemplates } from "../../lib/config"
import type { MessageTemplate } from "../../lib/types"
import { randomUUID } from "crypto"

interface Props {
  template?: MessageTemplate
}

type Field = "name" | "title" | "body" | "data"

export const TemplateModal = (props: Props) => {
  const isEdit = !!props.template
  const [name, setName] = createSignal(props.template?.name ?? "")
  const [title, setTitle] = createSignal(props.template?.message.notification.title ?? message.notification.title)
  const [body, setBody] = createSignal(props.template?.message.notification.body ?? message.notification.body)
  const [dataStr, setDataStr] = createSignal(
    props.template?.message.data ? JSON.stringify(props.template.message.data, null, 2) : ""
  )
  const [field, setField] = createSignal<Field>("name")
  const [error, setError] = createSignal("")

  const fields: Field[] = ["name", "title", "body", "data"]

  function submit() {
    if (!name().trim()) { setError("Template name is required"); return }
    let data: Record<string, string> | undefined
    if (dataStr().trim()) {
      try { data = JSON.parse(dataStr().trim()) } catch { setError("data must be valid JSON"); return }
    }
    const proj = selectedProject()
    if (!proj) return
    const tpl: MessageTemplate = {
      id: props.template?.id ?? randomUUID(),
      name: name().trim(),
      message: {
        notification: { title: title(), body: body() },
        data,
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" }, payload: { aps: { contentAvailable: 1, mutableContent: 1 } } },
      },
      createdAt: props.template?.createdAt ?? new Date().toISOString(),
    }
    const updated = isEdit
      ? templates().map(t => t.id === tpl.id ? tpl : t)
      : [...templates(), tpl]
    saveTemplates(proj.id, updated)
    loadTemplatesForProject(proj.id)
    setModal({ type: "none" })
  }

  useKeyboard((key) => {
    if (key.name === "escape") { setModal({ type: "none" }); return }
    if (key.ctrl && key.name === "s") { submit(); return }
    if (key.name === "tab") {
      const idx = fields.indexOf(field())
      setField(fields[(idx + 1) % fields.length])
      return
    }
    if (key.name === "return" && field() !== "data") {
      const idx = fields.indexOf(field())
      if (idx < fields.length - 1) { setField(fields[idx + 1]); return }
      submit(); return
    }
    if (key.name === "backspace") {
      if (field() === "name") setName(n => n.slice(0, -1))
      else if (field() === "title") setTitle(t => t.slice(0, -1))
      else if (field() === "body") setBody(b => b.slice(0, -1))
      else if (field() === "data") setDataStr(d => d.slice(0, -1))
    } else if (key.sequence && !key.ctrl) {
      const char = field() === "data" && key.name === "return" ? "\n" : key.sequence
      if (char.length === 1 || (field() === "data" && char === "\n")) {
        if (field() === "name") setName(n => n + char)
        else if (field() === "title") setTitle(t => t + char)
        else if (field() === "body") setBody(b => b + char)
        else if (field() === "data") setDataStr(d => d + char)
      }
    }
  })

  const active = (f: Field) => field() === f ? "#FFAA00" : "#444444"

  return (
    <box
      style={{
        position: "absolute",
        top: "5%",
        left: "10%",
        width: "80%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#FFAA00",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>{isEdit ? "Edit Template" : "New Template"}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>Template Name</text>
      <box style={{ borderStyle: "single", borderColor: active("name"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Notification Title</text>
      <box style={{ borderStyle: "single", borderColor: active("title"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{title() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Notification Body</text>
      <box style={{ borderStyle: "single", borderColor: active("body"), padding: 1 }}>
        <text style={{ color: "#FFFFFF" }}>{body() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Data (JSON)</text>
      <box style={{ borderStyle: "single", borderColor: active("data"), padding: 1, height: 4 }}>
        <text style={{ color: "#FFFFFF" }}>{dataStr() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#FFAA00" }}>tab</span>:next
        <span style={{ color: "#FFAA00" }}> ctrl+s</span>:save
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  )
}
