import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { Device } from "../types/device";
import type { FcmMessagePayload } from "../types/fcm";
import type { MessageTemplate } from "../types/message";
import type { SendResponse } from "../types/sendHistory";

interface SendPanelProps {
	projectId: string;
}

export function SendPanel({ projectId }: SendPanelProps) {
	const [devices, setDevices] = useState<Device[]>([]);
	const [messages, setMessages] = useState<MessageTemplate[]>([]);
	const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(
		new Set(),
	);
	const [selectedMessageId, setSelectedMessageId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sendResult, setSendResult] = useState<SendResponse | null>(null);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const [devicesResult, messagesResult] = await Promise.all([
				invoke<Device[]>("load_devices", { projectId }),
				invoke<MessageTemplate[]>("load_messages", { projectId }),
			]);
			setDevices(devicesResult);
			setMessages(messagesResult);
		} catch (err) {
			setError(
				`Unable to load data: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	function toggleDeviceSelection(deviceId: string) {
		const newSelection = new Set(selectedDeviceIds);
		if (newSelection.has(deviceId)) {
			newSelection.delete(deviceId);
		} else {
			newSelection.add(deviceId);
		}
		setSelectedDeviceIds(newSelection);
	}

	function selectAllDevices() {
		setSelectedDeviceIds(new Set(devices.map((d) => d.id)));
	}

	function deselectAllDevices() {
		setSelectedDeviceIds(new Set());
	}

	async function handleSend() {
		if (selectedDeviceIds.size === 0) {
			alert("Please select at least one device");
			return;
		}

		if (!selectedMessageId) {
			alert("Please select a message template");
			return;
		}

		const message = messages.find((m) => m.id === selectedMessageId);
		if (!message) {
			alert("Selected message not found");
			return;
		}

		try {
			setSending(true);
			setSendResult(null);
			setError(null);

			// Build FCM message payload (exclude id, name, createdAt)
			const messagePayload: FcmMessagePayload = {
				notification: message.notification,
				data: message.data,
				android: message.android,
				apns: message.apns,
			};

			const result = await invoke<SendResponse>("send_notification", {
				projectId,
				deviceIds: Array.from(selectedDeviceIds),
				messagePayload,
			});

			setSendResult(result);
		} catch (err) {
			setError(
				`Failed to send notification: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setSending(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading send panel...</p>
				</div>
			</div>
		);
	}

	if (error && !sendResult) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-xl p-6">
				<h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
				<p className="text-red-700">{error}</p>
				<button
					type="button"
					onClick={() => {
						setError(null);
						loadData();
					}}
					className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					Retry
				</button>
			</div>
		);
	}

	if (devices.length === 0 || messages.length === 0) {
		return (
			<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
				<h3 className="text-lg font-semibold text-yellow-900 mb-2">
					Setup Required
				</h3>
				<p className="text-yellow-700">
					{devices.length === 0 && messages.length === 0
						? "Please add at least one device and one message template to send notifications."
						: devices.length === 0
							? "Please add at least one device in the Devices tab."
							: "Please add at least one message template in the Messages tab."}
				</p>
			</div>
		);
	}

	const selectedMessage = messages.find((m) => m.id === selectedMessageId);

	return (
		<div className="space-y-6">
			{/* Device Selection */}
			<div className="bg-white rounded-xl shadow-md p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-gray-900">
						Select Devices ({selectedDeviceIds.size} selected)
					</h3>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={selectAllDevices}
							className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100"
						>
							Select All
						</button>
						<button
							type="button"
							onClick={deselectAllDevices}
							className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
						>
							Deselect All
						</button>
					</div>
				</div>

				{selectedDeviceIds.size > 500 && (
					<div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-sm text-red-700 font-medium">
							Maximum 500 devices allowed per send. Currently selected:{" "}
							{selectedDeviceIds.size}
						</p>
					</div>
				)}

				<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
					{devices.map((device) => (
						<label
							key={device.id}
							className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
						>
							<input
								type="checkbox"
								checked={selectedDeviceIds.has(device.id)}
								onChange={() => toggleDeviceSelection(device.id)}
								className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="font-medium text-gray-900 truncate">
										{device.name}
									</p>
									<span
										className={`px-2 py-0.5 rounded text-xs font-medium ${
											device.platform === "iOS"
												? "bg-blue-100 text-blue-700"
												: "bg-green-100 text-green-700"
										}`}
									>
										{device.platform}
									</span>
								</div>
								{device.notes && (
									<p className="text-xs text-gray-500 truncate">
										{device.notes}
									</p>
								)}
							</div>
						</label>
					))}
				</div>
			</div>

			{/* Message Template Selection */}
			<div className="bg-white rounded-xl shadow-md p-6">
				<h3 className="text-lg font-bold text-gray-900 mb-4">
					Select Message Template
				</h3>

				<div className="grid gap-3">
					{messages.map((message) => (
						<label
							key={message.id}
							className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
								selectedMessageId === message.id
									? "border-purple-500 bg-purple-50"
									: "border-gray-200 hover:bg-gray-50"
							}`}
						>
							<input
								type="radio"
								name="message"
								checked={selectedMessageId === message.id}
								onChange={() => setSelectedMessageId(message.id)}
								className="mt-1 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
							/>
							<div className="flex-1">
								<p className="font-medium text-gray-900">{message.name}</p>
								{message.notification?.title && (
									<p className="text-sm text-gray-600 mt-1">
										{message.notification.title}
									</p>
								)}
							</div>
						</label>
					))}
				</div>
			</div>

			{/* Message Preview */}
			{selectedMessage && (
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="text-lg font-bold text-gray-900 mb-4">
						Message Preview
					</h3>

					<div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
						<pre className="whitespace-pre-wrap break-words">
							{JSON.stringify(
								{
									notification: selectedMessage.notification,
									data: selectedMessage.data,
									android: selectedMessage.android,
									apns: selectedMessage.apns,
								},
								null,
								2,
							)}
						</pre>
					</div>
				</div>
			)}

			{/* Send Button */}
			<div className="bg-white rounded-xl shadow-md p-6">
				<button
					type="button"
					onClick={handleSend}
					disabled={
						sending ||
						selectedDeviceIds.size === 0 ||
						selectedDeviceIds.size > 500 ||
						!selectedMessageId
					}
					className={`w-full py-4 font-bold text-lg rounded-xl transition-all ${
						sending ||
						selectedDeviceIds.size === 0 ||
						selectedDeviceIds.size > 500 ||
						!selectedMessageId
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					}`}
				>
					{sending ? (
						<span className="flex items-center justify-center gap-3">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
							Sending...
						</span>
					) : (
						`Send to ${selectedDeviceIds.size} Device${selectedDeviceIds.size === 1 ? "" : "s"}`
					)}
				</button>
			</div>

			{/* Send Result */}
			{sendResult && (
				<div className="bg-white rounded-xl shadow-md p-6">
					<h3 className="text-lg font-bold text-gray-900 mb-4">Send Result</h3>

					<div className="grid grid-cols-2 gap-4 mb-6">
						<div className="bg-green-50 rounded-lg p-4 text-center">
							<p className="text-3xl font-bold text-green-700">
								{sendResult.successCount}
							</p>
							<p className="text-sm text-green-600 font-medium">Successful</p>
						</div>
						<div className="bg-red-50 rounded-lg p-4 text-center">
							<p className="text-3xl font-bold text-red-700">
								{sendResult.failureCount}
							</p>
							<p className="text-sm text-red-600 font-medium">Failed</p>
						</div>
					</div>

					{sendResult.failureCount > 0 && (
						<div className="space-y-2">
							<h4 className="font-semibold text-gray-900 mb-2">
								Failed Tokens:
							</h4>
							{sendResult.responses
								.filter((r) => !r.success)
								.map((result, idx) => (
									<div
										key={result.token || idx}
										className="bg-red-50 border border-red-200 rounded-lg p-3"
									>
										<p className="text-xs font-mono text-gray-600 mb-1">
											Token: {result.token.substring(0, 20)}...
										</p>
										{result.error && (
											<div>
												<p className="text-sm font-semibold text-red-800">
													{result.error.code}
												</p>
												<p className="text-sm text-red-700">
													{result.error.message}
												</p>
											</div>
										)}
									</div>
								))}
						</div>
					)}

					{error && (
						<div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
							<p className="text-sm font-semibold text-red-800 mb-1">Error:</p>
							<p className="text-sm text-red-700">{error}</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
