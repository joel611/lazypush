import { For } from "solid-js"
import { projects, projectIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const ProjectList = (props: Props) => {
  const isFocused = () => focused() === "projects"

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
      <text style={{ color: "#FFFFFF", bold: true }}>
        <span style={{ color: "#00FFFF" }}>3</span> Projects
      </text>
      <For each={projects()}>
        {(project, i) => (
          <text
            style={{
              color: i() === projectIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === projectIndex() ? "#00FFFF" : "transparent",
            }}
          >
            {i() === projectIndex() ? "> " : "  "}{project.name}
          </text>
        )}
      </For>
    </box>
  )
}
