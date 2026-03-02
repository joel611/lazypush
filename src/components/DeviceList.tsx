import { For } from "solid-js"
import { devices, deviceIndex, selectedDeviceIds, focused } from "../store"

interface Props {
  height: number
}

export const DeviceList = (props: Props) => {
  const isFocused = () => focused() === "devices"

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ color: "#FFFFFF", bold: true }}>Devices</text>
      <For each={devices()}>
        {(device, i) => {
          const isSelected = () => selectedDeviceIds().has(device.id)
          const isCurrent = () => i() === deviceIndex()
          return (
            <text
              style={{
                color: isCurrent() ? "#000000" : "#CCCCCC",
                backgroundColor: isCurrent() ? "#00FFFF" : "transparent",
              }}
            >
              {isSelected() ? "[x] " : "[ ] "}
              {device.name}
              <span style={{ color: "#888888" }}> ({device.platform})</span>
            </text>
          )
        }}
      </For>
    </box>
  )
}
