import { For } from "solid-js";
import { useTheme } from "../lib/theme-context";
import { deviceIndex, devices, focused, selectedDeviceIds } from "../store";

interface Props {
  height: number;
}

export const DeviceList = (props: Props) => {
  const { theme } = useTheme();
  const t = theme;
  const isFocused = () => focused() === "devices";

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? t().panelBorderActive : t().panelBorder,
        padding: 1,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>
          <span style={{ fg: t().paneLabel }}>4</span> Devices
        </strong>
      </text>
      <For each={devices()}>
        {(device, i) => {
          const isSelected = () => selectedDeviceIds().has(device.id);
          const isCurrent = () => i() === deviceIndex();
          return (
            <text
              style={{
                fg: isCurrent() ? t().textInverted : t().deviceText,
                bg: isCurrent() ? t().cursorBgActive : "transparent",
              }}
            >
              {isSelected() ? "[x] " : "[ ] "}
              {device.name}
              <span style={{ fg: t().textMuted }}> ({device.platform})</span>
            </text>
          );
        }}
      </For>
    </box>
  );
};
