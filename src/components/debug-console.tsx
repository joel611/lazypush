import { For } from "solid-js";
import { consoleOffset, focused, sendLog } from "../store";

interface Props {
  height: number;
}

export const DebugConsole = (props: Props) => {
  const isFocused = () => focused() === "console";

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FFFF" : "#555555",
        padding: 1,
        overflow: "hidden",
      }}
    >
      <text fg="#FFFFFF">
        <strong>
          <span style={{ fg: "#FFFF00" }}>5</span> Debug Console
        </strong>
      </text>
      <For each={sendLog().slice(consoleOffset())}>
        {(entry) => {
          const ts = new Date(entry.timestamp).toLocaleTimeString();
          const allOk = entry.results.every((r) => r.success);
          const okCount = entry.results.filter((r) => r.success).length;
          const icon = allOk ? "✓" : "✗";
          const iconColor = allOk ? "#00FF00" : "#FF4444";
          const label = entry.templateName
            ? `${entry.templateName}`
            : "(one-off)";
          let target: string;
          if (entry.targetType === "topic") {
            target = `topic:${entry.targetInfo}`;
          } else if (entry.targetType === "all") {
            target = "all";
          } else {
            target = `devices (${okCount}/${entry.results.length})`;
          }

          return (
            <box style={{ flexDirection: "column", marginTop: 0 }}>
              <text>
                <span style={{ fg: "#888888" }}>{ts} </span>
                <span style={{ fg: iconColor }}>{icon} </span>
                <span style={{ fg: "#FFFFFF" }}>{label}</span>
                <span style={{ fg: "#888888" }}> → {target}</span>
              </text>
              <For each={entry.results.filter((r) => !r.success)}>
                {(r) => (
                  <text style={{ fg: "#FF4444", marginLeft: 2 }}>
                    ERR {r.deviceName}: {r.error}
                  </text>
                )}
              </For>
            </box>
          );
        }}
      </For>
    </box>
  );
};
