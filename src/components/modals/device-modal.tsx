import { randomUUID } from "node:crypto";
import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { useServices } from "../../lib/services-context";
import { useTheme } from "../../lib/theme-context";
import type { Device } from "../../lib/types";
import {
  loadDevicesForEnvironment,
  selectedEnvironment,
  selectedProject,
  setModal,
} from "../../store";

interface Props {
  device?: Device;
}

type Field = "name" | "platform" | "token";

export const DeviceModal = (props: Props) => {
  const { config } = useServices();
  const { theme } = useTheme();
  const t = theme;
  const isEdit = !!props.device;
  const [name, setName] = createSignal(props.device?.name ?? "");
  const [platform, setPlatform] = createSignal<"ios" | "android">(
    props.device?.platform ?? "ios"
  );
  const [token, setToken] = createSignal(props.device?.token ?? "");
  const [field, setField] = createSignal<Field>("name");
  const [error, setError] = createSignal("");

  const fields: Field[] = ["name", "platform", "token"];

  function submit() {
    if (!name().trim()) {
      setError("Name is required");
      return;
    }
    if (!token().trim()) {
      setError("Token is required");
      return;
    }
    const project = selectedProject();
    const env = selectedEnvironment();
    if (!(project && env)) {
      return;
    }
    const device: Device = {
      id: props.device?.id ?? randomUUID(),
      name: name().trim(),
      platform: platform(),
      token: token().trim(),
      createdAt: props.device?.createdAt ?? new Date().toISOString(),
    };
    const existing = config.listDevices(project.id, env.id);
    const updated = isEdit
      ? existing.map((d) => (d.id === device.id ? device : d))
      : [...existing, device];
    config.saveDevices(project.id, env.id, updated);
    loadDevicesForEnvironment(config, project.id, env.id);
    setModal({ type: "none" });
  }

  function handleTextKey(key: {
    name: string;
    sequence?: string;
    ctrl?: boolean;
  }) {
    if (key.name === "backspace") {
      if (field() === "name") {
        setName((n) => n.slice(0, -1));
      } else if (field() === "token") {
        setToken((tok) => tok.slice(0, -1));
      }
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") {
        setName((n) => n + key.sequence);
      } else if (field() === "token") {
        setToken((tok) => tok + key.sequence);
      }
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
    if (key.name === "return") {
      const idx = fields.indexOf(field());
      if (idx < fields.length - 1) {
        setField(fields[idx + 1]);
        return;
      }
      submit();
      return;
    }
    if (field() === "platform") {
      if (key.name === "left" || key.name === "right") {
        setPlatform((p) => (p === "ios" ? "android" : "ios"));
      }
      return;
    }
    handleTextKey(key);
  });

  const fieldBorder = (f: Field) =>
    field() === f ? t().fieldBorderActive : t().fieldBorder;

  return (
    <box
      style={{
        position: "absolute",
        top: "15%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().modalBorder,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>{isEdit ? "Edit Device" : "Add Device"}</strong>
      </text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Name</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: fieldBorder("name"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{name() || " "}</text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Platform</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: fieldBorder("platform"),
          padding: 1,
        }}
      >
        <text style={{ fg: platform() === "ios" ? t().accent : t().textMuted }}>
          ios
        </text>
        <text style={{ fg: t().textMuted }}> | </text>
        <text
          style={{
            fg: platform() === "android" ? t().accent : t().textMuted,
          }}
        >
          android
        </text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>FCM Token</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: fieldBorder("token"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{token() || " "}</text>
      </box>
      <text style={{ fg: t().accentDanger, marginTop: 1 }}>{error()}</text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accent }}>tab</span>:next
        <span style={{ fg: t().accent }}> ←→</span>:toggle platform
        <span style={{ fg: t().accent }}> enter</span>:confirm
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
