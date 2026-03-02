import { For } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { setModal } from "../../store"
import type { SendResult } from "../../lib/types"

interface Props {
  results: SendResult[]
}

export const ResultModal = (props: Props) => {
  const successCount = () => props.results.filter(r => r.success).length

  useKeyboard((key) => {
    if (key.name === "escape" || key.name === "return" || key.name === "q") {
      setModal({ type: "none" })
    }
  })

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "60%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: successCount() === props.results.length ? "#00FF00" : "#FF4444",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>
        Send Results — {successCount()}/{props.results.length} succeeded
      </text>
      <For each={props.results}>
        {(result) => (
          <text style={{ marginTop: 1, color: result.success ? "#00FF00" : "#FF4444" }}>
            {result.success ? "✓" : "✗"} {result.deviceName}
            {result.error ? `: ${result.error}` : ""}
          </text>
        )}
      </For>
      <text style={{ color: "#888888", marginTop: 2 }}>
        <span style={{ color: "#00FFFF" }}>enter/esc</span>:close
      </text>
    </box>
  )
}
