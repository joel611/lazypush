/**
 * Device info included in send history
 */
export interface DeviceInfo {
	id: string;
	name: string;
	token: string;
}

/**
 * Error information from FCM response
 */
export interface ErrorInfo {
	code: string;
	message: string;
}

/**
 * Result for a single token
 */
export interface TokenResult {
	success: boolean;
	messageId?: string;
	error?: ErrorInfo;
	token: string;
}

/**
 * Response from FCM send operation
 */
export interface SendResponse {
	successCount: number;
	failureCount: number;
	responses: TokenResult[];
}

/**
 * Send history entry stored in send-history.json
 */
export interface SendHistoryEntry {
	id: string;
	timestamp: string;
	projectId: string;
	projectName: string;
	message: Record<string, unknown>;
	devices: DeviceInfo[];
	response: SendResponse;
}
