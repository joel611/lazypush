# notification-sending Specification

## Purpose
Enables users to send Firebase Cloud Messaging push notifications to registered test devices through an intuitive UI, providing the core testing capability of the application with real-time feedback on send success/failure.

## Requirements

### Requirement: Send Tab in Project View
The application SHALL provide a dedicated "Send" tab in the Project View where users can select devices, choose or create messages, and send push notifications via Firebase Cloud Messaging.

#### Scenario: Display Send tab
- **WHEN** user is viewing a project in Project View
- **THEN** SHALL display a "Send" tab alongside "Devices" and "Messages" tabs
- **AND** SHALL activate Send tab when clicked
- **AND** SHALL display device selection UI and message configuration UI

#### Scenario: Tab persistence
- **WHEN** user switches from Send tab to another tab and back
- **THEN** SHALL preserve selected devices and message configuration
- **AND** SHALL not reset form state unless user explicitly clears

### Requirement: Device Selection for Sending
The application SHALL allow users to select one or more registered devices to send notifications to.

#### Scenario: Display device selection list
- **WHEN** user opens the Send tab
- **THEN** SHALL load all devices for the current project from `devices.json`
- **AND** SHALL display each device with:
  - Checkbox for selection
  - Device name
  - Platform badge (iOS/Android)
  - Token preview (first 20 chars + "...")
- **AND** SHALL sort devices by creation date (newest first)
- **AND** if no devices exist, SHALL show empty state: "No devices registered. Add devices in the Devices tab."

#### Scenario: Select devices with checkboxes
- **WHEN** user checks one or more device checkboxes
- **THEN** SHALL update selection state for those devices
- **AND** SHALL enable the "Send" button only when at least one device is selected
- **AND** SHALL display count of selected devices (e.g., "3 devices selected")

#### Scenario: Select all devices shortcut
- **WHEN** user clicks "Select All" button (if provided)
- **THEN** SHALL check all device checkboxes
- **AND** when user clicks "Deselect All"
- **THEN** SHALL uncheck all device checkboxes

#### Scenario: Validate device selection before send
- **WHEN** user clicks "Send" with no devices selected
- **THEN** SHALL display validation error "Please select at least one device"
- **AND** SHALL not proceed with send operation

### Requirement: Message Selection or Creation
The application SHALL allow users to choose an existing message template or create an ad-hoc message for sending.

#### Scenario: Choose between template and ad-hoc message
- **WHEN** user is in the Send tab
- **THEN** SHALL display radio button options:
  - "Use Template" (default selected)
  - "Create Ad-Hoc Message"
- **AND** SHALL show corresponding UI based on selection

#### Scenario: Use existing template
- **WHEN** user selects "Use Template" option
- **THEN** SHALL display dropdown of all message templates from `messages.json`
- **AND** SHALL sort templates by creation date (newest first)
- **AND** if no templates exist, SHALL show "No templates available. Create one in the Messages tab or use Ad-Hoc message."
- **AND** when user selects a template from dropdown
- **THEN** SHALL load and display template preview (notification title, body, data payload summary)

#### Scenario: Create ad-hoc message
- **WHEN** user selects "Create Ad-Hoc Message" option
- **THEN** SHALL display inline message form with fields:
  - Notification title (optional)
  - Notification body (optional)
  - Notification image URL (optional)
  - Data payload JSON editor (optional)
  - Android priority (dropdown: normal/high)
  - iOS APNs priority (dropdown: 5/10)
  - iOS content-available checkbox
  - iOS mutable-content checkbox
- **AND** SHALL validate JSON syntax in data payload editor in real-time
- **AND** SHALL not save this message to `messages.json`

#### Scenario: Preview final message payload
- **WHEN** user has selected a message (template or ad-hoc)
- **THEN** SHALL display expandable "Preview" section
- **AND** when expanded, SHALL show the complete FCM JSON payload that will be sent
- **AND** SHALL format JSON with syntax highlighting and 2-space indentation

### Requirement: Send Push Notifications via FCM
The application SHALL send push notifications to selected devices using Firebase Cloud Messaging API via Node.js sidecar process.

#### Scenario: Send notification to devices
- **WHEN** user has selected devices and message, and clicks "Send" button
- **THEN** the application SHALL:
  - Disable send button and show loading state ("Sending...")
  - Extract FCM tokens from selected devices
  - Build FCM message payload from selected template or ad-hoc message
  - Invoke Rust command `send_notification(project_id, device_tokens, message_payload)`
- **AND** Rust SHALL:
  - Check if Node.js sidecar is running for this project
  - If not running, spawn sidecar process with `node fcm-sidecar.mjs`
  - Send initialization message if first use: `{ action: "init", project_id, service_account_path }`
  - Send notification message: `{ action: "send", project_id, tokens, message }`
  - Wait for response from sidecar (timeout: 30 seconds)
