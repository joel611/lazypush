import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type {
	DataPayload,
	MessageFormData,
	MessageTemplate,
} from "../types/message";

interface MessageFormProps {
	open: boolean;
	onClose: () => void;
	onMessageChanged: () => void;
	projectId: string;
	message?: MessageTemplate | null;
}

export function MessageForm({
	open,
	onClose,
	onMessageChanged,
	projectId,
	message,
}: MessageFormProps) {
	const [formData, setFormData] = useState<MessageFormData>({
		name: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Data payload JSON editor state
	const [dataJson, setDataJson] = useState("");
	const [jsonError, setJsonError] = useState<string | null>(null);

	// Reset form when message changes or modal opens
	useEffect(() => {
		if (open) {
			if (message) {
				setFormData({
					name: message.name,
					notification: message.notification,
					data: message.data,
					android: message.android,
					apns: message.apns,
				});
				// Initialize JSON editor with existing data
				if (message.data) {
					setDataJson(JSON.stringify(message.data, null, 2));
				} else {
					setDataJson("");
				}
			} else {
				setFormData({
					name: "",
				});
				setDataJson("");
			}
			setError(null);
			setJsonError(null);
		}
	}, [open, message]);

	// Handle ESC key to close modal
	useEffect(() => {
		if (!open) return;

		function handleEscKey(e: KeyboardEvent) {
			if (e.key === "Escape" && !loading) {
				onClose();
			}
		}

		window.addEventListener("keydown", handleEscKey);
		return () => window.removeEventListener("keydown", handleEscKey);
	}, [open, loading, onClose]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setJsonError(null);

		// Parse and validate JSON data payload
		let dataPayload: DataPayload | undefined;
		if (dataJson.trim()) {
			const jsonToParse = dataJson;

			// Try to parse as-is first
			try {
				const parsed = JSON.parse(jsonToParse);
				// Validate that all values are strings
				if (typeof parsed !== "object" || Array.isArray(parsed)) {
					setJsonError("Data payload must be a JSON object");
					setLoading(false);
					return;
				}
				// Convert all values to strings (FCM requirement)
				dataPayload = {};
				for (const [key, value] of Object.entries(parsed)) {
					dataPayload[key] = String(value);
				}
			} catch (_parseErr) {
				// Try auto-correction
				try {
					const corrected = autoCorrectJson(jsonToParse);
					const parsed = JSON.parse(corrected);

					// Validate that it's an object
					if (typeof parsed !== "object" || Array.isArray(parsed)) {
						setJsonError("Data payload must be a JSON object");
						setLoading(false);
						return;
					}

					// Convert all values to strings (FCM requirement)
					dataPayload = {};
					for (const [key, value] of Object.entries(parsed)) {
						dataPayload[key] = String(value);
					}

					// Update the editor with corrected JSON
					setDataJson(JSON.stringify(parsed, null, 2));
				} catch (err) {
					setJsonError(
						`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
					);
					setLoading(false);
					return;
				}
			}
		}

		try {
			const submitData: MessageFormData = {
				...formData,
				data: dataPayload,
			};

			if (message) {
				// Update existing message
				await invoke("update_message", {
					projectId,
					messageId: message.id,
					messageData: submitData,
				});
			} else {
				// Create new message
				await invoke("add_message", {
					projectId,
					messageData: submitData,
				});
			}
			onMessageChanged();
			onClose();
		} catch (err) {
			setError(
				`Failed to ${message ? "update" : "create"} message template: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}

	function handleDataJsonChange(value: string) {
		setDataJson(value);
		setJsonError(null);

		// Try to parse and validate on change
		if (value.trim()) {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed !== "object" || Array.isArray(parsed)) {
					setJsonError("Data payload must be a JSON object");
				}
			} catch (_err) {
				// Don't show error while typing, only on submit
				setJsonError(null);
			}
		}
	}

	function autoCorrectJson(jsonStr: string): string {
		let corrected = jsonStr;

		// Remove comments (// and /* */)
		corrected = corrected.replace(/\/\/.*$/gm, "");
		corrected = corrected.replace(/\/\*[\s\S]*?\*\//g, "");

		// Replace single quotes with double quotes (but not in values)
		corrected = corrected.replace(/'/g, '"');

		// Remove trailing commas before } or ]
		corrected = corrected.replace(/,(\s*[}\]])/g, "$1");

		// Add quotes around unquoted keys
		corrected = corrected.replace(
			/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
			'$1"$2":',
		);

		return corrected;
	}

	function handleFormatJson() {
		if (!dataJson.trim()) return;

		const jsonToFormat = dataJson;
		let wasCorrected = false;

		// Try to parse as-is first
		try {
			const parsed = JSON.parse(jsonToFormat);
			setDataJson(JSON.stringify(parsed, null, 2));
			setJsonError(null);
			return;
		} catch (_err) {
			// Try auto-correction
			try {
				const corrected = autoCorrectJson(jsonToFormat);
				const parsed = JSON.parse(corrected);
				setDataJson(JSON.stringify(parsed, null, 2));
				setJsonError(null);
				wasCorrected = true;
				// Show a subtle success message
				setTimeout(() => {
					if (wasCorrected) {
						setJsonError(null);
					}
				}, 2000);
				return;
			} catch (err) {
				setJsonError(
					`Cannot format: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}
	}

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 rounded-t-2xl sticky top-0 z-10">
					<h2 className="text-2xl font-bold text-white">
						{message ? "Edit Message Template" : "Create Message Template"}
					</h2>
					<p className="text-purple-100 text-sm mt-1">
						{message
							? "Update FCM message template"
							: "Create a reusable FCM message template"}
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-8 space-y-8">
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-red-800 text-sm">{error}</p>
						</div>
					)}

					{/* Template Name */}
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Template Name
						</label>
						<input
							type="text"
							id="name"
							required
							placeholder="e.g., Welcome Message, Order Update"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
						/>
					</div>

					{/* Notification Section */}
					<div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Notification Payload
						</h3>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="notificationTitle"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Title
								</label>
								<input
									type="text"
									id="notificationTitle"
									placeholder="Notification title"
									value={formData.notification?.title || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											notification: {
												...formData.notification,
												title: e.target.value || undefined,
											},
										})
									}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								/>
							</div>
							<div>
								<label
									htmlFor="notificationBody"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Body
								</label>
								<textarea
									id="notificationBody"
									placeholder="Notification body text"
									value={formData.notification?.body || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											notification: {
												...formData.notification,
												body: e.target.value || undefined,
											},
										})
									}
									rows={3}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								/>
							</div>
							<div>
								<label
									htmlFor="notificationImage"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Image URL (Optional)
								</label>
								<input
									type="url"
									id="notificationImage"
									placeholder="https://example.com/image.png"
									value={formData.notification?.imageUrl || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											notification: {
												...formData.notification,
												imageUrl: e.target.value || undefined,
											},
										})
									}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								/>
							</div>
						</div>
					</div>

					{/* Data Payload Section */}
					<div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">
									Data Payload (JSON)
								</h3>
								<p className="text-xs text-gray-600 mt-1">
									Enter JSON object with key-value pairs
								</p>
							</div>
							<button
								type="button"
								onClick={handleFormatJson}
								className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
							>
								Format
							</button>
						</div>

						<textarea
							placeholder={'{\n  "key1": "value1",\n  "key2": "value2"\n}'}
							value={dataJson}
							onChange={(e) => handleDataJsonChange(e.target.value)}
							rows={10}
							spellCheck={false}
							className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm bg-slate-900 text-emerald-300 placeholder:text-slate-500 resize-y"
							style={{
								tabSize: 2,
								lineHeight: "1.6",
								minHeight: "200px",
							}}
						/>

						{jsonError && (
							<div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
								{jsonError}
							</div>
						)}

						<p className="text-xs text-gray-500 mt-2">
							Note: All values will be converted to strings as required by FCM
						</p>
					</div>

					{/* Platform Settings */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Android Config */}
						<div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Android Settings
							</h3>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Priority
								</label>
								<select
									value={formData.android?.priority || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											android: e.target.value
												? {
														priority: e.target.value as "normal" | "high",
													}
												: undefined,
										})
									}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								>
									<option value="">None</option>
									<option value="normal">Normal</option>
									<option value="high">High</option>
								</select>
							</div>
						</div>

						{/* APNs Config */}
						<div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								iOS (APNs) Settings
							</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Priority
									</label>
									<select
										value={formData.apns?.headers.apnsPriority || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												apns: e.target.value
													? {
															headers: {
																apnsPriority: e.target.value as "5" | "10",
															},
															payload: {
																aps: {
																	contentAvailable:
																		formData.apns?.payload.aps.contentAvailable,
																	mutableContent:
																		formData.apns?.payload.aps.mutableContent,
																},
															},
														}
													: undefined,
											})
										}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									>
										<option value="">None</option>
										<option value="5">5 (Normal)</option>
										<option value="10">10 (High)</option>
									</select>
								</div>
								<div className="space-y-2">
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={
												formData.apns?.payload.aps.contentAvailable === 1
											}
											onChange={(e) =>
												setFormData({
													...formData,
													apns: {
														headers: {
															apnsPriority:
																formData.apns?.headers.apnsPriority || "10",
														},
														payload: {
															aps: {
																contentAvailable: e.target.checked ? 1 : 0,
																mutableContent:
																	formData.apns?.payload.aps.mutableContent,
															},
														},
													},
												})
											}
											className="w-4 h-4 text-purple-600 rounded"
										/>
										<span className="text-sm text-gray-700">
											Content Available
										</span>
									</label>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={formData.apns?.payload.aps.mutableContent === 1}
											onChange={(e) =>
												setFormData({
													...formData,
													apns: {
														headers: {
															apnsPriority:
																formData.apns?.headers.apnsPriority || "10",
														},
														payload: {
															aps: {
																contentAvailable:
																	formData.apns?.payload.aps.contentAvailable,
																mutableContent: e.target.checked ? 1 : 0,
															},
														},
													},
												})
											}
											className="w-4 h-4 text-purple-600 rounded"
										/>
										<span className="text-sm text-gray-700">
											Mutable Content
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
						>
							{loading
								? message
									? "Updating..."
									: "Creating..."
								: message
									? "Update Template"
									: "Create Template"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
