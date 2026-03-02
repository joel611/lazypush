import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
import type {
	CreateProjectResult,
	ProjectConfig,
	ProjectFormData,
	ServiceAccountValidation,
} from "../types/project";
import { DuplicateWarningModal } from "./DuplicateWarningModal";

interface CreateProjectModalProps {
	open: boolean;
	onClose: () => void;
	onProjectCreated: (project: ProjectConfig) => void;
}

export function CreateProjectModal({
	open,
	onClose,
	onProjectCreated,
}: CreateProjectModalProps) {
	const [formData, setFormData] = useState<ProjectFormData>({
		name: "",
		serviceAccountPath: "",
	});
	const [validation, setValidation] = useState<ServiceAccountValidation | null>(
		null,
	);
	const [validating, setValidating] = useState(false);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
	const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			setFormData({ name: "", serviceAccountPath: "" });
			setValidation(null);
			setError(null);
			setIsDragging(false);
			setShowDuplicateWarning(false);
			setIgnoreDuplicate(false);
		}
	}, [open]);

	// Handle ESC key to close modal
	useEffect(() => {
		if (!open) return;

		function handleEscKey(e: KeyboardEvent) {
			if (e.key === "Escape" && !creating && !showDuplicateWarning) {
				onClose();
			}
		}

		window.addEventListener("keydown", handleEscKey);
		return () => window.removeEventListener("keydown", handleEscKey);
	}, [open, creating, showDuplicateWarning, onClose]);

	const validateFile = useCallback(async (filePath: string) => {
		try {
			setValidating(true);
			setError(null);

			const result = await invoke<ServiceAccountValidation>(
				"validate_service_account",
				{
					filePath,
				},
			);

			setValidation(result);

			if (result.valid && result.projectId) {
				// Auto-populate project name from project_id
				setFormData((prev) => ({
					...prev,
					name: prev.name || result.projectId || "",
					projectId: result.projectId || undefined,
					clientEmail: result.clientEmail || undefined,
				}));
			} else if (result.error) {
				setError(result.error);
			}
		} catch (err) {
			setError(
				`Validation failed: ${err instanceof Error ? err.message : String(err)}`,
			);
			setValidation(null);
		} finally {
			setValidating(false);
		}
	}, []);

	// Setup drag-and-drop event listeners
	useEffect(() => {
		if (!open) return;

		let unlistenDrop: (() => void) | undefined;
		let unlistenEnter: (() => void) | undefined;
		let unlistenLeave: (() => void) | undefined;

		const setupListeners = async () => {
			unlistenEnter = await listen("tauri://drag-enter", () => {
				setIsDragging(true);
			});

			unlistenLeave = await listen("tauri://drag-leave", () => {
				setIsDragging(false);
			});

			unlistenDrop = await listen<{ paths: string[] }>(
				"tauri://drag-drop",
				async (event) => {
					setIsDragging(false);

					// Get the first file path
					const filePath = event.payload.paths[0];

					if (!filePath) {
						setError("No file was dropped");
						return;
					}

					// Validate it's a JSON file
					if (!filePath.toLowerCase().endsWith(".json")) {
						setError("Please select a JSON file");
						return;
					}

					// Update form data and validate
					setFormData((prev) => ({
						...prev,
						serviceAccountPath: filePath,
					}));
					await validateFile(filePath);
				},
			);
		};

		setupListeners();

		return () => {
			unlistenDrop?.();
			unlistenEnter?.();
			unlistenLeave?.();
		};
	}, [open, validateFile]);

	async function handleFileSelect() {
		try {
			const selected = await openDialog({
				multiple: false,
				filters: [
					{
						name: "JSON",
						extensions: ["json"],
					},
				],
			});

			if (selected && typeof selected === "string") {
				setFormData((prev) => ({
					...prev,
					serviceAccountPath: selected,
				}));
				await validateFile(selected);
			}
		} catch (err) {
			setError(
				`File selection failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	async function handleNameBlur() {
		if (!formData.name.trim()) return;

		try {
			const exists = await invoke<boolean>("check_project_name_exists", {
				name: formData.name,
			});

			if (exists) {
				setError("Project name already exists");
			}
		} catch (err) {
			console.error("Failed to check project name:", err);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!formData.name.trim()) {
			setError("Project name is required");
			return;
		}

		if (!formData.serviceAccountPath) {
			setError("Service account file is required");
			return;
		}

		if (!validation?.valid) {
			setError("Please select a valid service account file");
			return;
		}

		// Check for duplicate Firebase project and show warning if not already ignored
		if (
			!ignoreDuplicate &&
			validation.duplicateProjectName &&
			validation.projectId
		) {
			setShowDuplicateWarning(true);
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const result = await invoke<CreateProjectResult>("create_project", {
				name: formData.name.trim(),
				serviceAccountPath: formData.serviceAccountPath,
			});

			if (result.success && result.projectId) {
				// Fetch the created project config
				const projects = await invoke<ProjectConfig[]>("load_all_projects");
				const newProject = projects.find((p) => p.id === result.projectId);

				if (newProject) {
					onProjectCreated(newProject);
				}
			} else if (result.error) {
				setError(result.error);
			}
		} catch (err) {
			setError(
				`Failed to create project: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setCreating(false);
		}
	}

	function handleDuplicateCancel() {
		setShowDuplicateWarning(false);
	}

	function handleDuplicateConfirm() {
		setShowDuplicateWarning(false);
		setIgnoreDuplicate(true);
		// Trigger form submission programmatically
		const form = document.querySelector("form");
		if (form) {
			form.dispatchEvent(
				new Event("submit", { bubbles: true, cancelable: true }),
			);
		}
	}

	if (!open) return null;

	const canSubmit =
		formData.name.trim() &&
		formData.serviceAccountPath &&
		validation?.valid &&
		!validating &&
		!creating;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
				<form onSubmit={handleSubmit}>
					{/* Header */}
					<div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
						<h2 className="text-2xl font-bold text-white">
							Create New Project
						</h2>
						<p className="text-blue-100 text-sm mt-1">
							Add a Firebase project to start testing push notifications
						</p>
					</div>

					{/* Body */}
					<div className="px-8 py-8 space-y-8 overflow-y-auto max-h-[calc(90vh-200px)]">
						{/* File Selection Area */}
						<div>
							<div className="block text-sm font-semibold text-gray-700 mb-3">
								Firebase Service Account
							</div>
							<button
								type="button"
								onClick={handleFileSelect}
								className={`
                  w-full p-10 border-2 border-dashed rounded-xl transition-all duration-200 shadow-sm hover:shadow-md
                  ${isDragging ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02] ring-2 ring-blue-300" : ""}
                  ${formData.serviceAccountPath && !isDragging ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-100" : ""}
                  ${!formData.serviceAccountPath && !isDragging ? "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50" : ""}
                  ${error && !formData.serviceAccountPath && !isDragging ? "border-red-300 bg-red-50" : ""}
                `}
							>
								{validating ? (
									<div className="text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
										<p className="text-sm text-gray-600">Validating file...</p>
									</div>
								) : formData.serviceAccountPath ? (
									<div className="text-center">
										<svg
											className="h-12 w-12 mx-auto mb-2 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>File selected</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<p className="text-sm text-gray-900 font-medium mb-1">
											File selected
										</p>
										<p className="text-xs text-gray-600 break-all">
											{formData.serviceAccountPath}
										</p>
									</div>
								) : (
									<div className="text-center">
										<svg
											className="h-12 w-12 mx-auto mb-2 text-gray-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>Upload file</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
											/>
										</svg>
										<p className="text-sm text-gray-600 mb-1">
											{isDragging
												? "Drop JSON file here"
												: "Click to browse or drag & drop"}
										</p>
										<p className="text-xs text-gray-500">
											Firebase service account JSON file
										</p>
									</div>
								)}
							</button>
						</div>

						{/* Metadata Display */}
						{validation?.valid && formData.projectId && (
							<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 shadow-sm">
								<div className="flex items-center gap-2 mb-3">
									<svg
										className="h-5 w-5 text-blue-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<title>Info</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p className="text-sm font-semibold text-blue-900">
										Project Metadata
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-blue-800 flex items-start gap-2">
										<span className="font-medium min-w-[100px]">
											Project ID:
										</span>
										<span className="flex-1 font-mono text-xs bg-white px-2 py-1 rounded">
											{formData.projectId}
										</span>
									</p>
									{formData.clientEmail && (
										<p className="text-sm text-blue-800 flex items-start gap-2">
											<span className="font-medium min-w-[100px]">
												Client Email:
											</span>
											<span className="flex-1 font-mono text-xs bg-white px-2 py-1 rounded break-all">
												{formData.clientEmail}
											</span>
										</p>
									)}
								</div>
							</div>
						)}

						{/* Project Name Input */}
						<div>
							<label
								htmlFor="projectName"
								className="block text-sm font-semibold text-gray-700 mb-3"
							>
								Project Name
							</label>
							<input
								id="projectName"
								type="text"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								onBlur={handleNameBlur}
								placeholder="Enter a friendly name for your project"
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={creating}
							/>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm">
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
										<svg
											className="h-5 w-5 text-red-600"
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
									<div className="flex-1 pt-1">
										<p className="text-sm font-medium text-red-900 mb-1">
											Error
										</p>
										<p className="text-sm text-red-700">{error}</p>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={creating}
							className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all shadow-sm hover:shadow disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!canSubmit}
							className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
						>
							{creating ? (
								<span className="flex items-center gap-2">
									<svg
										className="animate-spin h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24"
									>
										<title>Creating...</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Creating...
								</span>
							) : (
								"Create Project"
							)}
						</button>
					</div>
				</form>
			</div>

			{/* Duplicate Warning Modal */}
			{validation?.projectId && validation?.duplicateProjectName && (
				<DuplicateWarningModal
					open={showDuplicateWarning}
					projectId={validation.projectId}
					duplicateProjectName={validation.duplicateProjectName}
					onCancel={handleDuplicateCancel}
					onConfirm={handleDuplicateConfirm}
				/>
			)}
		</div>
	);
}
