import type { ThemeName } from "../types";

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
  mode: "light" | "dark";
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
