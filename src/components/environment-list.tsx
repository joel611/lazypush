import { For } from "solid-js";
import { useTheme } from "../lib/theme-context";
import type { Theme } from "../lib/themes";
import {
  environmentActiveIndex,
  environmentIndex,
  environments,
  focused,
} from "../store";

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

export const EnvironmentList = (props: Props) => {
  const { theme } = useTheme();
  const t = theme;
  const isFocused = () => focused() === "environments";

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
          <span style={{ fg: t().paneLabel }}>2</span> Environments
        </strong>
      </text>
      <For each={environments()}>
        {(env, i) => {
          const isCursor = () => i() === environmentIndex();
          const isActive = () => i() === environmentActiveIndex();
          return (
            <text
              style={{
                fg: itemFg(t(), isCursor(), isActive()),
                bg: itemBg(t(), isCursor(), isActive()),
              }}
            >
              {itemPrefix(isCursor(), isActive())}
              {isActive() ? <strong>{env.name}</strong> : env.name}
            </text>
          );
        }}
      </For>
    </box>
  );
};
