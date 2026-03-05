import type { ThemeName } from "../types";
import {
  catppuccinFrappe,
  catppuccinLatte,
  catppuccinMacchiato,
  catppuccinMocha,
} from "./catppuccin";
import { tokyoNight, tokyoNightDay, tokyoNightStorm } from "./tokyo-night";
import type { Theme } from "./types";

export type { Theme } from "./types";

export const THEMES: Record<ThemeName, Theme> = {
  "tokyonight-night": tokyoNight,
  "tokyonight-storm": tokyoNightStorm,
  "tokyonight-day": tokyoNightDay,
  "catppuccin-latte": catppuccinLatte,
  "catppuccin-frappe": catppuccinFrappe,
  "catppuccin-macchiato": catppuccinMacchiato,
  "catppuccin-mocha": catppuccinMocha,
};

export const THEME_META: Record<
  ThemeName,
  { label: string; mode: "light" | "dark" }
> = {
  "tokyonight-night": { label: "Tokyo Night", mode: "dark" },
  "tokyonight-storm": { label: "Tokyo Night Storm", mode: "dark" },
  "tokyonight-day": { label: "Tokyo Night Day", mode: "light" },
  "catppuccin-latte": { label: "Catppuccin Latte", mode: "light" },
  "catppuccin-frappe": { label: "Catppuccin Frappé", mode: "dark" },
  "catppuccin-macchiato": { label: "Catppuccin Macchiato", mode: "dark" },
  "catppuccin-mocha": { label: "Catppuccin Mocha", mode: "dark" },
};

export const DARK_THEMES = (Object.keys(THEMES) as ThemeName[]).filter(
  (n) => THEME_META[n].mode === "dark"
);

export const LIGHT_THEMES = (Object.keys(THEMES) as ThemeName[]).filter(
  (n) => THEME_META[n].mode === "light"
);

export const DEFAULT_LIGHT_THEME: ThemeName = "catppuccin-latte";
export const DEFAULT_DARK_THEME: ThemeName = "tokyonight-night";
