import { randomUUID } from "node:crypto";
import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { useServices } from "../../lib/services-context";
import { useTheme } from "../../lib/theme-context";
import type { Environment } from "../../lib/types";
import {
  loadEnvironmentsForProject,
  selectedProject,
  setModal,
} from "../../store";

interface Props {
  environment?: Environment;
}

type Field = "name" | "path";

export const EnvironmentModal = (props: Props) => {
  const { config } = useServices();
  const { theme } = useTheme();
  const t = theme;
  const isEdit = !!props.environment;
  const [name, setName] = createSignal(props.environment?.name ?? "");
  const [path, setPath] = createSignal(
    props.environment?.serviceAccountPath ?? ""
  );
  const [field, setField] = createSignal<Field>("name");
  const [error, setError] = createSignal("");

  function submit() {
    if (!name().trim()) {
      setError("Name is required");
      return;
    }
    if (!path().trim()) {
      setError("Service account path is required");
      return;
    }
    const proj = selectedProject();
    if (!proj) {
      return;
    }
    const env: Environment = {
      id: props.environment?.id ?? randomUUID(),
      name: name().trim(),
      serviceAccountPath: path().trim(),
      createdAt: props.environment?.createdAt ?? new Date().toISOString(),
    };
    config.saveEnvironment(proj.id, env);
    loadEnvironmentsForProject(config, proj.id);
    setModal({ type: "none" });
  }

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "tab") {
      setField((f) => (f === "name" ? "path" : "name"));
      return;
    }
    if (key.name === "return") {
      if (field() === "name") {
        setField("path");
        return;
      }
      submit();
      return;
    }
    if (key.name === "backspace") {
      if (field() === "name") {
        setName((n) => n.slice(0, -1));
      } else {
        setPath((p) => p.slice(0, -1));
      }
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      if (field() === "name") {
        setName((n) => n + key.sequence);
      } else {
        setPath((p) => p + key.sequence);
      }
    }
  });

  const active = (f: Field) =>
    field() === f ? t().fieldBorderActive : t().fieldBorder;

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
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
        <strong>{isEdit ? "Edit Environment" : "New Environment"}</strong>
      </text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        Name (e.g. dev, uat, prod)
      </text>
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
        Service Account Path
      </text>
      <box
        style={{
          borderStyle: "single",
          borderColor: active("path"),
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{path() || " "}</text>
      </box>
      <text style={{ fg: t().accentDanger, marginTop: 1 }}>{error()}</text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accent }}>tab</span>:next
        <span style={{ fg: t().accent }}> enter</span>:save
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
