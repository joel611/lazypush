import { For } from "solid-js";
import { focused, projectIndex, projects } from "../store";

interface Props {
  height: number;
  width: number;
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
        borderColor: isFocused() ? "#00FFFF" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ fg: "#FFFFFF", bold: true }}>
        <span style={{ fg: "#FFFF00" }}>3</span> Projects
      </text>
      <For each={projects()}>
        {(project, i) => (
          <text
            style={{
              fg: i() === projectIndex() ? "#000000" : "#CCCCCC",
              bg: i() === projectIndex() ? "#00FFFF" : "transparent",
            }}
          >
            {i() === projectIndex() ? "> " : "  "}
            {project.name}
          </text>
        )}
      </For>
    </box>
  );
};
