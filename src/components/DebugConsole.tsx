import { For } from "solid-js"
import { sendLog, consoleOffset, focused } from "../store"

interface Props {
  height: number
}

export const DebugConsole = (props: Props) => {
  const isFocused = () => focused() === "console"

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#AAAAFF" : "#666666",
        padding: 1,
        overflow: "hidden",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Debug Console</text>
      <For each={sendLog().slice(consoleOffset())}>
        {(entry) => {
          const ts = new Date(entry.timestamp).toLocaleTimeString()
          const allOk = entry.results.every(r => r.success)
          const okCount = entry.results.filter(r => r.success).length
          const icon = allOk ? "✓" : "✗"
          const iconColor = allOk ? "#00FF00" : "#FF4444"
          const label = entry.templateName ? `${entry.templateName}` : "(one-off)"
          const target = entry.targetType === "topic"
            ? `topic:${entry.targetInfo}`
            : entry.targetType === "all"
            ? "all"
            : `devices (${okCount}/${entry.results.length})`

          return (
            <box style={{ flexDirection: "column", marginTop: 0 }}>
              <text>
                <span style={{ color: "#888888" }}>{ts} </span>
                <span style={{ color: iconColor }}>{icon} </span>
                <span style={{ color: "#FFFFFF" }}>{label}</span>
                <span style={{ color: "#888888" }}> → {target}</span>
              </text>
              <For each={entry.results.filter(r => !r.success)}>
                {(r) => (
                  <text style={{ color: "#FF4444", marginLeft: 2 }}>
                    ERR {r.deviceName}: {r.error}
                  </text>
                )}
              </For>
            </box>
          )
        }}
      </For>
    </box>
  )
}
