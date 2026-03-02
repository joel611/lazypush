import { For } from "solid-js"
import { templates, templateIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const TemplateList = (props: Props) => {
  const isFocused = () => focused() === "templates"

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#FFAA00" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Templates</text>
      <For each={templates()}>
        {(tpl, i) => (
          <text
            style={{
              color: i() === templateIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === templateIndex() ? "#FFAA00" : "transparent",
            }}
          >
            {i() === templateIndex() ? "> " : "  "}{tpl.name}
          </text>
        )}
      </For>
    </box>
  )
}
