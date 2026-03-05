// src/components/modals/theme-modal.tsx
import { useKeyboard } from "@opentui/solid";
import { createSignal, For } from "solid-js";
import { useTheme } from "../../lib/theme-context";
import { DARK_THEMES, LIGHT_THEMES, THEME_META } from "../../lib/themes";
import type { ThemeMode, ThemeName } from "../../lib/types";
import { setModal } from "../../store";

type TabId = "mode" | "light" | "dark";
const TABS: TabId[] = ["mode", "light", "dark"];
const MODES: ThemeMode[] = ["system", "light", "dark"];
const MODE_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function tabLabel(tab: TabId): string {
  if (tab === "mode") {
    return "Mode";
  }
  if (tab === "light") {
    return "Light";
  }
  return "Dark";
}

function itemsForTab(tab: TabId): string[] {
  if (tab === "mode") {
    return MODES;
  }
  if (tab === "light") {
    return LIGHT_THEMES;
  }
  return DARK_THEMES;
}

function initialCursorForTab(
  tab: TabId,
  themeMode: ThemeMode,
  lightTheme: ThemeName,
  darkTheme: ThemeName
): number {
  if (tab === "mode") {
    return Math.max(0, MODES.indexOf(themeMode));
  }
  if (tab === "light") {
    return Math.max(0, LIGHT_THEMES.indexOf(lightTheme));
  }
  return Math.max(0, DARK_THEMES.indexOf(darkTheme));
}

function isActiveItem(
  tab: TabId,
  item: string,
  themeMode: ThemeMode,
  lightTheme: ThemeName,
  darkTheme: ThemeName
): boolean {
  if (tab === "mode") {
    return item === themeMode;
  }
  if (tab === "light") {
    return item === lightTheme;
  }
  return item === darkTheme;
}

function displayName(tab: TabId, item: string): string {
  if (tab === "mode") {
    return MODE_LABELS[item as ThemeMode] ?? item;
  }
  return THEME_META[item as ThemeName]?.label ?? item;
}

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
  const {
    theme,
    themeMode,
    lightThemeName,
    darkThemeName,
    setLightTheme,
    setDarkTheme,
    setThemeMode,
  } = useTheme();

  const [activeTab, setActiveTab] = createSignal<TabId>("mode");
  const [cursor, setCursor] = createSignal(
    initialCursorForTab("mode", themeMode(), lightThemeName(), darkThemeName())
  );

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    setCursor(
      initialCursorForTab(tab, themeMode(), lightThemeName(), darkThemeName())
    );
  }

  function selectCurrent() {
    const tab = activeTab();
    const items = itemsForTab(tab);
    const item = items[cursor()];
    if (!item) {
      return;
    }
    if (tab === "mode") {
      setThemeMode(item as ThemeMode);
    } else if (tab === "light") {
      setLightTheme(item as ThemeName);
    } else {
      setDarkTheme(item as ThemeName);
    }
    setModal({ type: "none" });
  }

  useKeyboard((key) => {
    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "tab") {
      const nextIdx = (TABS.indexOf(activeTab()) + 1) % TABS.length;
      const nextTab = TABS[nextIdx];
      if (nextTab) {
        switchTab(nextTab);
      }
      return;
    }
    if (key.name === "j" || key.name === "down") {
      const max = itemsForTab(activeTab()).length - 1;
      setCursor((i) => Math.min(max, i + 1));
      return;
    }
    if (key.name === "k" || key.name === "up") {
      setCursor((i) => Math.max(0, i - 1));
      return;
    }
    if (key.name === "return" || key.name === "space") {
      selectCurrent();
    }
  });

  const t = () => theme();

  return (
    <box
      style={{
        position: "absolute",
        top: "20%",
        left: "30%",
        width: "40%",
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

      {/* Tab bar */}
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <For each={TABS}>
          {(tab, i) => (
            <>
              <span
                style={{
                  fg: activeTab() === tab ? t().cursorBgActive : t().textMuted,
                }}
              >
                {i() > 0 ? "  " : ""}[{tabLabel(tab)}]
              </span>
            </>
          )}
        </For>
      </text>

      {/* Items */}
      <For each={itemsForTab(activeTab())}>
        {(item, i) => {
          const isCursor = () => i() === cursor();
          const isActive = () =>
            isActiveItem(
              activeTab(),
              item,
              themeMode(),
              lightThemeName(),
              darkThemeName()
            );
          return (
            <text
              style={{
                fg: itemFg(t(), isCursor(), isActive()),
                bg: isCursor() ? t().cursorBgActive : "transparent",
                marginTop: 1,
              }}
            >
              {isCursor() ? "> " : "  "}
              {displayName(activeTab(), item)}
              {isActive() ? "  ●" : ""}
            </text>
          );
        }}
      </For>

      <text style={{ fg: t().textMuted, marginTop: 2 }}>
        <span style={{ fg: t().accent }}>tab</span>:switch
        <span style={{ fg: t().accent }}> j/k</span>:nav
        <span style={{ fg: t().accent }}> spc</span>:select
        <span style={{ fg: t().accentDanger }}> esc</span>:close
      </text>
    </box>
  );
};
