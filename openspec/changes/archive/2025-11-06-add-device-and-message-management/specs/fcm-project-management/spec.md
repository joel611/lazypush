## MODIFIED Requirements

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
