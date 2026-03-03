export interface Project {
  createdAt: string;
  id: string;
  name: string;
}

export interface Environment {
  createdAt: string;
  id: string;
  name: string;
  serviceAccountPath: string;
}

export interface Device {
  createdAt: string;
  id: string;
  name: string;
  platform: "ios" | "android";
  token: string;
}

export interface FcmMessage {
  android?: {
    priority?: "high" | "normal";
  };
  apns?: {
    headers?: Record<string, string>;
    payload?: {
      aps: {
        contentAvailable?: boolean;
        mutableContent?: boolean;
      };
    };
  };
  data?: Record<string, string>;
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
}

export interface MessageTemplate {
  createdAt: string;
  id: string;
  message: FcmMessage;
  name: string;
}

export type SendTargetType = "devices" | "topic" | "all";

export interface SendLogEntry {
  results: SendResult[];
  targetInfo: string; // comma-joined device names, topic string, or "all"
  targetType: SendTargetType;
  templateName?: string;
  timestamp: string;
}

export interface SendResult {
  deviceName: string;
  error?: string;
  success: boolean;
  token: string;
}

export type ModalState =
  | { type: "none" }
  | { type: "project"; project?: Project }
  | { type: "environment"; environment?: Environment }
  | { type: "template"; template?: MessageTemplate }
  | { type: "device"; device?: Device }
  | { type: "message" }
  | { type: "send" };
