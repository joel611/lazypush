import { randomUUID } from "node:crypto";
import { useKeyboard } from "@opentui/solid";
import { createSignal } from "solid-js";
import { useServices } from "../../lib/services-context";
import { useTheme } from "../../lib/theme-context";
import type { Project } from "../../lib/types";
import { loadProjects, setModal } from "../../store";

interface Props {
  project?: Project;
}

export const ProjectModal = (props: Props) => {
  const { config } = useServices();
  const { theme } = useTheme();
  const t = theme;
  const isEdit = !!props.project;
  const [name, setName] = createSignal(props.project?.name ?? "");
  const [error, setError] = createSignal("");

  function submit() {
    if (!name().trim()) {
      setError("Name is required");
      return;
    }
    const project: Project = {
      id: props.project?.id ?? randomUUID(),
      name: name().trim(),
      createdAt: props.project?.createdAt ?? new Date().toISOString(),
    };
    config.saveProject(project);
    loadProjects(config);
    setModal({ type: "none" });
  }

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "return") {
      submit();
      return;
    }
    if (key.name === "backspace") {
      setName((n) => n.slice(0, -1));
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      setName((n) => n + key.sequence);
    }
  });

  return (
    <box
      style={{
        position: "absolute",
        top: "30%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().modalBorder,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>{isEdit ? "Edit Project" : "New Project"}</strong>
      </text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>Name</text>
      <box
        style={{
          borderStyle: "single",
          borderColor: t().fieldBorderActive,
          padding: 1,
        }}
      >
        <text style={{ fg: t().text }}>{name() || " "}</text>
      </box>
      <text style={{ fg: t().accentDanger, marginTop: 1 }}>{error()}</text>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accent }}>enter</span>:save
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
