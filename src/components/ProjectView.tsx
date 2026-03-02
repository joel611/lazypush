import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { ProjectConfig } from "../types/project";
import { DeviceList } from "./DeviceList";
import { MessageList } from "./MessageList";
import { SendPanel } from "./SendPanel";

interface ProjectViewProps {
	projectId: string;
	onClose: () => void;
}

type TabType = "devices" | "messages" | "send";

export function ProjectView({ projectId, onClose }: ProjectViewProps) {
	const [project, setProject] = useState<ProjectConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabType>("devices");

	useEffect(() => {
		async function loadProject() {
			try {
				const projects = await invoke<ProjectConfig[]>("load_all_projects");
				const foundProject = projects.find((p) => p.id === projectId);
				if (foundProject) {
					setProject(foundProject);
				}
			} catch (err) {
				console.error("Failed to load project:", err);
			} finally {
				setLoading(false);
			}
		}
		loadProject();
	}, [projectId]);

	if (loading || !project) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
				<div className="text-center bg-white p-8 rounded-2xl shadow-lg">
					<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-700 font-medium">Loading project...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
			{/* Header */}
			<div className="bg-white shadow-md border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={onClose}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<svg
									className="w-6 h-6 text-gray-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<title>Back</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 19l-7-7m0 0l7-7m-7 7h18"
									/>
								</svg>
							</button>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									{project.name}
								</h1>
								<p className="text-sm text-gray-600 font-mono">
									{project.projectId}
								</p>
							</div>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex gap-2 mt-6">
						<button
							type="button"
							onClick={() => setActiveTab("devices")}
							className={`px-6 py-3 font-medium rounded-lg transition-all ${
								activeTab === "devices"
									? "bg-blue-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Devices
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("messages")}
							className={`px-6 py-3 font-medium rounded-lg transition-all ${
								activeTab === "messages"
									? "bg-blue-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Messages
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("send")}
							className={`px-6 py-3 font-medium rounded-lg transition-all ${
								activeTab === "send"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Send
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				{activeTab === "devices" && <DeviceList projectId={projectId} />}
				{activeTab === "messages" && <MessageList projectId={projectId} />}
				{activeTab === "send" && <SendPanel projectId={projectId} />}
			</div>
		</div>
	);
}
