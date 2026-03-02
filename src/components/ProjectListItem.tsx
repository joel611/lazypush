import type { ProjectConfig } from "../types/project";

interface ProjectListItemProps {
	project: ProjectConfig;
	selected: boolean;
	onSelect: () => void;
}

export function ProjectListItem({
	project,
	selected,
	onSelect,
}: ProjectListItemProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`
        w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 group
        ${
					selected
						? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100"
						: "border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl transform hover:-translate-y-1"
				}
      `}
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1">
					<h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
						{project.name}
					</h3>
					<div className="flex items-center gap-2 mb-2">
						<span className="text-xs font-medium text-gray-500">
							Project ID:
						</span>
						<span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
							{project.projectId}
						</span>
					</div>
				</div>
				{selected && (
					<div className="flex-shrink-0">
						<div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
							<svg
								className="w-4 h-4 text-white"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<title>Selected</title>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</div>
				)}
			</div>
			<p className="text-xs text-gray-500 truncate mb-3 font-mono bg-gray-50 px-2 py-1 rounded">
				{project.clientEmail}
			</p>
			<div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-200">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<title>Calendar</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
			</div>
		</button>
	);
}
