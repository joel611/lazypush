import { For, Match, Switch } from "solid-js";
import { useTheme } from "../lib/theme-context";
import { consoleEntries, consoleOffset, focused } from "../store";

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
      <For each={consoleEntries().slice(consoleOffset())}>
        {(entry) => (
          <Switch>
            <Match when={entry.kind === "send" && entry}>
              {(send) => {
                const ts = new Date(send().timestamp).toLocaleTimeString();
                const allOk = send().results.every(
                  (r: { success: boolean }) => r.success
                );
                const okCount = send().results.filter(
                  (r: { success: boolean }) => r.success
                ).length;
                const icon = allOk ? "✓" : "✗";
                const iconColor = allOk ? t().accentSuccess : t().accentDanger;
                const label = send().templateName ?? "(one-off)";
                let target: string;
                if (send().targetType === "topic") {
                  target = `topic:${send().targetInfo}`;
                } else if (send().targetType === "all") {
                  target = "all";
                } else {
                  target = `devices (${okCount}/${send().results.length})`;
                }
                return (
                  <box style={{ flexDirection: "column", marginTop: 0 }}>
                    <text>
                      <span style={{ fg: t().textMuted }}>{ts} </span>
                      <span style={{ fg: iconColor }}>{icon} </span>
                      <span style={{ fg: t().text }}>{label}</span>
                      <span style={{ fg: t().textMuted }}> → {target}</span>
                    </text>
                    <For
                      each={send().results.filter(
                        (r: { success: boolean }) => !r.success
                      )}
                    >
                      {(r) => (
                        <text style={{ fg: t().accentDanger, marginLeft: 2 }}>
                          ERR {r.deviceName}: {r.error}
                        </text>
                      )}
                    </For>
                  </box>
                );
              }}
            </Match>
            <Match when={entry.kind === "debug" && entry}>
              {(dbg) => {
                const ts = new Date(dbg().timestamp).toLocaleTimeString();
                let levelColor = t().textMuted;
                if (dbg().level === "error") {
                  levelColor = t().accentDanger;
                } else if (dbg().level === "warn") {
                  levelColor = t().accentTemplate;
                }
                return (
                  <text>
                    <span style={{ fg: t().textMuted }}>{ts} </span>
                    <span style={{ fg: levelColor }}>
                      [{dbg().level.toUpperCase()}]
                    </span>
                    <span style={{ fg: t().text }}> {dbg().message}</span>
                  </text>
                );
              }}
            </Match>
          </Switch>
        )}
      </For>
    </box>
  );
};
