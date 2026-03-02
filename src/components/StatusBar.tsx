import { focused, modal } from "../store"
import { Show } from "solid-js"

export const StatusBar = () => {
  const isModal = () => modal().type !== "none"

  return (
    <box style={{ width: "100%", padding: 1, backgroundColor: "#222222" }}>
      <Show when={!isModal()}>
        <text style={{ color: "#888888" }}>
          <span style={{ color: "#FFFF00" }}>1-5</span>:pane
          <span style={{ color: "#00FFFF" }}> j/k</span>:↑↓
          <span style={{ color: "#00FFFF" }}> n</span>:new
          <span style={{ color: "#00FFFF" }}> e</span>:edit
          <span style={{ color: "#FF4444" }}> D</span>:delete
          <span style={{ color: "#00FFFF" }}> m</span>:compose
          <span style={{ color: "#FFAA00" }}> t</span>:template
          <span style={{ color: "#00FF00" }}> s</span>:send
          <span style={{ color: "#FF4444" }}> q</span>:quit
        </text>
      </Show>
    </box>
  )
}
