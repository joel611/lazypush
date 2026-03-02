# Implementation Tasks

## 1. Backend - Data Models and Types

- [ ] 1.1 Create Rust structs for `ServiceAccountJson` with required Firebase fields (`type`, `project_id`, `private_key`, `client_email`, etc.)
- [ ] 1.2 Create Rust struct for `ProjectConfig` matching JSON schema (id, name, projectId, clientEmail, serviceAccountPath, createdAt)
- [ ] 1.3 Create Rust struct for `ValidationResult` (valid, projectId, clientEmail, error)
- [ ] 1.4 Create Rust struct for `CreateProjectResult` (success, projectId, error)
- [ ] 1.5 Add serde derives for JSON serialization/deserialization on all structs

## 2. Backend - Service Account Validation

- [ ] 2.1 Implement `validate_json_syntax()` function to parse JSON and catch syntax errors
- [ ] 2.2 Implement `validate_service_account_structure()` function to check required fields
- [ ] 2.3 Implement `validate_service_account_type()` function to ensure `type` == "service_account"
- [ ] 2.4 Implement `extract_project_metadata()` function to extract project_id and client_email
- [ ] 2.5 Add file size validation (max 100KB) before reading file contents
- [ ] 2.6 Add comprehensive error messages for each validation failure type

## 3. Backend - File System Operations

- [ ] 3.1 Implement `create_project_directory()` function using UUID v4 for project ID
- [ ] 3.2 Implement `copy_service_account_file()` function with error handling
- [ ] 3.3 Implement `create_config_json()` function with proper formatting (2-space indent)
- [ ] 3.4 Implement `create_empty_devices_json()` function initializing to `[]`
- [ ] 3.5 Implement `create_empty_messages_json()` function initializing to `[]`
- [ ] 3.6 Implement atomic transaction logic: rollback all files if any operation fails
- [ ] 3.7 Add proper error handling for permissions, disk space, and I/O errors

## 4. Backend - Tauri Commands

- [ ] 4.1 Implement `validate_service_account` Tauri command calling validation logic
- [ ] 4.2 Implement `create_project` Tauri command orchestrating all storage operations
- [ ] 4.3 Implement `check_project_name_exists` Tauri command with case-insensitive check
- [ ] 4.4 Implement `load_all_projects` Tauri command to scan and read all project configs
- [ ] 4.5 Register all commands in Tauri's `invoke_handler` in `lib.rs`
- [ ] 4.6 Add proper error result types for all commands using `Result<T, String>`

## 5. Frontend - TypeScript Types

- [ ] 5.1 Create TypeScript interface `ServiceAccountValidation` matching Rust `ValidationResult`
- [ ] 5.2 Create TypeScript interface `ProjectConfig` matching Rust struct
- [ ] 5.3 Create TypeScript interface `CreateProjectResult` matching Rust struct
- [ ] 5.4 Create TypeScript type `ProjectFormData` for form state management
- [ ] 5.5 Export all types from a central `types/project.ts` file

## 6. Frontend - Quick Start View Component

- [ ] 6.1 Create `QuickStartView.tsx` component as the main landing page
- [ ] 6.2 Replace default `App.tsx` content to render `QuickStartView` on application start
- [ ] 6.3 Add loading state while projects are being loaded from backend
- [ ] 6.4 Implement project list display section sorted by creation date (newest first)
- [ ] 6.5 Implement empty state design with centered layout
- [ ] 6.6 Add welcome message "Welcome to FCM Push Notification Tester" for empty state
- [ ] 6.7 Add descriptive text "Get started by creating your first Firebase project" for empty state
- [ ] 6.8 Add large, prominent "Create Project" button in empty state
- [ ] 6.9 Add "Create Project" button in header/fixed position when projects exist
- [ ] 6.10 Add optional illustration or icon for empty state using shadcn/ui icons
- [ ] 6.11 Implement error handling UI for project loading failures
- [ ] 6.12 Ensure view renders within 1 second performance target

## 7. Frontend - Project Creation Modal Component

