// src/lib/config-provider.ts
import type {
  AppSettings,
  Device,
  Environment,
  FcmMessage,
  MessageTemplate,
  Project,
  SendLogEntry,
  SendResult,
} from "./types";

export interface ConfigProvider {
  appendSendLog(
    projectId: string,
    envId: string,
    sessionFile: string,
    entry: SendLogEntry
  ): void;
  deleteEnvironment(projectId: string, envId: string): void;
  deleteProject(id: string): void;
  listDevices(projectId: string, envId: string): Device[];
  listEnvironments(projectId: string): Environment[];
  listProjects(): Project[];
  listTemplates(projectId: string): MessageTemplate[];
  newSessionFileName(): string;
  readSettings(): AppSettings;
  saveDevices(projectId: string, envId: string, devices: Device[]): void;
  saveEnvironment(projectId: string, env: Environment): void;
  saveProject(p: Project): void;
  saveSettings(settings: AppSettings): void;
  saveTemplates(projectId: string, templates: MessageTemplate[]): void;
}

export interface SendProvider {
  sendNotification(
    serviceAccountPath: string,
    devices: Device[],
    msg: FcmMessage
  ): Promise<SendResult[]>;
  sendToTopic(
    serviceAccountPath: string,
    topic: string,
    msg: FcmMessage
  ): Promise<SendResult>;
}
