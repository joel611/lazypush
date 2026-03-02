# Implementation Tasks

## 1. Backend - Duplicate Firebase Project Detection

- [ ] 1.1 Add `check_firebase_project_id_exists()` function in `src-tauri/src/project.rs`
- [ ] 1.2 Function should scan all `config.json` files and compare `projectId` field
- [ ] 1.3 Return existing project name if duplicate found, or None if unique
- [ ] 1.4 Add Tauri command `check_firebase_project_duplicate` wrapping the function
- [ ] 1.5 Update `validate_service_account` command to include duplicate check in response
- [ ] 1.6 Modify `ValidationResult` struct to include optional `duplicateProjectName` field

## 2. Frontend - Duplicate Project Warning

- [ ] 2.1 Update `CreateProjectModal.tsx` to handle duplicate detection from validation result
- [ ] 2.2 Create `DuplicateWarningModal` component with warning message and Cancel/Create Anyway buttons
- [ ] 2.3 Show duplicate warning modal when `duplicateProjectName` is present in validation
- [ ] 2.4 On "Cancel", close warning modal and keep create project form open
- [ ] 2.5 On "Create Anyway", proceed with project creation ignoring duplicate

## 3. Backend - Device Management Module

- [ ] 3.1 Create `src-tauri/src/device.rs` module
- [ ] 3.2 Define `Device` struct with fields: id, name, platform, token, notes, createdAt
- [ ] 3.3 Implement `load_devices(project_id: &str)` to read devices.json
- [ ] 3.4 Implement `save_devices(project_id: &str, devices: Vec<Device>)` to write devices.json
- [ ] 3.5 Implement `add_device()` function to append device to array
- [ ] 3.6 Implement `update_device()` function to modify device by ID
- [ ] 3.7 Implement `delete_device()` function to remove device by ID
- [ ] 3.8 Add error handling for file I/O and JSON parsing
- [ ] 3.9 Register Tauri commands: `load_devices`, `add_device`, `update_device`, `delete_device`

## 4. Backend - Message Management Module

- [ ] 4.1 Create `src-tauri/src/message.rs` module
- [ ] 4.2 Define `MessageTemplate` struct with fields: id, name, notification, data, android, apns, createdAt
- [ ] 4.3 Define nested structs: `Notification`, `AndroidConfig`, `ApnsConfig`, `ApnsHeaders`, `ApnsPayload`, `Aps`
- [ ] 4.4 Implement `load_messages(project_id: &str)` to read messages.json
- [ ] 4.5 Implement `save_messages(project_id: &str, messages: Vec<MessageTemplate>)` to write messages.json
- [ ] 4.6 Implement `add_message_template()` function to append template to array
- [ ] 4.7 Implement `update_message_template()` function to modify template by ID
- [ ] 4.8 Implement `delete_message_template()` function to remove template by ID
- [ ] 4.9 Add serde attributes to omit null/empty fields in JSON output
- [ ] 4.10 Register Tauri commands: `load_messages`, `add_message`, `update_message`, `delete_message`

## 5. Frontend - TypeScript Types

- [ ] 5.1 Create `src/types/device.ts` with `Device` interface matching Rust struct
- [ ] 5.2 Add `DeviceFormData` type for form state (without id and createdAt)
- [ ] 5.3 Create `src/types/message.ts` with `MessageTemplate` interface
- [ ] 5.4 Add nested interfaces: `Notification`, `DataPayload`, `AndroidConfig`, `ApnsConfig`
- [ ] 5.5 Add `MessageFormData` type for form state (without id and createdAt)
- [ ] 5.6 Export all types from both files

## 6. Frontend - Navigation and Routing

- [ ] 6.1 Add view state management in `App.tsx` (Quick Start vs Project View)
- [ ] 6.2 Add `selectedProjectId` state to track which project is open
- [ ] 6.3 Create navigation functions: `openProject(id)` and `closeProject()`
- [ ] 6.4 Pass navigation functions to QuickStartView and ProjectView as props
- [ ] 6.5 Conditionally render QuickStartView or ProjectView based on state

## 7. Frontend - QuickStartView Update

- [ ] 7.1 Update `ProjectListItem.tsx` to handle click event (not just display)
- [ ] 7.2 Add `onClick` prop to ProjectListItem component
- [ ] 7.3 Wire up click handler in QuickStartView to call `openProject(project.id)`
- [ ] 7.4 Add hover state to project cards to indicate clickability

## 8. Frontend - ProjectView Component

- [ ] 8.1 Create `src/components/ProjectView.tsx` component
- [ ] 8.2 Accept `projectId` and `onClose` props
- [ ] 8.3 Load project config on mount using `invoke('load_project', { projectId })`
- [ ] 8.4 Display project header with back button, project name, and metadata
- [ ] 8.5 Implement tabbed interface with "Devices" and "Messages" tabs
- [ ] 8.6 Add tab state management (activeTab: 'devices' | 'messages')
- [ ] 8.7 Render DeviceList when Devices tab is active
- [ ] 8.8 Render MessageList when Messages tab is active
- [ ] 8.9 Style with professional UI matching QuickStartView aesthetics

## 9. Frontend - DeviceList Component

