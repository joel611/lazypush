## ADDED Requirements

### Requirement: Project View Navigation
The application SHALL provide a dedicated Project View page that users can navigate to from the Quick Start view to manage project-specific devices and messages.

#### Scenario: Navigate to Project View from Quick Start
- **WHEN** user clicks on a project card in the Quick Start view
- **THEN** the application SHALL navigate to the Project View page
- **AND** SHALL display the selected project's name prominently in the header
- **AND** SHALL provide a "Back" or "Back to Projects" button to return to Quick Start
- **AND** SHALL load and display the project's devices and message templates

#### Scenario: Return to Quick Start from Project View
- **WHEN** user clicks the "Back to Projects" button in Project View
- **THEN** the application SHALL navigate back to the Quick Start view
- **AND** SHALL restore the Quick Start view state without reloading projects

#### Scenario: Project View initial state
- **WHEN** Project View loads for a project
- **THEN** SHALL display tabbed interface with "Devices" and "Messages" tabs
- **AND** SHALL show "Devices" tab selected by default
- **AND** SHALL display project metadata (name, Firebase project ID, client email, creation date)

### Requirement: Device List Display
The application SHALL display all registered test devices for the selected project in a list view.

#### Scenario: Display devices list
- **WHEN** user is viewing the Devices tab in Project View
- **THEN** the application SHALL load devices from `data/projects/[project-id]/devices.json`
- **AND** SHALL display each device with its name, platform, truncated token, and creation date
- **AND** SHALL sort devices by creation date (newest first)
- **AND** SHALL show an "Add Device" button above the list

#### Scenario: Display empty devices state
- **WHEN** user views Devices tab and no devices exist in `devices.json`
- **THEN** SHALL display an empty state message "No devices registered"
- **AND** SHALL show descriptive text "Add your first test device to start sending notifications"
- **AND** SHALL show a prominent "Add Device" button

#### Scenario: Truncate long device tokens
- **WHEN** displaying device token in the list
- **THEN** SHALL truncate the token to show first 20 characters followed by "..."
- **AND** SHALL provide a way to view or copy the full token (tooltip or copy button)

### Requirement: Add Device
The application SHALL allow users to register new test devices by providing device information and FCM token.

#### Scenario: Open add device form
- **WHEN** user clicks "Add Device" button
- **THEN** a modal dialog SHALL appear with a device form
- **AND** SHALL contain input fields for:
  - Device name (required text field)
  - Platform (required dropdown: iOS or Android)
  - FCM token (required textarea)
  - Notes (optional textarea)
- **AND** SHALL contain "Save" and "Cancel" buttons

#### Scenario: Save new device
- **WHEN** user fills in all required fields and clicks "Save"
- **THEN** the application SHALL validate that device name and FCM token are not empty
- **AND** SHALL generate a UUID for the device ID
- **AND** SHALL create a device object with fields: id, name, platform, token, notes, createdAt
- **AND** SHALL append the device to the `devices.json` array
- **AND** SHALL write the updated array to `data/projects/[project-id]/devices.json`
- **AND** SHALL close the modal
- **AND** SHALL update the devices list to show the new device
- **AND** if save fails, SHALL display error message with reason

#### Scenario: Cancel add device
- **WHEN** user clicks "Cancel" or closes the modal
- **THEN** the modal SHALL close without saving
- **AND** all form data SHALL be discarded

#### Scenario: Validate device name is not empty
- **WHEN** user attempts to save a device with empty name
- **THEN** SHALL display validation error "Device name is required"
- **AND** SHALL prevent saving until name is provided

#### Scenario: Validate FCM token is not empty
- **WHEN** user attempts to save a device with empty token
- **THEN** SHALL display validation error "FCM token is required"
- **AND** SHALL prevent saving until token is provided

### Requirement: Edit Device
The application SHALL allow users to modify existing device information.

#### Scenario: Open edit device form
- **WHEN** user clicks "Edit" button on a device in the list
- **THEN** a modal dialog SHALL appear with the device form
- **AND** SHALL pre-fill all fields with the device's current values
- **AND** SHALL display "Save" and "Cancel" buttons

#### Scenario: Save device changes
- **WHEN** user modifies fields and clicks "Save"
- **THEN** the application SHALL validate required fields (name, token)
- **AND** SHALL update the device object in the `devices.json` array
- **AND** SHALL write the updated array to file
- **AND** SHALL close the modal
- **AND** SHALL refresh the devices list to show updated values
- **AND** if save fails, SHALL display error message

### Requirement: Delete Device
The application SHALL allow users to remove devices from the project.

#### Scenario: Delete device with confirmation
- **WHEN** user clicks "Delete" button on a device
- **THEN** a confirmation dialog SHALL appear asking "Delete device '[device_name]'? This action cannot be undone."
- **AND** SHALL provide "Delete" and "Cancel" buttons

#### Scenario: Confirm device deletion
- **WHEN** user clicks "Delete" in the confirmation dialog
- **THEN** the application SHALL remove the device from the `devices.json` array
- **AND** SHALL write the updated array to file
- **AND** SHALL close the confirmation dialog
- **AND** SHALL update the devices list to remove the deleted device
- **AND** if deletion fails, SHALL display error message

#### Scenario: Cancel device deletion
- **WHEN** user clicks "Cancel" in the confirmation dialog
- **THEN** the dialog SHALL close without deleting
- **AND** the device SHALL remain in the list

### Requirement: Device Data Persistence
The application SHALL persist device data in the project's `devices.json` file using auto-save pattern.

#### Scenario: Device JSON format
- **WHEN** devices are saved to `devices.json`
- **THEN** each device SHALL be stored as a JSON object with fields:
  - `id`: UUID string
  - `name`: user-provided device name
  - `platform`: "iOS" or "Android"
  - `token`: full FCM device token
  - `notes`: optional notes string (empty string if not provided)
  - `createdAt`: ISO 8601 timestamp string
- **AND** the file SHALL be formatted with 2-space indentation

#### Scenario: Load devices on tab open
- **WHEN** user opens the Devices tab
- **THEN** SHALL read `data/projects/[project-id]/devices.json`
- **AND** SHALL parse the JSON array
- **AND** if file is missing or empty, SHALL treat as empty array
- **AND** if JSON is malformed, SHALL display error and treat as empty array

#### Scenario: Handle concurrent device modifications
- **WHEN** saving a device (add, edit, or delete)
- **THEN** SHALL read current `devices.json`, apply changes, and write atomically
- **AND** SHALL handle file system errors gracefully with error messages
