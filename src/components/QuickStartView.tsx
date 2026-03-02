import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import type { ProjectConfig } from "../types/project";
import { CreateProjectModal } from "./CreateProjectModal";
import { ProjectListItem } from "./ProjectListItem";

interface QuickStartViewProps {
	onOpenProject: (projectId: string) => void;
}

export function QuickStartView({ onOpenProject }: QuickStartViewProps) {
	const [projects, setProjects] = useState<ProjectConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);

	const loadProjects = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await invoke<ProjectConfig[]>("load_all_projects");
			setProjects(result);
		} catch (err) {
			setError(
				`Unable to load projects: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadProjects();
	}, [loadProjects]);

	function handleProjectCreated(newProject: ProjectConfig) {
		setProjects((prev) => [newProject, ...prev]);
		setSelectedProjectId(newProject.id);
		setModalOpen(false);
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
				<div className="text-center bg-white p-8 rounded-2xl shadow-lg">
					<div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
					<p className="text-gray-700 font-medium">Loading projects...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
				<div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl">
					<div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="h-8 w-8 text-red-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<title>Error</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Unable to Load Projects
					</h3>
					<p className="text-red-600 text-sm mb-6">{error}</p>
					<button
						type="button"
						onClick={() => setModalOpen(true)}
						className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
					>
						Create Project
					</button>
				</div>
				<CreateProjectModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onProjectCreated={handleProjectCreated}
				/>
			</div>
		);
	}

	if (projects.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
				<div className="text-center max-w-lg bg-white p-12 rounded-3xl shadow-2xl">
					<div className="mb-8">
						<div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 mx-auto rounded-2xl flex items-center justify-center shadow-lg">
							<svg
								className="h-12 w-12 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Folder</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								/>
							</svg>
						</div>
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-3">
						Welcome to FCM Push Notification Tester
					</h1>
					<p className="text-gray-600 text-lg mb-10">
						Get started by creating your first Firebase project
					</p>
					<button
						type="button"
						onClick={() => setModalOpen(true)}
						className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						Create Your First Project
					</button>
				</div>
				<CreateProjectModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onProjectCreated={handleProjectCreated}
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
			<div className="max-w-7xl mx-auto px-6 py-10">
				<div className="flex justify-between items-center mb-10">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
						<p className="text-gray-600">
							Manage your Firebase projects for push notification testing
						</p>
					</div>
					<button
						type="button"
						onClick={() => setModalOpen(true)}
						className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						+ New Project
					</button>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<ProjectListItem
							key={project.id}
							project={project}
							selected={selectedProjectId === project.id}
							onSelect={() => onOpenProject(project.id)}
						/>
					))}
				</div>
			</div>
			<CreateProjectModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onProjectCreated={handleProjectCreated}
			/>
		</div>
	);
}
