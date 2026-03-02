/**
 * Notification payload
 */
export interface Notification {
	title?: string;
	body?: string;
	imageUrl?: string;
}

/**
 * Data payload (key-value pairs)
 */
export type DataPayload = Record<string, string>;

/**
 * Android-specific configuration
 */
export interface AndroidConfig {
	priority: "normal" | "high";
}

/**
 * APNs headers
 */
export interface ApnsHeaders {
	apnsPriority: "5" | "10";
}

/**
 * APNs APS payload
 */
export interface Aps {
	contentAvailable?: number; // 0 or 1
	mutableContent?: number; // 0 or 1
}

/**
 * APNs payload
 */
export interface ApnsPayload {
	aps: Aps;
}

/**
 * APNs configuration
 */
export interface ApnsConfig {
	headers: ApnsHeaders;
	payload: ApnsPayload;
}

/**
 * Message template stored in messages.json
 */
export interface MessageTemplate {
	id: string;
	name: string;
	notification?: Notification;
	data?: DataPayload;
	android?: AndroidConfig;
	apns?: ApnsConfig;
	createdAt: string;
}

/**
 * Form data for creating/updating a message template (without id and createdAt)
 */
export interface MessageFormData {
	name: string;
	notification?: Notification;
	data?: DataPayload;
	android?: AndroidConfig;
	apns?: ApnsConfig;
}
