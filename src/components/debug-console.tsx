import { For } from "solid-js";
import { useTheme } from "../lib/theme-context";
import { consoleOffset, focused, sendLog } from "../store";

interface Props {
  height: number;
}

export const DebugConsole = (props: Props) => {
  const { theme } = useTheme();
  const t = theme;
  const isFocused = () => focused() === "console";

  return (
    <box
      style={{
        flexGrow: 1,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? t().panelBorderActive : t().panelBorder,
        padding: 1,
        overflow: "hidden",
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>
          <span style={{ fg: t().paneLabel }}>5</span> Debug Console
        </strong>
      </text>
      <For each={sendLog().slice(consoleOffset())}>
        {(entry) => {
          const ts = new Date(entry.timestamp).toLocaleTimeString();
          const allOk = entry.results.every((r) => r.success);
          const okCount = entry.results.filter((r) => r.success).length;
          const icon = allOk ? "✓" : "✗";
          const iconColor = allOk ? t().accentSuccess : t().accentDanger;
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
                <span style={{ fg: t().textMuted }}>{ts} </span>
                <span style={{ fg: iconColor }}>{icon} </span>
                <span style={{ fg: t().text }}>{label}</span>
                <span style={{ fg: t().textMuted }}> → {target}</span>
              </text>
              <For each={entry.results.filter((r) => !r.success)}>
                {(r) => (
                  <text style={{ fg: t().accentDanger, marginLeft: 2 }}>
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
