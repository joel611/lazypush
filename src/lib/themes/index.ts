import type { ThemeName } from "../types";
import { catppuccinMocha } from "./catppuccin-mocha";
import { tokyoNight } from "./tokyo-night";
import type { Theme } from "./types";

export type { Theme } from "./types";

export const THEMES: Record<ThemeName, Theme> = {
  "tokyonight-night": tokyoNight,
  "catppuccin-mocha": catppuccinMocha,
};

export const DEFAULT_THEME: ThemeName = "tokyonight-night";
