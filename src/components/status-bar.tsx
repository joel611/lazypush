import { Show } from "solid-js";
import { useTheme } from "../lib/theme-context";
import { modal } from "../store";

export const StatusBar = () => {
  const { theme } = useTheme();
  const t = theme;
  const isModal = () => modal().type !== "none";

  return (
    <box
      style={{ width: "100%", padding: 1, backgroundColor: t().statusBarBg }}
    >
      <Show when={!isModal()}>
        <text style={{ fg: t().textMuted }}>
          <span style={{ fg: t().paneLabel }}>1-5</span>:pane
          <span style={{ fg: t().accent }}> j/k</span>:↑↓
          <span style={{ fg: t().accent }}> spc</span>:select
          <span style={{ fg: t().accent }}> n</span>:new
          <span style={{ fg: t().accent }}> e</span>:edit
          <span style={{ fg: t().accentDanger }}> D</span>:delete
          <span style={{ fg: t().accent }}> m</span>:compose
          <span style={{ fg: t().accentTemplate }}> t</span>:template
          <span style={{ fg: t().accentSuccess }}> s</span>:send
          <span style={{ fg: t().accent }}> T</span>:theme
          <span style={{ fg: t().accentDanger }}> q</span>:quit
        </text>
      </Show>
    </box>
  );
};
