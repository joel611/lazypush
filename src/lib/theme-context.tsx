// src/lib/theme-context.tsx

import type { Accessor, JSX } from "solid-js";
import { createContext, createSignal, useContext } from "solid-js";
import { useServices } from "./services-context";
import type { Theme } from "./themes";
import { DEFAULT_THEME, THEMES } from "./themes";
import type { ThemeName } from "./types";

interface ThemeContextValue {
  setThemeName: (name: ThemeName) => void;
  theme: Accessor<Theme>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface Props {
  children: JSX.Element;
  initialTheme: ThemeName;
}

export function ThemeProvider(props: Props) {
  const { config } = useServices();
  const [theme, setTheme] = createSignal<Theme>(
    THEMES[props.initialTheme] ?? THEMES[DEFAULT_THEME]
  );

  function setThemeName(name: ThemeName) {
    setTheme(THEMES[name]);
    config.saveSettings({ theme: name });
  }

  return (
    <ThemeContext.Provider value={{ theme, setThemeName }}>
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
