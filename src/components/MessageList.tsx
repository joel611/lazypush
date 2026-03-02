import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { MessageTemplate } from "../types/message";
import { MessageForm } from "./MessageForm";

interface MessageListProps {
	projectId: string;
}

export function MessageList({ projectId }: MessageListProps) {
	const [messages, setMessages] = useState<MessageTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedMessage, setSelectedMessage] =
		useState<MessageTemplate | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const loadMessages = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await invoke<MessageTemplate[]>("load_messages", {
				projectId,
			});
			setMessages(result);
		} catch (err) {
			setError(
				`Unable to load message templates: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		loadMessages();
	}, [loadMessages]);

	function handleAddMessage() {
		setSelectedMessage(null);
		setModalOpen(true);
	}

	function handleEditMessage(message: MessageTemplate) {
		setSelectedMessage(message);
		setModalOpen(true);
	}

	async function handleDeleteMessage(message: MessageTemplate) {
		if (
			!confirm(
				`Are you sure you want to delete "${message.name}"? This action cannot be undone.`,
			)
		) {
			return;
		}

		try {
			await invoke("delete_message", {
				projectId,
				messageId: message.id,
			});
			await loadMessages();
		} catch (err) {
			alert(
				`Failed to delete message: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	function toggleExpand(id: string) {
		setExpandedId(expandedId === id ? null : id);
	}

	function handleMessageChanged() {
		loadMessages();
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading message templates...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-xl p-6">
				<h3 className="text-lg font-semibold text-red-900 mb-2">
					Error Loading Messages
				</h3>
				<p className="text-red-700">{error}</p>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<>
				<div className="text-center py-20 bg-white rounded-2xl shadow-md">
					<div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-6">
						<svg
							className="h-10 w-10 text-purple-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<title>Message</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
							/>
						</svg>
					</div>
					<h3 className="text-2xl font-bold text-gray-900 mb-2">
						No Message Templates Yet
					</h3>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Create your first message template to streamline notification
						testing
					</p>
					<button
						type="button"
						onClick={handleAddMessage}
						className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						+ Create First Template
					</button>
				</div>
				<MessageForm
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onMessageChanged={handleMessageChanged}
					projectId={projectId}
					message={selectedMessage}
				/>
			</>
		);
	}

	return (
		<>
			<div className="mb-6 flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Message Templates
					</h2>
					<p className="text-gray-600 text-sm mt-1">
						{messages.length} {messages.length === 1 ? "template" : "templates"}{" "}
						saved
					</p>
				</div>
				<button
					type="button"
					onClick={handleAddMessage}
					className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
				>
					+ Create Template
				</button>
			</div>

			<div className="space-y-4">
				{messages.map((message) => {
					const isExpanded = expandedId === message.id;
					const hasNotification =
						message.notification?.title || message.notification?.body;
					const hasData = message.data && Object.keys(message.data).length > 0;
					const hasAndroid = message.android?.priority;
					const hasApns = message.apns?.headers.apnsPriority;

					return (
						<div
							key={message.id}
							className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200"
						>
							{/* Message Header */}
							<div className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<h3 className="text-lg font-bold text-gray-900 mb-2">
											{message.name}
										</h3>
										<div className="flex flex-wrap gap-2 mb-3">
											{hasNotification && (
												<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
													Notification
												</span>
											)}
											{hasData && (
												<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
													Data Payload
												</span>
											)}
											{hasAndroid && (
												<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
													Android
												</span>
											)}
											{hasApns && (
												<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
													iOS
												</span>
											)}
										</div>
										<p className="text-xs text-gray-500">
											Created {new Date(message.createdAt).toLocaleDateString()}
										</p>
									</div>
									<button
										type="button"
										onClick={() => toggleExpand(message.id)}
										className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
									>
										<svg
											className={`w-5 h-5 text-gray-600 transition-transform ${
												isExpanded ? "rotate-180" : ""
											}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>{isExpanded ? "Collapse" : "Expand"}</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
								</div>

								{/* Preview */}
								{!isExpanded && hasNotification && (
									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										{message.notification?.title && (
											<p className="font-semibold text-gray-900 mb-1">
												{message.notification.title}
											</p>
										)}
										{message.notification?.body && (
											<p className="text-sm text-gray-600">
												{message.notification.body}
											</p>
										)}
									</div>
								)}

								{/* Expanded Details */}
								{isExpanded && (
									<div className="space-y-4 mt-4">
										{/* Notification */}
										{message.notification && (
											<div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
												<h4 className="font-semibold text-purple-900 mb-2 text-sm">
													Notification
												</h4>
												<div className="space-y-2 text-sm">
													{message.notification.title && (
														<div>
															<span className="font-medium text-gray-700">
																Title:{" "}
															</span>
															<span className="text-gray-900">
																{message.notification.title}
															</span>
														</div>
													)}
													{message.notification.body && (
														<div>
															<span className="font-medium text-gray-700">
																Body:{" "}
															</span>
															<span className="text-gray-900">
																{message.notification.body}
															</span>
														</div>
													)}
													{message.notification.imageUrl && (
														<div>
															<span className="font-medium text-gray-700">
																Image:{" "}
															</span>
															<span className="text-gray-900 font-mono text-xs">
																{message.notification.imageUrl}
															</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* Data Payload */}
										{message.data && Object.keys(message.data).length > 0 && (
											<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
												<h4 className="font-semibold text-blue-900 mb-2 text-sm">
													Data Payload
												</h4>
												<div className="space-y-1">
													{Object.entries(message.data).map(([key, value]) => (
														<div
															key={key}
															className="flex gap-2 text-sm font-mono"
														>
															<span className="font-semibold text-blue-700">
																{key}:
															</span>
															<span className="text-gray-900">{value}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Platform Configs */}
										<div className="grid md:grid-cols-2 gap-4">
											{message.android && (
												<div className="bg-green-50 rounded-lg p-4 border border-green-200">
													<h4 className="font-semibold text-green-900 mb-2 text-sm">
														Android Config
													</h4>
													<div className="text-sm">
														<span className="font-medium text-gray-700">
															Priority:{" "}
														</span>
														<span className="text-gray-900">
															{message.android.priority}
														</span>
													</div>
												</div>
											)}
											{message.apns && (
												<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
													<h4 className="font-semibold text-blue-900 mb-2 text-sm">
														APNs Config
													</h4>
													<div className="space-y-1 text-sm">
														<div>
															<span className="font-medium text-gray-700">
																Priority:{" "}
															</span>
															<span className="text-gray-900">
																{message.apns.headers.apnsPriority}
															</span>
														</div>
														{message.apns.payload.aps.contentAvailable ===
															1 && (
															<div className="text-blue-700">
																✓ Content Available
															</div>
														)}
														{message.apns.payload.aps.mutableContent === 1 && (
															<div className="text-blue-700">
																✓ Mutable Content
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Actions */}
								<div className="flex gap-2 mt-4">
									<button
										type="button"
										onClick={() => handleEditMessage(message)}
										className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors"
									>
										Edit
									</button>
									<button
										type="button"
										onClick={() => handleDeleteMessage(message)}
										className="flex-1 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<MessageForm
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onMessageChanged={handleMessageChanged}
				projectId={projectId}
				message={selectedMessage}
			/>
		</>
	);
}
