/**
 * Device stored in devices.json
 */
export interface Device {
	id: string;
	name: string;
	platform: "iOS" | "Android";
	token: string;
	notes: string;
	createdAt: string;
}

/**
 * Form data for creating/updating a device (without id and createdAt)
 */
export interface DeviceFormData {
	name: string;
	platform: "iOS" | "Android";
	token: string;
	notes: string;
}
