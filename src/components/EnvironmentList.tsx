import { For } from "solid-js"
import { environments, environmentIndex, focused } from "../store"

interface Props {
  width: number
  height: number
}

export const EnvironmentList = (props: Props) => {
  const isFocused = () => focused() === "environments"

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FF88" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Environments</text>
      <For each={environments()}>
        {(env, i) => (
          <text
            style={{
              color: i() === environmentIndex() ? "#000000" : "#CCCCCC",
              backgroundColor: i() === environmentIndex() ? "#00FF88" : "transparent",
            }}
          >
            {i() === environmentIndex() ? "> " : "  "}{env.name}
          </text>
        )}
      </For>
    </box>
  )
}