- **AND** Node.js sidecar SHALL:
  - Initialize Firebase Admin SDK if not already initialized for this project
  - Call `getMessaging().sendEachForMulticast({ tokens, ...message })`
  - Return FCM response with success/failure details
- **AND** when response is received
- **THEN** SHALL re-enable send button
- **AND** SHALL display send results (success/failure counts)
- **AND** SHALL log send operation to send history
- **AND** SHALL update debug panel with new entry

#### Scenario: Handle FCM multicast response
- **WHEN** FCM returns multicast response
- **THEN** the application SHALL parse response containing:
  - `successCount`: number of successful sends
  - `failureCount`: number of failed sends
  - `responses`: array of per-token results with:
    - `success`: boolean
    - `messageId`: string (if success=true)
    - `error`: object with `code` and `message` (if success=false)
- **AND** SHALL create log entry mapping each device to its result
- **AND** SHALL display summary: "Sent to 3 devices: 2 succeeded, 1 failed"

#### Scenario: Send with up to 500 tokens
- **WHEN** user selects 1-500 devices
- **THEN** SHALL send all tokens in a single `sendEachForMulticast` call
- **AND** SHALL complete successfully for all supported token counts

#### Scenario: Reject sends with more than 500 tokens
- **WHEN** user selects more than 500 devices
- **THEN** SHALL display error "FCM supports maximum 500 devices per send. Please select 500 or fewer devices."
- **AND** SHALL not proceed with send operation
- **AND** SHALL suggest batching in future (informational message)

### Requirement: Send Feedback and Error Handling
The application SHALL provide clear feedback on send success/failure and handle errors gracefully.

#### Scenario: Display send success feedback
- **WHEN** notification send completes successfully (successCount > 0)
- **THEN** SHALL display success message:
  - "Successfully sent to X devices" (if all succeeded)
  - "Sent to X devices: Y succeeded, Z failed" (if some failed)
- **AND** SHALL show green checkmark icon
- **AND** SHALL auto-dismiss after 5 seconds or allow manual dismiss

#### Scenario: Display send failure details
- **WHEN** one or more devices fail to receive notification
- **THEN** SHALL display expandable failure details section showing:
  - Device name and token (truncated)
  - FCM error code (e.g., "invalid-registration-token")
  - User-friendly error message
  - Actionable suggestion (e.g., "Remove this device or update its token")

#### Scenario: Handle sidecar process errors
- **WHEN** Node.js sidecar fails to start or crashes
- **THEN** SHALL display error modal: "Failed to start notification service: [error details]"
- **AND** SHALL offer "Retry" button to restart sidecar
- **AND** SHALL log error to debug panel
- **AND** if Node.js not found, SHALL show setup instructions

#### Scenario: Handle FCM authentication errors
- **WHEN** Firebase Admin SDK fails to authenticate (invalid service account)
- **THEN** SHALL display error: "Firebase authentication failed. Please check your service account file."
- **AND** SHALL suggest re-importing service account in project settings
- **AND** SHALL log full error to debug panel

#### Scenario: Handle network timeout
- **WHEN** sidecar does not respond within 30 seconds
- **THEN** SHALL display error: "Request timed out. Check your internet connection and try again."
- **AND** SHALL re-enable send button
- **AND** SHALL log timeout to debug panel

### Requirement: Send History Persistence
The application SHALL persist all send operations to project-specific send history file for audit and debugging.

#### Scenario: Save send to history
- **WHEN** notification send completes (success or failure)
- **THEN** the application SHALL create send history entry with:
  - `id`: UUID
  - `timestamp`: ISO 8601 timestamp
  - `projectId`: project UUID
  - `projectName`: project name (for display)
  - `message`: full FCM payload object
  - `devices`: array of device objects (id, name, token)
  - `response`: FCM response object (successCount, failureCount, per-token results)
- **AND** SHALL append entry to `data/projects/[project-id]/send-history.json`
- **AND** if file has more than 100 entries, SHALL remove oldest entries to maintain limit

#### Scenario: Load send history
- **WHEN** debug panel opens
- **THEN** SHALL read `send-history.json` for current project
- **AND** SHALL parse JSON array
- **AND** if file is missing, SHALL treat as empty array
- **AND** if JSON is malformed, SHALL log error and treat as empty

#### Scenario: Handle concurrent history writes
- **WHEN** multiple sends occur in quick succession
- **THEN** SHALL use atomic read-modify-write pattern to prevent race conditions
- **AND** SHALL handle file system errors gracefully with error messages
