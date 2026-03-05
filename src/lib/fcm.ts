import { readFileSync } from "node:fs";
import type { App } from "firebase-admin/app";
import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { FcmMessage, SendResult } from "./types";

// gaxios (used by firebase-admin's google-auth-library) checks `window.fetch`
// to detect native fetch. Bun has no `window`, so it falls back to
// `import('node-fetch')` which resolves to undefined in Bun 1.x.
// Expose Bun's native fetch via window so gaxios uses it directly.
if (typeof globalThis.window === "undefined") {
  (globalThis as unknown as { window: { fetch: typeof fetch } }).window = {
    fetch: globalThis.fetch,
  };
}

const appCache = new Map<string, App>();

function getFirebaseApp(serviceAccountPath: string): App {
  const cached = appCache.get(serviceAccountPath);
  if (cached) {
    return cached;
  }
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
  const app = initializeApp(
    { credential: cert(serviceAccount) },
    `lazypush-${serviceAccountPath}`
  );
  appCache.set(serviceAccountPath, app);
  return app;
}

export async function sendNotification(
  serviceAccountPath: string,
  devices: { name: string; token: string }[],
  message: FcmMessage
): Promise<SendResult[]> {
  const app = getFirebaseApp(serviceAccountPath);
  const messaging = getMessaging(app);
  // Bun does not support HTTP/2; fall back to HTTP/1.1 transport.
  messaging.enableLegacyHttpTransport();
  const response = await messaging.sendEachForMulticast({
    tokens: devices.map((d) => d.token),
    ...message,
  });
  return devices.map((device, i) => ({
    deviceName: device.name,
    token: device.token,
    success: response.responses[i].success,
    error: response.responses[i].error?.message,
  }));
}

export async function sendToTopic(
  serviceAccountPath: string,
  topic: string,
  message: FcmMessage
): Promise<SendResult> {
  const app = getFirebaseApp(serviceAccountPath);
  try {
    await getMessaging(app).send({ topic, ...message });
    return { deviceName: `topic:${topic}`, token: "", success: true };
  } catch (err) {
    return {
      deviceName: `topic:${topic}`,
      token: "",
      success: false,
      error: String(err),
    };
  }
}

// ─── RealSendProvider ─────────────────────────────────────────────────────────

import type { SendProvider } from "./config-provider";

export const RealSendProvider: SendProvider = {
  sendNotification,
  sendToTopic,
};
