import { useState } from "react";
import { DebugPanel } from "./components/DebugPanel";
import { ProjectView } from "./components/ProjectView";
import { QuickStartView } from "./components/QuickStartView";

function App() {
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);
	const [debugPanelOpen, setDebugPanelOpen] = useState(false);

	function openProject(projectId: string) {
		setSelectedProjectId(projectId);
	}

	function closeProject() {
		setSelectedProjectId(null);
	}

	function toggleDebugPanel() {
		setDebugPanelOpen(!debugPanelOpen);
	}

	return (
		<div className="relative h-screen overflow-hidden">
			{/* Main Content */}
			<div
				className={`h-full overflow-auto transition-all ${
					debugPanelOpen ? "pb-[500px]" : "pb-12"
				}`}
			>
				{selectedProjectId ? (
					<ProjectView projectId={selectedProjectId} onClose={closeProject} />
				) : (
					<QuickStartView onOpenProject={openProject} />
				)}
			</div>

			{/* Debug Panel */}
			<DebugPanel
				projectId={selectedProjectId || undefined}
				isOpen={debugPanelOpen}
				onToggle={toggleDebugPanel}
			/>
		</div>
	);
}

export default App;
