import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { Device, DeviceFormData } from "../types/device";

interface DeviceFormProps {
	open: boolean;
	onClose: () => void;
	onDeviceChanged: () => void;
	projectId: string;
	device?: Device | null;
}

export function DeviceForm({
	open,
	onClose,
	onDeviceChanged,
	projectId,
	device,
}: DeviceFormProps) {
	const [formData, setFormData] = useState<DeviceFormData>({
		name: "",
		platform: "iOS",
		token: "",
		notes: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset form when device changes or modal opens
	useEffect(() => {
		if (open) {
			if (device) {
				setFormData({
					name: device.name,
					platform: device.platform,
					token: device.token,
					notes: device.notes,
				});
			} else {
				setFormData({
					name: "",
					platform: "iOS",
					token: "",
					notes: "",
				});
			}
			setError(null);
		}
	}, [open, device]);

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

		try {
			if (device) {
				// Update existing device
				await invoke("update_device", {
					projectId,
					deviceId: device.id,
					deviceData: formData,
				});
			} else {
				// Create new device
				await invoke("add_device", {
					projectId,
					deviceData: formData,
				});
			}
			onDeviceChanged();
			onClose();
		} catch (err) {
			setError(
				`Failed to ${device ? "update" : "create"} device: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-2xl">
					<h2 className="text-2xl font-bold text-white">
						{device ? "Edit Device" : "Add New Device"}
					</h2>
					<p className="text-blue-100 text-sm mt-1">
						{device
							? "Update device information and FCM token"
							: "Register a new test device for push notifications"}
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-8 space-y-6">
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-red-800 text-sm">{error}</p>
						</div>
					)}

					{/* Device Name */}
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Device Name
						</label>
						<input
							type="text"
							id="name"
							required
							placeholder="e.g., iPhone 15 Pro, Pixel 8"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>

					{/* Platform */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Platform
						</label>
						<div className="flex gap-4">
							<label className="flex items-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all flex-1">
								<input
									type="radio"
									name="platform"
									value="iOS"
									checked={formData.platform === "iOS"}
									onChange={(e) =>
										setFormData({
											...formData,
											platform: e.target.value as "iOS" | "Android",
										})
									}
									className="w-5 h-5 text-blue-600"
								/>
								<div>
									<div className="font-semibold text-gray-900">iOS</div>
									<div className="text-xs text-gray-500">Apple Devices</div>
								</div>
							</label>
							<label className="flex items-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-all flex-1">
								<input
									type="radio"
									name="platform"
									value="Android"
									checked={formData.platform === "Android"}
									onChange={(e) =>
										setFormData({
											...formData,
											platform: e.target.value as "iOS" | "Android",
										})
									}
									className="w-5 h-5 text-green-600"
								/>
								<div>
									<div className="font-semibold text-gray-900">Android</div>
									<div className="text-xs text-gray-500">Google Devices</div>
								</div>
							</label>
						</div>
					</div>

					{/* FCM Token */}
					<div>
						<label
							htmlFor="token"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							FCM Token
						</label>
						<textarea
							id="token"
							required
							placeholder="Paste device FCM registration token here..."
							value={formData.token}
							onChange={(e) =>
								setFormData({ ...formData, token: e.target.value })
							}
							rows={4}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
						/>
						<p className="text-xs text-gray-500 mt-2">
							The token should be obtained from your mobile app
						</p>
					</div>

					{/* Notes */}
					<div>
						<label
							htmlFor="notes"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Notes (Optional)
						</label>
						<textarea
							id="notes"
							placeholder="Add any notes about this device (e.g., OS version, testing purpose)..."
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							rows={3}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-3 justify-end pt-4">
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
							className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
						>
							{loading
								? device
									? "Updating..."
									: "Adding..."
								: device
									? "Update Device"
									: "Add Device"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
