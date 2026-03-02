export interface Project {
  id: string
  name: string
  serviceAccountPath: string
  createdAt: string
}

export interface Device {
  id: string
  name: string
  platform: "ios" | "android"
  token: string
  createdAt: string
}

export interface FcmMessage {
  notification: {
    title: string
    body: string
    imageUrl?: string
  }
  data?: Record<string, string>
  android?: {
    priority?: "high" | "normal"
  }
  apns?: {
    headers?: Record<string, string>
    payload?: {
      aps?: {
        contentAvailable?: number
        mutableContent?: number
      }
    }
  }
}

export interface SendResult {
  deviceName: string
  token: string
  success: boolean
  error?: string
}

export type ModalState =
  | { type: "none" }
  | { type: "project"; project?: Project }
  | { type: "device"; device?: Device }
  | { type: "message" }
  | { type: "result"; results: SendResult[] }
