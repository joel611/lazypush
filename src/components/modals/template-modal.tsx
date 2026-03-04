import { randomUUID } from "node:crypto";
import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { useServices } from "../../lib/services-context";
import { useTheme } from "../../lib/theme-context";
import type { MessageTemplate } from "../../lib/types";
import {
  loadTemplatesForProject,
  message,
  selectedProject,
  setModal,
  templates,
} from "../../store";

interface Props {
  template?: MessageTemplate;
}

type Field = "name" | "title" | "body" | "data";

export const TemplateModal = (props: Props) => {
  const { config } = useServices();
  const { theme } = useTheme();
  const t = theme;
  const isEdit = !!props.template;
  const [name, setName] = createSignal(props.template?.name ?? "");
  const [title, setTitle] = createSignal(
    props.template?.message.notification.title ?? message.notification.title
  );
  const [body, setBody] = createSignal(
    props.template?.message.notification.body ?? message.notification.body
  );
  const [dataStr, setDataStr] = createSignal(
    props.template?.message.data
      ? JSON.stringify(props.template.message.data, null, 2)
      : ""
  );
  const [field, setField] = createSignal<Field>("name");
  const [error, setError] = createSignal("");

  const fields: Field[] = ["name", "title", "body", "data"];

  function submit() {
    if (!name().trim()) {
      setError("Template name is required");
      return;
    }
    let data: Record<string, string> | undefined;
    if (dataStr().trim()) {
      try {
        data = JSON.parse(dataStr().trim());
      } catch {
        setError("data must be valid JSON");
        return;
      }
    }
    const proj = selectedProject();
    if (!proj) {
      return;
    }
    const tpl: MessageTemplate = {
      id: props.template?.id ?? randomUUID(),
      name: name().trim(),
      message: {
        notification: { title: title(), body: body() },
        data,
        android: { priority: "high" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { contentAvailable: true, mutableContent: true } },
        },
      },
      createdAt: props.template?.createdAt ?? new Date().toISOString(),
    };
    const updated = isEdit
      ? templates().map((tplItem) => (tplItem.id === tpl.id ? tpl : tplItem))
      : [...templates(), tpl];
    config.saveTemplates(proj.id, updated);
    loadTemplatesForProject(config, proj.id);
    setModal({ type: "none" });
  }

  function handleBackspace() {
    if (field() === "name") {
      setName((n) => n.slice(0, -1));
    } else if (field() === "title") {
      setTitle((s) => s.slice(0, -1));
    } else if (field() === "body") {
      setBody((b) => b.slice(0, -1));
    } else if (field() === "data") {
      setDataStr((d) => d.slice(0, -1));
    }
  }

  function handleCharInput(char: string) {
    if (field() === "name") {
      setName((n) => n + char);
    } else if (field() === "title") {
      setTitle((s) => s + char);
    } else if (field() === "body") {
      setBody((b) => b + char);
    } else if (field() === "data") {
      setDataStr((d) => d + char);
    }
  }

  function handleKeyInput(key: {
    name: string;
    sequence?: string;
    ctrl?: boolean;
  }) {
    if (key.name === "backspace") {
      handleBackspace();
      return;
    }
    if (!key.sequence || key.ctrl) {
      return;
    }
    const char =
      field() === "data" && key.name === "return" ? "\n" : key.sequence;
    if (char.length === 1 || (field() === "data" && char === "\n")) {
      handleCharInput(char);
    }
  }

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.ctrl && key.name === "s") {
      submit();
      return;
    }
    if (key.name === "tab") {
      const idx = fields.indexOf(field());
      setField(fields[(idx + 1) % fields.length]);
      return;
    }
    if (key.name === "return" && field() !== "data") {
      const idx = fields.indexOf(field());
      if (idx < fields.length - 1) {
        setField(fields[idx + 1]);
        return;
      }
      submit();
      return;
    }
    handleKeyInput(key);
  });

  const active = (f: Field) =>
    field() === f ? t().accentTemplate : t().fieldBorder;

  return (
    <box
      style={{
        position: "absolute",
        top: "5%",
        left: "10%",
        width: "80%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().accentTemplate,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>{isEdit ? "Edit Template" : "New Template"}</strong>
      </text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Template Name</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("name"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{name() || " "}</text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        Notification Title
      </text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("title"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{title() || " "}</text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Notification Body</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("body"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{body() || " "}</text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Data (JSON)</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("data"),
          padding: 1,
          height: 4,
        }}
      >
        <text style={{ fg: t().text }}>{dataStr() || " "}</text>
      </box>
      <text style={{ fg: t().accentDanger, marginTop: 1 }}>{error()}</text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accentTemplate }}>tab</span>:next
        <span style={{ fg: t().accentTemplate }}> ctrl+s</span>:save
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
