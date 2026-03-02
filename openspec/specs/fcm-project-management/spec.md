# fcm-project-management Specification

## Purpose
This specification defines the requirements for managing Firebase Cloud Messaging (FCM) projects within the application. It covers project creation, validation of Firebase service account files, data storage, and the Quick Start view for browsing and selecting projects. This is a foundational feature that enables users to configure multiple Firebase projects for testing push notifications.
## Requirements
### Requirement: Application Start Quick Start View
The application SHALL display a Quick Start view as the primary interface when the application starts, showing existing projects or an empty state with project creation prompt.

#### Scenario: Display Quick Start view on application launch
- **WHEN** the application launches for the first time or subsequently
- **THEN** the Quick Start view SHALL be the primary visible interface
- **AND** the view SHALL automatically load and display all existing projects
- **AND** the view SHALL include a prominently placed "Create Project" button
- **AND** the view SHALL render within 1 second of application start

#### Scenario: Quick Start view with existing projects
- **WHEN** the Quick Start view loads and projects exist in `data/projects/`
- **THEN** the view SHALL display a list of all projects sorted by creation date (newest first)
- **AND** each project SHALL show its name and Firebase project ID
- **AND** the "Create Project" button SHALL be visible and accessible at the top or in a fixed position
- **AND** users SHALL be able to click on a project to select it (for future features)

#### Scenario: Quick Start view with no projects
- **WHEN** the Quick Start view loads and no projects exist
- **THEN** the view SHALL display a centered empty state design
- **AND** SHALL show a welcome message like "Welcome to FCM Push Notification Tester"
- **AND** SHALL show descriptive text like "Get started by creating your first Firebase project"
- **AND** SHALL display a large, prominent "Create Project" button as the primary call-to-action
- **AND** MAY include an illustration or icon to enhance the empty state

#### Scenario: Quick Start view handles loading errors gracefully
- **WHEN** the Quick Start view fails to load projects due to file system errors
- **THEN** the view SHALL display an error message "Unable to load projects: [reason]"
- **AND** SHALL still display the "Create Project" button to allow recovery
- **AND** SHALL log the error details for debugging

### Requirement: Project Creation UI
The application SHALL provide a modal dialog interface for users to create new Firebase Cloud Messaging projects by providing a service account JSON file.

#### Scenario: Open project creation modal
- **WHEN** user clicks "New Project" button or similar trigger
- **THEN** a modal dialog SHALL appear overlaying the current view
- **AND** the modal SHALL contain a file selection area
- **AND** the modal SHALL contain a project name input field
- **AND** the modal SHALL contain Save and Cancel buttons

#### Scenario: Select service account file via file picker
- **WHEN** user clicks the file selection area
- **THEN** a native file picker dialog SHALL open
- **AND** the file picker SHALL filter to show only `.json` files
- **AND** when user selects a valid file, the file path SHALL be displayed
- **AND** basic JSON validation SHALL execute immediately

#### Scenario: Select service account file via drag and drop
- **WHEN** user drags a `.json` file over the file selection area
- **THEN** the area SHALL show a visual drop indicator
- **AND** when user drops the file, the file SHALL be processed
- **AND** basic JSON validation SHALL execute immediately

#### Scenario: Auto-populate project name from JSON
- **WHEN** a valid service account JSON file is selected
- **THEN** the `project_id` field SHALL be extracted from the JSON
- **AND** the project name input SHALL be pre-filled with the extracted `project_id`
- **AND** the user SHALL be able to edit the pre-filled project name

#### Scenario: Display project metadata
- **WHEN** a valid service account JSON file is selected
- **THEN** the `project_id` SHALL be displayed as read-only metadata
- **AND** if the JSON is invalid, an error message SHALL be displayed
- **AND** the Save button SHALL remain disabled until validation passes

#### Scenario: Cancel project creation
- **WHEN** user clicks Cancel button or closes the modal
- **THEN** the modal SHALL close without saving
- **AND** all form data SHALL be discarded
- **AND** no project files SHALL be created

### Requirement: Service Account File Validation
The application SHALL validate Firebase service account JSON files to ensure they contain required fields and proper structure before accepting them, and SHALL detect duplicate Firebase projects to prevent user confusion.

#### Scenario: Duplicate Firebase project warning
- **WHEN** user selects a service account JSON file during project creation
- **THEN** the application SHALL extract the `project_id` field from the JSON
- **AND** SHALL check if any existing project uses the same Firebase `project_id`
- **AND** if a duplicate is found, SHALL display a warning modal with message "Firebase project '[project_id]' is already used by project '[existing_project_name]'. Creating this project will result in multiple projects using the same Firebase credentials. Do you want to continue?"
- **AND** SHALL provide "Cancel" button to abort project creation and "Create Anyway" button to proceed
- **AND** if user clicks "Cancel", SHALL close the modal and keep the create project form open
- **AND** if user clicks "Create Anyway", SHALL proceed with project creation as normal
- **AND** if no duplicate is found, SHALL proceed with validation without showing warning

### Requirement: Project Data Storage
The application SHALL create a structured directory for each project and store the service account file and project configuration in the local file system.