- [ ] 7.1 Create `CreateProjectModal.tsx` component with modal wrapper using shadcn/ui Dialog
- [ ] 7.2 Add file selection area with click-to-browse functionality
- [ ] 7.3 Add drag-and-drop handlers for file selection area
- [ ] 7.4 Add visual drop indicator styling for drag-over state
- [ ] 7.5 Implement file type filter (`.json` only)
- [ ] 7.6 Add project name input field with auto-population logic
- [ ] 7.7 Add read-only project metadata display section
- [ ] 7.8 Add Save and Cancel button handlers
- [ ] 7.9 Implement loading states during validation and save operations
- [ ] 7.10 Add error message display with proper styling

## 8. Frontend - Validation Logic Integration

- [ ] 8.1 Call `validate_service_account` Tauri command on file selection
- [ ] 8.2 Display real-time validation feedback in UI
- [ ] 8.3 Update form state based on validation results (enable/disable Save button)
- [ ] 8.4 Auto-populate project name and metadata fields from validation result
- [ ] 8.5 Call `check_project_name_exists` Tauri command on project name blur/change
- [ ] 8.6 Display duplicate name error message when detected
- [ ] 8.7 Clear error messages when user corrects issues

## 9. Frontend - Project Creation Flow

- [ ] 9.1 Call `create_project` Tauri command when Save button clicked
- [ ] 9.2 Show loading spinner during project creation
- [ ] 9.3 Handle success: close modal and update project list
- [ ] 9.4 Handle errors: display error message and keep modal open
- [ ] 9.5 Reset form state after successful creation or cancel

## 10. Frontend - Project List Component (Integrated in Quick Start View)

- [ ] 10.1 Create `ProjectListItem.tsx` component for individual project display
- [ ] 10.2 Display project name prominently and Firebase project ID as secondary text
- [ ] 10.3 Add click handler to select project (store in state for future features)
- [ ] 10.4 Add error indicator styling for corrupted project configs
- [ ] 10.5 Add highlight/selected state styling for newly created projects
- [ ] 10.6 Implement responsive grid or list layout

## 11. Frontend - State Management

- [ ] 11.1 Create React state or context for managing projects list
- [ ] 11.2 Implement add project action to update list after creation
- [ ] 11.3 Implement project selection state (for future features)
- [ ] 11.4 Ensure no page reload required after project creation
- [ ] 11.5 Implement modal open/close state management

## 12. Testing and Validation

- [ ] 12.1 Test Quick Start view renders on application launch
- [ ] 12.2 Test Quick Start view with empty state (no projects)
- [ ] 12.3 Test Quick Start view with existing projects
- [ ] 12.4 Test project creation with valid Firebase service account JSON
- [ ] 12.5 Test validation with invalid JSON syntax
- [ ] 12.6 Test validation with missing required fields
- [ ] 12.7 Test validation with wrong `type` field value
- [ ] 12.8 Test duplicate project name prevention
- [ ] 12.9 Test file size limit (>100KB file)
- [ ] 12.10 Test drag-and-drop file selection
- [ ] 12.11 Test click-to-browse file selection
- [ ] 12.12 Test project name editing after auto-population
- [ ] 12.13 Test cancel functionality (no data persisted)
- [ ] 12.14 Test atomic rollback on partial failure
- [ ] 12.15 Test newly created project appears in list immediately
- [ ] 12.16 Test project list sorting (newest first)
- [ ] 12.17 Verify created directory structure and file contents
- [ ] 12.18 Test error messages for all failure scenarios
- [ ] 12.19 Test Quick Start view renders within 1 second performance target

## 13. Code Quality and Documentation

- [ ] 13.1 Run `cargo fmt` on Rust code
- [ ] 13.2 Run `cargo clippy` and fix warnings
- [ ] 13.3 Run `pnpm biome format --write` on TypeScript/React code
- [ ] 13.4 Run `pnpm biome check` and fix linting issues
- [ ] 13.5 Add doc comments to public Rust functions
- [ ] 13.6 Add JSDoc comments to exported TypeScript functions/types
- [ ] 13.7 Update CLAUDE.md with any new patterns or conventions
