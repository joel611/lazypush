import { For } from "solid-js";
import { useTheme } from "../lib/theme-context";
import type { Theme } from "../lib/themes";
import { focused, projectActiveIndex, projectIndex, projects } from "../store";

interface Props {
  height: number;
  width: number;
}

function itemFg(t: Theme, isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return t.textInverted;
  }
  if (isActive) {
    return t.accent;
  }
  return t.textMuted;
}

function itemBg(t: Theme, isCursor: boolean, isActive: boolean): string {
  if (!isCursor) {
    return "transparent";
  }
  if (isActive) {
    return t.cursorBgActive;
  }
  return t.cursorBg;
}

function itemPrefix(isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return "> ";
  }
  if (isActive) {
    return "● ";
  }
  return "  ";
}

export const ProjectList = (props: Props) => {
  const { theme } = useTheme();
  const t = theme;
  const isFocused = () => focused() === "projects";

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? t().panelBorderActive : t().panelBorder,
        padding: 1,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>
          <span style={{ fg: t().paneLabel }}>3</span> Projects
        </strong>
      </text>
      <For each={projects()}>
        {(project, i) => {
          const isCursor = () => i() === projectIndex();
          const isActive = () => i() === projectActiveIndex();
          return (
            <text
              style={{
                fg: itemFg(t(), isCursor(), isActive()),
                bg: itemBg(t(), isCursor(), isActive()),
              }}
            >
              {itemPrefix(isCursor(), isActive())}
              {isActive() ? <strong>{project.name}</strong> : project.name}
            </text>
          );
        }}
      </For>
    </box>
  );
};
