import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { Device } from "../types/device";
import { DeviceForm } from "./DeviceForm";

interface DeviceListProps {
	projectId: string;
}

export function DeviceList({ projectId }: DeviceListProps) {
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
	const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

	const loadDevices = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await invoke<Device[]>("load_devices", { projectId });
			setDevices(result);
		} catch (err) {
			setError(
				`Unable to load devices: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		loadDevices();
	}, [loadDevices]);

	function handleAddDevice() {
		setSelectedDevice(null);
		setModalOpen(true);
	}

	function handleEditDevice(device: Device) {
		setSelectedDevice(device);
		setModalOpen(true);
	}

	async function handleDeleteDevice(device: Device) {
		if (
			!confirm(
				`Are you sure you want to delete "${device.name}"? This action cannot be undone.`,
			)
		) {
			return;
		}

		try {
			await invoke("delete_device", {
				projectId,
				deviceId: device.id,
			});
			await loadDevices();
		} catch (err) {
			alert(
				`Failed to delete device: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	async function handleCopyToken(device: Device) {
		try {
			await navigator.clipboard.writeText(device.token);
			setCopiedTokenId(device.id);
			setTimeout(() => setCopiedTokenId(null), 2000);
		} catch (_err) {
			alert("Failed to copy token to clipboard");
		}
	}

	function handleDeviceChanged() {
		loadDevices();
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading devices...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-xl p-6">
				<h3 className="text-lg font-semibold text-red-900 mb-2">
					Error Loading Devices
				</h3>
				<p className="text-red-700">{error}</p>
			</div>
		);
	}

	if (devices.length === 0) {
		return (
			<>
				<div className="text-center py-20 bg-white rounded-2xl shadow-md">
					<div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-6">
						<svg
							className="h-10 w-10 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<title>Mobile Device</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h3 className="text-2xl font-bold text-gray-900 mb-2">
						No Devices Yet
					</h3>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Add your first test device to start sending push notifications
					</p>
					<button
						type="button"
						onClick={handleAddDevice}
						className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						+ Add First Device
					</button>
				</div>
				<DeviceForm
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onDeviceChanged={handleDeviceChanged}
					projectId={projectId}
					device={selectedDevice}
				/>
			</>
		);
	}

	return (
		<>
			<div className="mb-6 flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Test Devices</h2>
					<p className="text-gray-600 text-sm mt-1">
						{devices.length} {devices.length === 1 ? "device" : "devices"}{" "}
						registered
					</p>
				</div>
				<button
					type="button"
					onClick={handleAddDevice}
					className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
				>
					+ Add Device
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{devices.map((device) => (
					<div
						key={device.id}
						className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200"
					>
						{/* Device Header */}
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<h3 className="text-lg font-bold text-gray-900">
										{device.name}
									</h3>
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${
											device.platform === "iOS"
												? "bg-blue-100 text-blue-700"
												: "bg-green-100 text-green-700"
										}`}
									>
										{device.platform}
									</span>
								</div>
								{device.notes && (
									<p className="text-sm text-gray-600">{device.notes}</p>
								)}
							</div>
						</div>

						{/* FCM Token */}
						<div className="mb-4">
							<label className="block text-xs font-medium text-gray-500 mb-1">
								FCM Token
							</label>
							<div className="flex items-center gap-2">
								<div className="flex-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 overflow-hidden">
									<p className="text-xs font-mono text-gray-700 truncate">
										{device.token}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleCopyToken(device)}
									className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
									title="Copy token"
								>
									{copiedTokenId === device.id ? (
										<svg
											className="w-5 h-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>Copied</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									) : (
										<svg
											className="w-5 h-5 text-gray-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>Copy</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										</svg>
									)}
								</button>
							</div>
						</div>

						{/* Created Date */}
						<div className="mb-4">
							<p className="text-xs text-gray-500">
								Added {new Date(device.createdAt).toLocaleDateString()}
							</p>
						</div>

						{/* Actions */}
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => handleEditDevice(device)}
								className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={() => handleDeleteDevice(device)}
								className="flex-1 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>

			<DeviceForm
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onDeviceChanged={handleDeviceChanged}
				projectId={projectId}
				device={selectedDevice}
			/>
		</>
	);
}
