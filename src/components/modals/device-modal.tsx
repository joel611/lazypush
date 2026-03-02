import { randomUUID } from "node:crypto";
import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { listDevices, saveDevices } from "../../lib/config";
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
    const existing = listDevices(project.id, env.id);
    const updated = isEdit
      ? existing.map((d) => (d.id === device.id ? device : d))
      : [...existing, device];
    saveDevices(project.id, env.id, updated);
    loadDevicesForEnvironment(project.id, env.id);
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
        setToken((t) => t.slice(0, -1));
      }
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") {
        setName((n) => n + key.sequence);
      } else if (field() === "token") {
        setToken((t) => t + key.sequence);
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

  return (
    <box
      style={{
        position: "absolute",
        top: "15%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FFFF",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>
        {isEdit ? "Edit Device" : "Add Device"}
      </text>
      <text style={{ color: "#888888", marginTop: 1 }}>Name</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: field() === "name" ? "#00FFFF" : "#444444",
          padding: 1,
        }}
      >
        <text style={{ color: "#FFFFFF" }}>{name() || " "}</text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>Platform</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: field() === "platform" ? "#00FFFF" : "#444444",
          padding: 1,
        }}
      >
        <text style={{ color: platform() === "ios" ? "#00FFFF" : "#888888" }}>
          ios
        </text>
        <text style={{ color: "#888888" }}> | </text>
        <text
          style={{ color: platform() === "android" ? "#00FFFF" : "#888888" }}
        >
          android
        </text>
      </box>
      <text style={{ color: "#888888", marginTop: 1 }}>FCM Token</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: field() === "token" ? "#00FFFF" : "#444444",
          padding: 1,
        }}
      >
        <text style={{ color: "#FFFFFF" }}>{token() || " "}</text>
      </box>
      <text style={{ color: "#FF4444", marginTop: 1 }}>{error()}</text>
      <text style={{ color: "#888888", marginTop: 1 }}>
        <span style={{ color: "#00FFFF" }}>tab</span>:next
        <span style={{ color: "#00FFFF" }}> ←→</span>:toggle platform
        <span style={{ color: "#00FFFF" }}> enter</span>:confirm
        <span style={{ color: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  );
};
