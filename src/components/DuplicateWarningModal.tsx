import { useEffect } from "react";

interface DuplicateWarningModalProps {
	open: boolean;
	projectId: string;
	duplicateProjectName: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export function DuplicateWarningModal({
	open,
	projectId,
	duplicateProjectName,
	onCancel,
	onConfirm,
}: DuplicateWarningModalProps) {
	// Handle ESC key to close modal
	useEffect(() => {
		if (!open) return;

		function handleEscKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onCancel();
			}
		}

		window.addEventListener("keydown", handleEscKey);
		return () => window.removeEventListener("keydown", handleEscKey);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
			<div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
				{/* Header */}
				<div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-t-2xl">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
							<svg
								className="w-6 h-6 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Warning</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-bold text-white">
							Duplicate Firebase Project
						</h2>
					</div>
				</div>

				{/* Body */}
				<div className="px-6 py-6 space-y-4">
					<p className="text-gray-700 leading-relaxed">
						Firebase project{" "}
						<span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
							{projectId}
						</span>{" "}
						is already used by project{" "}
						<span className="font-semibold text-gray-900">
							{duplicateProjectName}
						</span>
						.
					</p>
					<p className="text-gray-600 text-sm">
						Creating this project will result in multiple projects using the
						same Firebase credentials. This may cause confusion when managing
						your test projects.
					</p>
					<p className="text-gray-700 font-medium">Do you want to continue?</p>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
					>
						Create Anyway
					</button>
				</div>
			</div>
		</div>
	);
}
