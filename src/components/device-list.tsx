import { For } from "solid-js";
import { deviceIndex, devices, focused, selectedDeviceIds } from "../store";

interface Props {
  height: number;
}

export const DeviceList = (props: Props) => {
  const isFocused = () => focused() === "devices";

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#555555",
        padding: 1,
      }}
    >
      <text fg="#FFFFFF">
        <strong>
          <span style={{ fg: "#FFFF00" }}>4</span> Devices
        </strong>
      </text>
      <For each={devices()}>
        {(device, i) => {
          const isSelected = () => selectedDeviceIds().has(device.id);
          const isCurrent = () => i() === deviceIndex();
          return (
            <text
              style={{
                fg: isCurrent() ? "#000000" : "#CCCCCC",
                bg: isCurrent() ? "#00FFFF" : "transparent",
              }}
            >
              {isSelected() ? "[x] " : "[ ] "}
              {device.name}
              <span style={{ fg: "#888888" }}> ({device.platform})</span>
            </text>
          );
        }}
      </For>
    </box>
  );
};
