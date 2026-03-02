import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { DebugLogFilter } from "../types/debugLog";
import type { SendHistoryEntry } from "../types/sendHistory";

interface DebugPanelProps {
	projectId?: string; // Optional: if provided, filter by project
	isOpen: boolean;
	onToggle: () => void;
}

export function DebugPanel({ projectId, isOpen, onToggle }: DebugPanelProps) {
	const [history, setHistory] = useState<SendHistoryEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedEntry, setSelectedEntry] = useState<SendHistoryEntry | null>(
		null,
	);
	const [filter, setFilter] = useState<DebugLogFilter>({
		type: "all",
		status: "all",
		searchTerm: "",
	});

	const loadHistory = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Load history for specific project or all projects
			const result = projectId
				? await invoke<SendHistoryEntry[]>("load_send_history", { projectId })
				: await invoke<SendHistoryEntry[]>("load_all_send_history");

			setHistory(result);
		} catch (err) {
			setError(
				`Unable to load send history: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		if (isOpen) {
			loadHistory();
		}
	}, [isOpen, loadHistory]);

	function handleRefresh() {
		loadHistory();
	}

	async function handleClearHistory() {
		if (
			!confirm(
				"Are you sure you want to clear all send history? This action cannot be undone.",
			)
		) {
			return;
		}

		try {
			if (projectId) {
				// Clear history for specific project
				await invoke("clear_send_history", { projectId });
			} else {
				// Clear history for all projects
				// We need to load all projects and clear each one
				const allHistory = await invoke<SendHistoryEntry[]>(
					"load_all_send_history",
				);
				const projectIds = new Set(allHistory.map((entry) => entry.projectId));

				for (const pid of projectIds) {
					await invoke("clear_send_history", { projectId: pid });
				}
			}

			// Reload history
			await loadHistory();
		} catch (err) {
			alert(
				`Failed to clear history: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	// Apply filters
	const filteredHistory = history.filter((entry) => {
		// Status filter
		if (filter.status === "success" && entry.response.failureCount > 0) {
			return false;
		}
		if (filter.status === "error" && entry.response.successCount > 0) {
			return false;
		}

		// Search filter
		if (filter.searchTerm) {
			const searchLower = filter.searchTerm.toLowerCase();
			const matchesProject = entry.projectName
				.toLowerCase()
				.includes(searchLower);
			const matchesMessage = JSON.stringify(entry.message)
				.toLowerCase()
				.includes(searchLower);
			if (!matchesProject && !matchesMessage) {
				return false;
			}
		}

		return true;
	});

	return (
		<div
			className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl transition-all duration-300 z-50 ${
				isOpen ? "h-[500px]" : "h-12"
			}`}
		>
			{/* Header */}
			<div className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 cursor-pointer hover:bg-gray-800">
				<button
					type="button"
					onClick={onToggle}
					className="flex items-center gap-2 flex-1"
				>
					<svg
						className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<title>Toggle</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 15l7-7 7 7"
						/>
					</svg>
					<span className="font-semibold">
						Debug Panel - Send History ({filteredHistory.length} entries)
					</span>
				</button>

				{isOpen && (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleRefresh();
							}}
							className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
							disabled={loading}
						>
							{loading ? "Loading..." : "Refresh"}
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleClearHistory();
							}}
							className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
						>
							Clear All
						</button>
					</div>
				)}
			</div>

			{/* Content */}
			{isOpen && (
				<div className="h-[calc(100%-3rem)] flex">
					{/* Left Panel: History List */}
					<div className="w-1/2 border-r border-gray-200 overflow-y-auto">
						{/* Filters */}
						<div className="bg-gray-50 p-3 border-b border-gray-200 space-y-2">
							<input
								type="text"
								placeholder="Search by project or message..."
								value={filter.searchTerm}
								onChange={(e) =>
									setFilter({ ...filter, searchTerm: e.target.value })
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>

							<div className="flex gap-2">
								<select
									value={filter.status}
									onChange={(e) =>
										setFilter({
											...filter,
											status: e.target.value as "success" | "error" | "all",
										})
									}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
								>
									<option value="all">All Status</option>
									<option value="success">Success Only</option>
									<option value="error">Errors Only</option>
								</select>
							</div>
						</div>

						{/* History List */}
						{loading && (
							<div className="flex items-center justify-center py-10">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
							</div>
						)}

						{error && (
							<div className="p-4 bg-red-50 border-b border-red-200">
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}

						{!loading && !error && filteredHistory.length === 0 && (
							<div className="p-8 text-center text-gray-500">
								<p>No send history found</p>
							</div>
						)}

						{!loading &&
							!error &&
							filteredHistory.map((entry) => (
								<button
									type="button"
									key={entry.id}
									onClick={() => setSelectedEntry(entry)}
									className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
										selectedEntry?.id === entry.id ? "bg-blue-50" : ""
									}`}
								>
									<div className="flex items-start justify-between mb-2">
										<div className="flex-1">
											<p className="font-semibold text-gray-900">
												{entry.projectName}
											</p>
											<p className="text-xs text-gray-500">
												{new Date(entry.timestamp).toLocaleString()}
											</p>
										</div>
										<div className="flex gap-2">
											{entry.response.successCount > 0 && (
												<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
													{entry.response.successCount} ✓
												</span>
											)}
											{entry.response.failureCount > 0 && (
												<span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
													{entry.response.failureCount} ✗
												</span>
											)}
										</div>
									</div>

									<p className="text-sm text-gray-600 truncate">
										{entry.devices.length} device
										{entry.devices.length === 1 ? "" : "s"}
										{(() => {
											const notif = entry.message.notification;
											if (
												notif &&
												typeof notif === "object" &&
												"title" in notif &&
												typeof notif.title === "string"
											) {
												return ` • ${notif.title}`;
											}
											return null;
										})()}
									</p>
								</button>
							))}
					</div>

					{/* Right Panel: Entry Details */}
					<div className="w-1/2 overflow-y-auto bg-gray-50">
						{selectedEntry ? (
							<div className="p-4 space-y-4">
								{/* Header Info */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<h3 className="font-bold text-gray-900 mb-2">Send Details</h3>
									<div className="space-y-1 text-sm">
										<p>
											<span className="font-medium">Project:</span>{" "}
											{selectedEntry.projectName}
										</p>
										<p>
											<span className="font-medium">Timestamp:</span>{" "}
											{new Date(selectedEntry.timestamp).toLocaleString()}
										</p>
										<p>
											<span className="font-medium">Entry ID:</span>{" "}
											{selectedEntry.id}
										</p>
									</div>
								</div>

								{/* Response Summary */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<h3 className="font-bold text-gray-900 mb-2">
										Response Summary
									</h3>
									<div className="grid grid-cols-2 gap-2">
										<div className="bg-green-50 rounded p-3 text-center">
											<p className="text-2xl font-bold text-green-700">
												{selectedEntry.response.successCount}
											</p>
											<p className="text-xs text-green-600">Successful</p>
										</div>
										<div className="bg-red-50 rounded p-3 text-center">
											<p className="text-2xl font-bold text-red-700">
												{selectedEntry.response.failureCount}
											</p>
											<p className="text-xs text-red-600">Failed</p>
										</div>
									</div>
								</div>

								{/* Target Devices */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<h3 className="font-bold text-gray-900 mb-2">
										Target Devices ({selectedEntry.devices.length})
									</h3>
									<div className="space-y-2">
										{selectedEntry.devices.map((device) => (
											<div
												key={device.id}
												className="bg-gray-50 rounded p-2 text-sm"
											>
												<p className="font-medium text-gray-900">
													{device.name}
												</p>
												<p className="text-xs text-gray-500 font-mono truncate">
													{device.token}
												</p>
											</div>
										))}
									</div>
								</div>

								{/* Request Payload */}
								<div className="bg-white rounded-lg p-4 shadow-sm">
									<h3 className="font-bold text-gray-900 mb-2">
										Request Payload
									</h3>
									<pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto font-mono">
										{JSON.stringify(selectedEntry.message, null, 2)}
									</pre>
								</div>

								{/* Token Results */}
								{selectedEntry.response.responses.length > 0 && (
									<div className="bg-white rounded-lg p-4 shadow-sm">
										<h3 className="font-bold text-gray-900 mb-2">
											Token Results
										</h3>
										<div className="space-y-2">
											{selectedEntry.response.responses.map((result, idx) => (
												<div
													key={result.token || idx}
													className={`rounded p-3 border ${
														result.success
															? "bg-green-50 border-green-200"
															: "bg-red-50 border-red-200"
													}`}
												>
													<div className="flex items-start justify-between mb-1">
														<p className="text-xs font-mono text-gray-600 truncate flex-1">
															{result.token.substring(0, 40)}...
														</p>
														<span
															className={`px-2 py-0.5 rounded text-xs font-bold ${
																result.success
																	? "bg-green-200 text-green-800"
																	: "bg-red-200 text-red-800"
															}`}
														>
															{result.success ? "SUCCESS" : "FAILED"}
														</span>
													</div>

													{result.success && result.messageId && (
														<p className="text-xs text-gray-600">
															<span className="font-medium">Message ID:</span>{" "}
															{result.messageId}
														</p>
													)}

													{!result.success && result.error && (
														<div className="mt-2">
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
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center justify-center h-full text-gray-500">
								<p>Select an entry to view details</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
