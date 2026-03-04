// src/components/modals/theme-modal.tsx
import { useKeyboard } from "@opentui/solid";
import { createSignal, For } from "solid-js";
import { useTheme } from "../../lib/theme-context";
import { THEMES } from "../../lib/themes";
import type { ThemeName } from "../../lib/types";
import { setModal } from "../../store";

const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

function itemFg(
  t: ReturnType<ReturnType<typeof useTheme>["theme"]>,
  isCursor: boolean,
  isActive: boolean
): string {
  if (isCursor) {
    return t.textInverted;
  }
  if (isActive) {
    return t.accent;
  }
  return t.text;
}

export const ThemeModal = () => {
  const { theme, setThemeName } = useTheme();
  const [cursor, setCursor] = createSignal(
    Math.max(0, THEME_NAMES.indexOf(theme().name))
  );

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "j" || key.name === "down") {
      setCursor((i) => Math.min(THEME_NAMES.length - 1, i + 1));
      return;
    }
    if (key.name === "k" || key.name === "up") {
      setCursor((i) => Math.max(0, i - 1));
      return;
    }
    if (key.name === "return" || key.name === "space") {
      const name = THEME_NAMES[cursor()];
      if (name) {
        setThemeName(name);
      }
      setModal({ type: "none" });
    }
  });

  const t = () => theme();

  return (
    <box
      style={{
        position: "absolute",
        top: "30%",
        left: "35%",
        width: "30%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().accent,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>Theme</strong>
      </text>
      <For each={THEME_NAMES}>
        {(name, i) => {
          const isCursor = () => i() === cursor();
          const isActive = () => name === theme().name;
          return (
            <text
              style={{
                fg: itemFg(t(), isCursor(), isActive()),
                bg: isCursor() ? t().cursorBgActive : "transparent",
                marginTop: 1,
              }}
            >
              {isCursor() ? "> " : "  "}
              {name}
              {isActive() ? "  ●" : ""}
            </text>
          );
        }}
      </For>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accent }}>j/k</span>:nav
        <span style={{ fg: t().accent }}> spc</span>:select
        <span style={{ fg: t().accentDanger }}> esc</span>:close
      </text>
    </box>
  );
};
