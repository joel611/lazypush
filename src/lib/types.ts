export interface Project {
  id: string
  name: string
  createdAt: string
}

export interface Environment {
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

export interface MessageTemplate {
  id: string
  name: string
  message: FcmMessage
  createdAt: string
}

export type SendTargetType = "devices" | "topic" | "all"

export interface SendLogEntry {
  timestamp: string
  templateName?: string
  targetType: SendTargetType
  targetInfo: string   // comma-joined device names, topic string, or "all"
  results: SendResult[]
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
  | { type: "environment"; environment?: Environment }
  | { type: "template"; template?: MessageTemplate }
  | { type: "device"; device?: Device }
  | { type: "message" }
  | { type: "send" }
