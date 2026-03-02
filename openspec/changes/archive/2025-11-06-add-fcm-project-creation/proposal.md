# Add FCM Project Creation

## Why

Users need a way to create and manage Firebase Cloud Messaging projects within the application by providing their Firebase service account JSON files. Currently, there is no UI or backend functionality to create projects, making the application unusable for its primary purpose of testing push notifications.

## What Changes

- Add Quick Start view as the primary interface when application starts:
  - Display existing projects in a list (sorted by creation date)
  - Show prominent "Create Project" button
  - Implement empty state for first-time users with welcome messaging
  - Load all projects automatically on application launch
- Add a "Create Project" modal dialog UI with file picker for Firebase service account JSON files
- Implement Rust backend Tauri commands for:
  - Validating Firebase service account JSON structure
  - Extracting project metadata (project_id, project name)
  - Creating project directory structure in `data/projects/`
  - Copying service account file to app storage
  - Writing project configuration to `config.json`
  - Loading all existing projects for display
- Add React frontend components for project creation modal with:
  - File upload/selection interface (drag-and-drop or file picker)
  - Real-time validation feedback during file selection
  - Project name input field (pre-filled from JSON, editable)
  - Auto-extracted and display-only project metadata
  - Save/Cancel actions
- Create project data model and storage format
- Add error handling for invalid JSON files, duplicate projects, and file system errors

## Impact

- **Affected specs**: Creates new `fcm-project-management` capability
- **Affected code**:
  - `src/App.tsx`: Replace placeholder content with Quick Start view
  - `src-tauri/src/`: New Rust modules for project management and Firebase service account validation
  - `src/components/`: New React components for Quick Start view, project creation modal, and project list items
  - `src/`: New TypeScript types for project data models
  - `data/projects/`: New directory structure for project storage
- **User experience**: Provides immediate value on first launch with Quick Start view, enables the core workflow of creating projects to start testing notifications
- **Dependencies**: No new external dependencies required (uses existing Tauri, React, shadcn/ui, and file system APIs)
