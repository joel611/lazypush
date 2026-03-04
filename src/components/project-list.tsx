import { For } from "solid-js";
import { focused, projectActiveIndex, projectIndex, projects } from "../store";

interface Props {
  height: number;
  width: number;
}

function itemFg(isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return "#111111";
  }
  if (isActive) {
    return "#00FFFF";
  }
  return "#888888";
}

function itemBg(isCursor: boolean, isActive: boolean): string {
  if (!isCursor) {
    return "transparent";
  }
  if (isActive) {
    return "#00FFFF";
  }
  return "#666666";
}

function itemPrefix(isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return "> ";
  }
  if (isActive) {
    return "● ";
  }
  return "  ";
}

export const ProjectList = (props: Props) => {
  const isFocused = () => focused() === "projects";

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#555555",
        padding: 1,
      }}
    >
      <text fg="#FFFFFF">
        <strong>
          <span style={{ fg: "#FFFF00" }}>3</span> Projects
        </strong>
      </text>
      <For each={projects()}>
        {(project, i) => {
          const isCursor = () => i() === projectIndex();
          const isActive = () => i() === projectActiveIndex();
          return (
            <text
              style={{
                fg: itemFg(isCursor(), isActive()),
                bg: itemBg(isCursor(), isActive()),
              }}
            >
              {itemPrefix(isCursor(), isActive())}
              {isActive() ? <strong>{project.name}</strong> : project.name}
            </text>
          );
        }}
      </For>
    </box>
  );
};
