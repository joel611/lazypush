import { useState } from "react";
import { ProjectView } from "./components/ProjectView";
import { QuickStartView } from "./components/QuickStartView";

function App() {
	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);

	function openProject(projectId: string) {
		setSelectedProjectId(projectId);
	}

	function closeProject() {
		setSelectedProjectId(null);
	}

	if (selectedProjectId) {
		return <ProjectView projectId={selectedProjectId} onClose={closeProject} />;
	}

	return <QuickStartView onOpenProject={openProject} />;
}

export default App;
