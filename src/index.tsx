// src/index.tsx
import { render } from "@opentui/solid";
import { App } from "./app";
import { DiskConfigProvider } from "./lib/config";
import { createDemoConfigProvider, MockSendProvider } from "./lib/demo";
import { RealSendProvider } from "./lib/fcm";

const isDemo = process.argv.includes("--demo");
const services = isDemo
  ? { config: createDemoConfigProvider(), send: MockSendProvider }
  : { config: DiskConfigProvider, send: RealSendProvider };

render(() => <App services={services} />);
