// src/index.tsx
import { render } from "@opentui/solid";
import { App } from "./app";
import { DiskConfigProvider } from "./lib/config";
import { initDebug } from "./lib/debug";
import { createDemoConfigProvider, MockSendProvider } from "./lib/demo";
import { RealSendProvider } from "./lib/fcm";
import { appendDebugEntry } from "./store";

initDebug(appendDebugEntry);

const isDemo = process.argv.includes("--demo");
const services = isDemo
  ? { config: createDemoConfigProvider(), send: MockSendProvider }
  : { config: DiskConfigProvider, send: RealSendProvider };

render(() => <App services={services} />);
