// src/lib/theme-context.tsx

import type { Accessor, JSX } from "solid-js";
import { createContext, createMemo, createSignal, useContext } from "solid-js";
import { useServices } from "./services-context";
import type { Theme } from "./themes";
import { THEMES } from "./themes";
import type { AppSettings, ThemeMode, ThemeName } from "./types";

interface ThemeContextValue {
  darkThemeName: Accessor<ThemeName>;
  lightThemeName: Accessor<ThemeName>;
  setDarkTheme: (name: ThemeName) => void;
  setLightTheme: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  theme: Accessor<Theme>;
  themeMode: Accessor<ThemeMode>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface Props {
  children: JSX.Element;
  initialSettings: AppSettings;
}

function detectSystemPreference(): "light" | "dark" {
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(";");
    const bg = Number.parseInt(parts.at(-1) ?? "0", 10);
    return bg >= 8 ? "light" : "dark";
  }
  return "dark";
}

export function ThemeProvider(props: Props) {
  const { config } = useServices();

  const [lightThemeName, setLightThemeName] = createSignal<ThemeName>(
    props.initialSettings.lightTheme
  );
  const [darkThemeName, setDarkThemeName] = createSignal<ThemeName>(
    props.initialSettings.darkTheme
  );
  const [themeMode, setThemeMode] = createSignal<ThemeMode>(
    props.initialSettings.themeMode
  );

  const resolvedMode = createMemo<"light" | "dark">(() => {
    const mode = themeMode();
    if (mode !== "system") {
      return mode;
    }
    return detectSystemPreference();
  });

  const theme = createMemo<Theme>(() =>
    resolvedMode() === "light"
      ? THEMES[lightThemeName()]
      : THEMES[darkThemeName()]
  );

  function saveSettings() {
    config.saveSettings({
      lightTheme: lightThemeName(),
      darkTheme: darkThemeName(),
      themeMode: themeMode(),
    });
  }

  function setLightThemeAndSave(name: ThemeName) {
    setLightThemeName(name);
    saveSettings();
  }

  function setDarkThemeAndSave(name: ThemeName) {
    setDarkThemeName(name);
    saveSettings();
  }

  function setThemeModeAndSave(mode: ThemeMode) {
    setThemeMode(mode);
    saveSettings();
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        lightThemeName,
        darkThemeName,
        setLightTheme: setLightThemeAndSave,
        setDarkTheme: setDarkThemeAndSave,
        setThemeMode: setThemeModeAndSave,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be called inside ThemeProvider");
  }
  return ctx;
}
