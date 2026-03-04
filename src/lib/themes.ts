// src/lib/themes.ts
import type { ThemeName } from "./types";

export interface Theme {
  // Accents
  accent: string;
  accentDanger: string;
  accentSuccess: string;
  accentTemplate: string;
  // Cursor / selection
  cursorBg: string;
  cursorBgActive: string;
  // Lists
  deviceText: string;
  // Fields
  fieldBorder: string;
  fieldBorderActive: string;
  // Modals
  modalBg: string;
  modalBorder: string;
  name: ThemeName;
  paneLabel: string;
  // Panels
  panelBg: string;
  panelBorder: string;
  panelBorderActive: string;
  selectOptionBg: string;
  // Chrome
  statusBarBg: string;
  // Text
  text: string;
  textDim: string;
  textInverted: string;
  textMuted: string;
}

const tokyoNight: Theme = {
  name: "tokyonight-night",
  panelBg: "transparent",
  panelBorder: "#292e42",
  panelBorderActive: "#7aa2f7",
  modalBg: "#16161e",
  modalBorder: "#7aa2f7",
  statusBarBg: "#16161e",
  text: "#c0caf5",
  textMuted: "#565f89",
  textDim: "#414868",
  textInverted: "#1a1b26",
  accent: "#7dcfff",
  accentTemplate: "#e0af68",
  accentSuccess: "#9ece6a",
  accentDanger: "#f7768e",
  cursorBg: "#292e42",
  cursorBgActive: "#7aa2f7",
  paneLabel: "#e0af68",
  fieldBorder: "#292e42",
  fieldBorderActive: "#7aa2f7",
  deviceText: "#9aa5ce",
  selectOptionBg: "#1a2b47",
};

const catppuccinMocha: Theme = {
  name: "catppuccin-mocha",
  panelBg: "transparent",
  panelBorder: "#313244",
  panelBorderActive: "#89b4fa",
  modalBg: "#181825",
  modalBorder: "#89b4fa",
  statusBarBg: "#181825",
  text: "#cdd6f4",
  textMuted: "#6c7086",
  textDim: "#585b70",
  textInverted: "#1e1e2e",
  accent: "#89dceb",
  accentTemplate: "#fab387",
  accentSuccess: "#a6e3a1",
  accentDanger: "#f38ba8",
  cursorBg: "#313244",
  cursorBgActive: "#89b4fa",
  paneLabel: "#f9e2af",
  fieldBorder: "#45475a",
  fieldBorderActive: "#89b4fa",
  deviceText: "#bac2de",
  selectOptionBg: "#1e3a5f",
};

export const THEMES: Record<ThemeName, Theme> = {
  "tokyonight-night": tokyoNight,
  "catppuccin-mocha": catppuccinMocha,
};

export const DEFAULT_THEME: ThemeName = "tokyonight-night";
