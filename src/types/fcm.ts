import type {
	AndroidConfig,
	ApnsConfig,
	DataPayload,
	Notification,
} from "./message";

/**
 * Complete FCM message payload
 * This is sent to the backend send_notification command
 */
export interface FcmMessagePayload {
	notification?: Notification;
	data?: DataPayload;
	android?: AndroidConfig;
	apns?: ApnsConfig;
}

/**
 * Send notification request
 */
export interface SendNotificationRequest {
	projectId: string;
	deviceIds: string[];
	messagePayload: FcmMessagePayload;
}
