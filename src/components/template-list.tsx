import { For } from "solid-js";
import { useTheme } from "../lib/theme-context";
import type { Theme } from "../lib/themes";
import {
  focused,
  templateActiveIndex,
  templateIndex,
  templates,
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
    return t.accentTemplate;
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

export const TemplateList = (props: Props) => {
  const { theme } = useTheme();
  const t = theme;
  const isFocused = () => focused() === "templates";

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
          <span style={{ fg: t().paneLabel }}>1</span> Templates
        </strong>
      </text>
      <For each={templates()}>
        {(tpl, i) => {
          const isCursor = () => i() === templateIndex();
          const isActive = () => i() === templateActiveIndex();
          return (
            <text
              style={{
                fg: itemFg(t(), isCursor(), isActive()),
                bg: itemBg(t(), isCursor(), isActive()),
              }}
            >
              {itemPrefix(isCursor(), isActive())}
              {isActive() ? <strong>{tpl.name}</strong> : tpl.name}
            </text>
          );
        }}
      </For>
    </box>
  );
};
