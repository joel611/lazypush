# Add Device and Message Management

## Why

Users who have created Firebase projects need to manage test devices and notification payloads to actually send push notifications. Currently, after creating a project in the Quick Start view, users cannot open the project, add devices, or create message payloads. Additionally, the current project creation flow doesn't detect when a user is trying to add a Firebase project (based on `project_id` from service account JSON) that already exists in another project, which can lead to confusion and duplicate configurations.

## What Changes

- **Add dedicated Project View page**:
  - Navigate to project view when user clicks on a project from Quick Start view
  - Display project details (name, Firebase project ID, client email, creation date)
  - Show tabbed interface with "Devices" and "Messages" sections
  - Add back button to return to Quick Start view

- **Add Device Management capability**:
  - Display list of registered devices with name, platform, token (truncated), and creation date
  - Add "Add Device" button to register new test devices
  - Implement device form with fields: device name, platform (iOS/Android), FCM token, notes
  - Save devices to `devices.json` in project directory
  - Support editing and deleting devices
  - Show empty state when no devices are registered

- **Add Message Management capability**:
  - Display list of saved message templates
  - Add "Create Template" button to save reusable message payloads
  - Implement message form with:
    - Template name
    - Notification fields (title, body, image URL)
    - Data payload (key-value pairs)
    - Platform-specific settings (Android priority, iOS APNs headers)
  - Save templates to `messages.json` in project directory
  - Support editing and deleting templates
  - Show empty state when no templates exist

- **Add Quick Send functionality**:
  - Add "Quick Send" button for one-off messages without saving templates
  - Same message form as templates but doesn't save to messages.json
  - Immediate send after form submission

- **Fix duplicate Firebase project detection**:
  - Modify project creation validation to check if service account `project_id` already exists
  - Show warning modal if duplicate detected: "Firebase project '[project_id]' is already used by project '[existing_project_name]'. Creating this project will result in multiple projects using the same Firebase credentials. Do you want to continue?"
  - Provide "Cancel" and "Create Anyway" buttons
  - Log warning to help users understand the duplication

## Impact

- **Affected specs**:
  - Modifies `fcm-project-management` - adds duplicate detection scenario
  - Creates new `device-management` capability
  - Creates new `message-management` capability

- **Affected code**:
  - `src/App.tsx`: Add routing or view state management for Quick Start ↔ Project View
  - `src/components/QuickStartView.tsx`: Add click handler to open project
  - `src/components/ProjectView.tsx`: New component for dedicated project page
  - `src/components/DeviceList.tsx`: New component for device management
  - `src/components/DeviceForm.tsx`: New component for add/edit device
  - `src/components/MessageList.tsx`: New component for template management
  - `src/components/MessageForm.tsx`: New component for creating/editing templates and quick send
  - `src-tauri/src/project.rs`: Add duplicate Firebase project_id detection in validation
  - `src-tauri/src/device.rs`: New module for device CRUD operations
  - `src-tauri/src/message.rs`: New module for message template CRUD operations
  - `src/types/`: New TypeScript types for Device and Message models

- **User experience**:
  - Unlocks core functionality - users can now actually test notifications
  - Prevents confusion from duplicate Firebase projects
  - Provides organized workflow: Create Project → Add Devices → Create/Send Messages

- **Dependencies**: No new external dependencies required
