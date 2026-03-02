/**
 * Service account validation result from Rust backend
 */
export interface ServiceAccountValidation {
	valid: boolean;
	projectId: string | null;
	clientEmail: string | null;
	error: string | null;
	duplicateProjectName: string | null;
}

/**
 * Project configuration stored in config.json
 */
export interface ProjectConfig {
	id: string;
	name: string;
	projectId: string;
	clientEmail: string;
	serviceAccountPath: string;
	createdAt: string;
}

/**
 * Result of project creation operation
 */
export interface CreateProjectResult {
	success: boolean;
	projectId: string | null;
	error: string | null;
}

/**
 * Form data for project creation
 */
export interface ProjectFormData {
	name: string;
	serviceAccountPath: string;
	projectId?: string;
	clientEmail?: string;
}
