import type { DebugLevel } from "./types";

const isDebugEnabled = process.argv.includes("--debug");

type DebugAppendFn = (level: DebugLevel, message: string) => void;

let _append: DebugAppendFn | null = null;

export function initDebug(appendFn: DebugAppendFn) {
  _append = appendFn;
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) =>
      typeof a === "object" && a !== null ? JSON.stringify(a) : String(a)
    )
    .join(" ");
}

function log(level: DebugLevel, args: unknown[]) {
  if (!(isDebugEnabled && _append)) {
    return;
  }
  _append(level, formatArgs(args));
}

export const debug = {
  log: (...args: unknown[]) => log("log", args),
  info: (...args: unknown[]) => log("info", args),
  warn: (...args: unknown[]) => log("warn", args),
  error: (...args: unknown[]) => log("error", args),
};