#### Scenario: Create project directory structure
- **WHEN** user saves a new project
- **THEN** a unique project directory SHALL be created at `data/projects/[project-uuid]/`
- **AND** the project UUID SHALL be generated using a UUID v4 algorithm
- **AND** the directory SHALL be created with appropriate file system permissions

#### Scenario: Copy service account file to project directory
- **WHEN** user saves a new project
- **THEN** the selected service account JSON file SHALL be copied to `data/projects/[project-uuid]/service-account.json`
- **AND** the original file SHALL remain unmodified at its source location
- **AND** if copy fails due to permissions or disk space, SHALL display error with reason

#### Scenario: Create project configuration file
- **WHEN** user saves a new project
- **THEN** a `config.json` file SHALL be created at `data/projects/[project-uuid]/config.json`
- **AND** the file SHALL contain:
  - `id`: project UUID (string)
  - `name`: user-provided project name (string)
  - `projectId`: extracted `project_id` from service account (string)
  - `clientEmail`: extracted `client_email` from service account (string)
  - `serviceAccountPath`: relative path to copied service account file (string)
  - `createdAt`: ISO 8601 timestamp of creation (string)
- **AND** the JSON SHALL be formatted with 2-space indentation for readability

#### Scenario: Initialize empty device and message files
- **WHEN** user saves a new project
- **THEN** a `devices.json` file SHALL be created at `data/projects/[project-uuid]/devices.json`
- **AND** the file SHALL contain an empty array `[]`
- **AND** a `messages.json` file SHALL be created at `data/projects/[project-uuid]/messages.json`
- **AND** the file SHALL contain an empty array `[]`

### Requirement: Tauri Backend Commands
The application SHALL provide Rust-based Tauri commands to handle project creation operations from the frontend.

#### Scenario: Validate service account file command
- **WHEN** frontend invokes `validate_service_account` command with file path
- **THEN** the Rust backend SHALL read the file from the file system
- **AND** SHALL parse the JSON content
- **AND** SHALL return validation result with structure:
  - `valid`: boolean indicating if file is valid
  - `projectId`: extracted project_id if valid, null otherwise
  - `clientEmail`: extracted client_email if valid, null otherwise
  - `error`: error message string if invalid, null otherwise

#### Scenario: Create project command
- **WHEN** frontend invokes `create_project` command with parameters:
  - `name`: user-provided project name
  - `serviceAccountPath`: path to selected service account file
- **THEN** the Rust backend SHALL execute all storage operations atomically
- **AND** SHALL return success result with structure:
  - `success`: boolean indicating success
  - `projectId`: created project UUID if successful
  - `error`: error message string if failed, null otherwise
- **AND** if any storage operation fails, SHALL rollback all created files/directories

#### Scenario: Check duplicate project name command
- **WHEN** frontend invokes `check_project_name_exists` command with project name
- **THEN** the Rust backend SHALL scan all project config files in `data/projects/`
- **AND** SHALL return boolean indicating if name already exists
- **AND** comparison SHALL be case-insensitive to prevent confusion

### Requirement: Error Handling and User Feedback
The application SHALL provide clear, actionable error messages for all failure scenarios during project creation.

#### Scenario: File system permission errors
- **WHEN** project creation fails due to file system permissions
- **THEN** the application SHALL display error "Unable to create project: permission denied. Check folder permissions."
- **AND** SHALL not create partial project data

#### Scenario: Disk space errors
- **WHEN** project creation fails due to insufficient disk space
- **THEN** the application SHALL display error "Unable to create project: insufficient disk space"
- **AND** SHALL clean up any partially created files

#### Scenario: Invalid file path errors
- **WHEN** user provides a file path that doesn't exist
- **THEN** the application SHALL display error "File not found: [path]"
- **AND** SHALL prevent Save button from being enabled

#### Scenario: JSON parsing errors
- **WHEN** selected file contains malformed JSON
- **THEN** the application SHALL display error "Invalid JSON format: [specific error]"
- **AND** SHALL highlight the file selection area with error styling
- **AND** SHALL clear the error when user selects a different file

### Requirement: Project List Integration
The application SHALL display created projects in a project list or sidebar for selection and management.

#### Scenario: Load projects on application start
- **WHEN** the application starts
- **THEN** the application SHALL scan the `data/projects/` directory
- **AND** SHALL read each project's `config.json` file
- **AND** SHALL display all projects in a list or sidebar
- **AND** SHALL sort projects by creation date (newest first)

#### Scenario: Add new project to list after creation
- **WHEN** user successfully creates a new project
- **THEN** the modal SHALL close
- **AND** the new project SHALL appear in the project list immediately
- **AND** the new project SHALL be automatically selected/highlighted
- **AND** no page reload or manual refresh SHALL be required

#### Scenario: Display project metadata in list
- **WHEN** projects are displayed in the list
- **THEN** each project SHALL show its name prominently
- **AND** each project SHALL show its Firebase project ID as secondary text
- **AND** projects with missing or corrupted config files SHALL show an error indicator

#### Scenario: Handle empty project list state
- **WHEN** no projects exist in `data/projects/` directory
- **THEN** the application SHALL display an empty state message "No projects yet"
- **AND** SHALL prominently display a "Create Project" button
- **AND** SHALL provide helpful text explaining the next step

