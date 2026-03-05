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
  it("returns default theme when settings.json does not exist", () => {
    const settings = readSettings();
    expect(settings.theme).toBe("tokyonight-night");
  });

  it("returns stored theme after saveSettings", () => {
    saveSettings({ theme: "catppuccin-mocha" });
    const settings = readSettings();
    expect(settings.theme).toBe("catppuccin-mocha");
  });
});
