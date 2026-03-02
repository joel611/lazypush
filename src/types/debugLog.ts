/**
 * Debug log entry for tracking API requests
 */
export interface DebugLogEntry {
	id: string;
	timestamp: string;
	type: "send" | "init" | "ping";
	projectId: string;
	projectName: string;
	requestPayload: Record<string, unknown>;
	responseStatus: "success" | "error";
	responseData?: Record<string, unknown>;
	errorMessage?: string;
	duration?: number; // milliseconds
}

/**
 * Filter options for debug log
 */
export interface DebugLogFilter {
	type?: "send" | "init" | "ping" | "all";
	projectId?: string;
	status?: "success" | "error" | "all";
	searchTerm?: string;
}
