import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { useTheme } from "../../lib/theme-context";
import { message, setMessage, setModal } from "../../store";

type Field = "title" | "body" | "data";

export const MessageModal = () => {
  const { theme } = useTheme();
  const t = theme;
  const [field, setField] = createSignal<Field>("title");
  const [dataStr, setDataStr] = createSignal(
    Object.keys(message.data ?? {}).length > 0
      ? JSON.stringify(message.data, null, 2)
      : ""
  );
  const [error, setError] = createSignal("");

  const fields: Field[] = ["title", "body", "data"];

  function save() {
    let data: Record<string, string> | undefined;
    if (dataStr().trim()) {
      try {
        data = JSON.parse(dataStr().trim());
      } catch {
        setError("data must be valid JSON");
        return;
      }
    }
    setMessage("notification", "title", message.notification.title);
    setMessage("notification", "body", message.notification.body);
    setMessage("data", data ?? {});
    setModal({ type: "none" });
  }

  function handleBackspace() {
    if (field() === "title") {
      setMessage(
        "notification",
        "title",
        message.notification.title.slice(0, -1)
      );
    } else if (field() === "body") {
      setMessage(
        "notification",
        "body",
        message.notification.body.slice(0, -1)
      );
    } else if (field() === "data") {
      setDataStr((d) => d.slice(0, -1));
    }
  }

  function handleCharInput(char: string) {
    if (field() === "title") {
      setMessage("notification", "title", message.notification.title + char);
    } else if (field() === "body") {
      setMessage("notification", "body", message.notification.body + char);
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
      save();
      return;
    }
    // ctrl+s saves from any field
    if (key.ctrl && key.name === "s") {
      save();
      return;
    }
    handleKeyInput(key);
  });

  const active = (f: Field) =>
    field() === f ? t().fieldBorderActive : t().fieldBorder;

  return (
    <box
      style={{
        position: "absolute",
        top: "10%",
        left: "15%",
        width: "70%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().modalBorder,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>Compose Message</strong>
      </text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Title</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("title"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>
          {message.notification.title || " "}
        </text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Body</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("body"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{message.notification.body || " "}</text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Data (JSON)</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("data"),
          padding: 1,
          height: 5,
        }}
      >
        <text style={{ fg: t().text }}>{dataStr() || " "}</text>
      </box>
      <text style={{ fg: t().accentDanger, marginTop: 1 }}>{error()}</text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accent }}>tab</span>:next field
        <span style={{ fg: t().accent }}> ctrl+s</span>:save
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
