import { focused, modal } from "../store"
import { Show } from "solid-js"

export const StatusBar = () => {
  const isModal = () => modal().type !== "none"
  const isProjects = () => focused() === "projects"

  return (
    <box
      style={{
        width: "100%",
        flexDirection: "column",
        padding: 1,
        backgroundColor: "#222222",
      }}
    >
      <Show when={!isModal()}>
        <text style={{ color: "#888888" }}>
          <span style={{ color: "#00FFFF" }}>tab</span>:switch
          <span style={{ color: "#00FFFF" }}> n</span>:new-project
          <span style={{ color: "#00FFFF" }}> a</span>:add-device
          <span style={{ color: "#00FFFF" }}> e</span>:edit
          <span style={{ color: "#FF4444" }}> D</span>:delete
          <span style={{ color: "#00FFFF" }}> m</span>:message
          <span style={{ color: "#00FF00" }}> s</span>:send
          <span style={{ color: "#FF4444" }}> q</span>:quit
        </text>
      </Show>
    </box>
  )
}
