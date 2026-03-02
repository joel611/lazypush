import type { App } from "firebase-admin/app"
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { readFileSync } from "fs"
import type { FcmMessage, SendResult } from "./types"

// Cache apps by service account path to avoid re-initializing
const appCache = new Map<string, App>()

function getFirebaseApp(serviceAccountPath: string): App {
  if (appCache.has(serviceAccountPath)) {
    return appCache.get(serviceAccountPath)!
  }
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"))
  const appName = `lazypush-${serviceAccountPath}`
  const app = initializeApp({ credential: cert(serviceAccount) }, appName)
  appCache.set(serviceAccountPath, app)
  return app
}

export async function sendNotification(
  serviceAccountPath: string,
  devices: { name: string; token: string }[],
  message: FcmMessage
): Promise<SendResult[]> {
  const app = getFirebaseApp(serviceAccountPath)
  const response = await getMessaging(app).sendEachForMulticast({
    tokens: devices.map((d) => d.token),
    ...message,
  })

  return devices.map((device, i) => ({
    deviceName: device.name,
    token: device.token,
    success: response.responses[i].success,
    error: response.responses[i].error?.message,
  }))
}