- [ ] 9.1 Create `src/components/DeviceList.tsx` component
- [ ] 9.2 Accept `projectId` prop
- [ ] 9.3 Add state for devices array and loading/error states
- [ ] 9.4 Load devices on mount with `invoke('load_devices', { projectId })`
- [ ] 9.5 Display empty state when devices array is empty
- [ ] 9.6 Render devices in card/list layout with name, platform badge, truncated token, date
- [ ] 9.7 Add "Add Device" button that opens DeviceForm modal
- [ ] 9.8 Add "Edit" and "Delete" buttons for each device
- [ ] 9.9 Implement delete confirmation dialog
- [ ] 9.10 Refresh device list after add/edit/delete operations
- [ ] 9.11 Add copy-to-clipboard button for full device token

## 10. Frontend - DeviceForm Component

- [ ] 10.1 Create `src/components/DeviceForm.tsx` component
- [ ] 10.2 Accept props: `open`, `onClose`, `projectId`, `device` (optional for edit mode)
- [ ] 10.3 Add form state for name, platform, token, notes
- [ ] 10.4 Pre-fill form if `device` prop is provided (edit mode)
- [ ] 10.5 Add platform dropdown with iOS/Android options
- [ ] 10.6 Add validation for required fields (name, platform, token)
- [ ] 10.7 Display validation errors inline
- [ ] 10.8 On Save: call `invoke('add_device', ...)` or `invoke('update_device', ...)`
- [ ] 10.9 Handle save errors and display error messages
- [ ] 10.10 Close modal and call onClose(true) on successful save
- [ ] 10.11 Style modal with consistent UI (match CreateProjectModal)

## 11. Frontend - MessageList Component

- [ ] 11.1 Create `src/components/MessageList.tsx` component
- [ ] 11.2 Accept `projectId` prop
- [ ] 11.3 Add state for templates array and loading/error states
- [ ] 11.4 Load templates on mount with `invoke('load_messages', { projectId })`
- [ ] 11.5 Display empty state when templates array is empty
- [ ] 11.6 Render templates in card/list layout with name, notification preview, date
- [ ] 11.7 Add "Create Template" and "Quick Send" buttons
- [ ] 11.8 Add "Edit" and "Delete" buttons for each template
- [ ] 11.9 Implement delete confirmation dialog
- [ ] 11.10 Refresh templates list after create/edit/delete operations

## 12. Frontend - MessageForm Component

- [ ] 12.1 Create `src/components/MessageForm.tsx` component
- [ ] 12.2 Accept props: `open`, `onClose`, `projectId`, `template` (optional for edit), `mode` ('template' | 'quicksend')
- [ ] 12.3 Add form state for all message fields (name, notification, data, android, apns)
- [ ] 12.4 Pre-fill form if `template` prop is provided (edit mode)
- [ ] 12.5 Conditionally show template name field only when mode='template'
- [ ] 12.6 Implement Notification section with title, body, imageUrl inputs
- [ ] 12.7 Implement Data Payload section with dynamic key-value editor
- [ ] 12.8 Add "Add Field" button to add new key-value pairs
- [ ] 12.9 Add delete button for each key-value pair
- [ ] 12.10 Implement Android section with priority dropdown
- [ ] 12.11 Implement iOS section with apns-priority, content-available, mutable-content
- [ ] 12.12 Add validation for template name (if mode='template')
- [ ] 12.13 Add URL validation for imageUrl (warning, not blocking)
- [ ] 12.14 On Save Template: call `invoke('add_message', ...)` or `invoke('update_message', ...)`
- [ ] 12.15 On Quick Send: prepare payload and show success message (no actual send yet)
- [ ] 12.16 Handle save errors and display error messages
- [ ] 12.17 Close modal and call onClose(true) on successful save
- [ ] 12.18 Style form with sections, proper spacing, and consistent UI

## 13. Frontend - UI Polish

- [ ] 13.1 Add platform badge styling (iOS = blue, Android = green)
- [ ] 13.2 Add icons for devices (phone icon) and messages (mail icon)
- [ ] 13.3 Ensure all modals use consistent shadow and border radius
- [ ] 13.4 Add loading spinners for async operations (load, save, delete)
- [ ] 13.5 Add success/error toast notifications for user actions
- [ ] 13.6 Ensure responsive layout works well on different window sizes
- [ ] 13.7 Add keyboard shortcuts (Esc to close modals, Cmd+S to save forms)

## 14. Testing and Validation

- [ ] 14.1 Test project view navigation (open/close project)
- [ ] 14.2 Test add/edit/delete device operations
- [ ] 14.3 Test add/edit/delete message template operations
- [ ] 14.4 Test Quick Send message preparation
- [ ] 14.5 Test duplicate Firebase project detection and warning
- [ ] 14.6 Test empty states for devices and messages
- [ ] 14.7 Test validation errors (empty required fields)
- [ ] 14.8 Test JSON file persistence (devices.json and messages.json)
- [ ] 14.9 Test error handling (file I/O failures, malformed JSON)
- [ ] 14.10 Verify data payload key-value editor adds/removes pairs correctly
- [ ] 14.11 Verify platform-specific settings are saved correctly
- [ ] 14.12 Test with multiple projects and switching between them

## 15. Documentation

- [ ] 15.1 Update README with device and message management features
- [ ] 15.2 Document device JSON schema in CLAUDE.md
- [ ] 15.3 Document message template JSON schema in CLAUDE.md
- [ ] 15.4 Add screenshots or examples of device and message forms
- [ ] 15.5 Document duplicate Firebase project warning behavior
