import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { __setConfigDir, readSettings, saveSettings } from "../src/lib/config";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "lazypush-test-"));
  __setConfigDir(tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true });
});

describe("readSettings", () => {
  it("returns default settings when settings.json does not exist", () => {
    const settings = readSettings();
    expect(settings.darkTheme).toBe("tokyonight-night");
    expect(settings.lightTheme).toBe("catppuccin-latte");
    expect(settings.themeMode).toBe("system");
  });

  it("returns stored settings after saveSettings", () => {
    saveSettings({
      darkTheme: "catppuccin-mocha",
      lightTheme: "tokyonight-day",
      themeMode: "dark",
    });
    const settings = readSettings();
    expect(settings.darkTheme).toBe("catppuccin-mocha");
    expect(settings.lightTheme).toBe("tokyonight-day");
    expect(settings.themeMode).toBe("dark");
  });
});
