# message-management Specification

## Purpose
TBD - created by archiving change add-device-and-message-management. Update Purpose after archive.
## Requirements
### Requirement: Message Template List Display
The application SHALL display all saved message templates for the selected project in a list view.

#### Scenario: Display message templates list
- **WHEN** user switches to the Messages tab in Project View
- **THEN** the application SHALL load templates from `data/projects/[project-id]/messages.json`
- **AND** SHALL display each template with its name, notification title, and creation date
- **AND** SHALL sort templates by creation date (newest first)
- **AND** SHALL show "Create Template" and "Quick Send" buttons above the list

#### Scenario: Display empty templates state
- **WHEN** user views Messages tab and no templates exist in `messages.json`
- **THEN** SHALL display an empty state message "No message templates"
- **AND** SHALL show descriptive text "Create reusable templates or use Quick Send for one-time messages"
- **AND** SHALL show prominent "Create Template" and "Quick Send" buttons

#### Scenario: Show template preview
- **WHEN** displaying a template in the list
- **THEN** SHALL show template name prominently
- **AND** SHALL show notification title as secondary text
- **AND** MAY show notification body preview (truncated if long)
- **AND** SHALL show creation date

### Requirement: Create Message Template
The application SHALL allow users to create reusable message templates with full FCM payload support.

#### Scenario: Open create template form
- **WHEN** user clicks "Create Template" button
- **THEN** a modal dialog or dedicated view SHALL appear with a message form
- **AND** SHALL contain sections for:
  - Template name (required)
  - Notification fields (title, body, image URL)
  - Data payload (key-value pairs)
  - Android settings (priority)
  - iOS/APNs settings (priority, content-available, mutable-content)
- **AND** SHALL display "Save Template" and "Cancel" buttons

#### Scenario: Notification section fields
- **WHEN** user is creating or editing a template
- **THEN** the Notification section SHALL contain:
  - "Title" text input (optional)
  - "Body" textarea (optional)
  - "Image URL" text input (optional, with URL validation)
- **AND** SHALL allow all fields to be empty (for data-only messages)

#### Scenario: Data payload key-value editor
- **WHEN** user is in the Data Payload section
- **THEN** SHALL display a list of key-value pairs
- **AND** SHALL provide "Add Field" button to add new key-value pairs
- **AND** each pair SHALL have:
  - Key input (text field)
  - Value input (text field)
  - Delete button to remove the pair
- **AND** SHALL allow empty data payload (no key-value pairs)
- **AND** SHALL validate that keys are unique within the data object

#### Scenario: Android settings section
- **WHEN** user is in the Android Settings section
- **THEN** SHALL provide a "Priority" dropdown with options:
  - "normal" (default)
  - "high"
- **AND** SHALL default to "high" if not specified

#### Scenario: iOS APNs settings section
- **WHEN** user is in the iOS Settings section
- **THEN** SHALL provide:
  - "APNs Priority" dropdown with options: "5" (normal), "10" (high)
  - "Content Available" checkbox (for background delivery)
  - "Mutable Content" checkbox (for notification extensions)
- **AND** SHALL default to priority "10", content-available enabled, mutable-content enabled

#### Scenario: Save message template
- **WHEN** user fills in template name and clicks "Save Template"
- **THEN** the application SHALL validate that template name is not empty
- **AND** SHALL generate a UUID for the template ID
- **AND** SHALL create a template object with fields:
  - `id`: UUID
  - `name`: template name
  - `notification`: object with title, body, imageUrl (omit null/empty fields)
  - `data`: object with user-defined key-value pairs (omit if empty)
  - `android`: object with priority (omit if default)
  - `apns`: object with headers and payload (omit if default)
  - `createdAt`: ISO 8601 timestamp
- **AND** SHALL append the template to the `messages.json` array
- **AND** SHALL write the updated array to `data/projects/[project-id]/messages.json`
- **AND** SHALL close the form
- **AND** SHALL update the templates list to show the new template
- **AND** if save fails, SHALL display error message with reason

#### Scenario: Validate template name is required
- **WHEN** user attempts to save a template with empty name
- **THEN** SHALL display validation error "Template name is required"
- **AND** SHALL prevent saving until name is provided

#### Scenario: Validate image URL format
- **WHEN** user enters an image URL
- **THEN** SHALL validate that the URL starts with "http://" or "https://"
- **AND** if invalid, SHALL display warning "Image URL should start with http:// or https://"
- **AND** MAY allow saving anyway (warning, not blocking error)

### Requirement: Edit Message Template
The application SHALL allow users to modify existing message templates.

#### Scenario: Open edit template form
- **WHEN** user clicks "Edit" button on a template in the list
- **THEN** a modal dialog or view SHALL appear with the message form
- **AND** SHALL pre-fill all fields with the template's current values
- **AND** SHALL populate data payload key-value pairs
- **AND** SHALL set platform settings to saved values
- **AND** SHALL display "Save Template" and "Cancel" buttons

#### Scenario: Save template changes
- **WHEN** user modifies fields and clicks "Save Template"
- **THEN** the application SHALL validate required fields (template name)
- **AND** SHALL update the template object in the `messages.json` array
- **AND** SHALL preserve the original `id` and `createdAt` fields
- **AND** SHALL write the updated array to file
- **AND** SHALL close the form
- **AND** SHALL refresh the templates list to show updated values
- **AND** if save fails, SHALL display error message

### Requirement: Delete Message Template
The application SHALL allow users to remove message templates from the project.

#### Scenario: Delete template with confirmation
- **WHEN** user clicks "Delete" button on a template
- **THEN** a confirmation dialog SHALL appear asking "Delete template '[template_name]'? This action cannot be undone."
- **AND** SHALL provide "Delete" and "Cancel" buttons

#### Scenario: Confirm template deletion
- **WHEN** user clicks "Delete" in the confirmation dialog
- **THEN** the application SHALL remove the template from the `messages.json` array
- **AND** SHALL write the updated array to file
- **AND** SHALL close the confirmation dialog
- **AND** SHALL update the templates list to remove the deleted template
- **AND** if deletion fails, SHALL display error message

#### Scenario: Cancel template deletion
- **WHEN** user clicks "Cancel" in the confirmation dialog
- **THEN** the dialog SHALL close without deleting
- **AND** the template SHALL remain in the list

### Requirement: Quick Send Message
The application SHALL allow users to compose and send one-time messages without saving them as templates.

#### Scenario: Open Quick Send form
- **WHEN** user clicks "Quick Send" button
- **THEN** a modal dialog or view SHALL appear with the message form
- **AND** SHALL contain the same sections as template creation (Notification, Data, Android, iOS)
- **AND** SHALL NOT show "Template Name" field
- **AND** SHALL display "Send Now" and "Cancel" buttons instead of "Save Template"

#### Scenario: Quick Send form behavior
- **WHEN** user is composing a Quick Send message
- **THEN** SHALL allow all the same fields as template creation
- **AND** SHALL NOT require any fields (user can send data-only, notification-only, or combined)
- **AND** SHALL validate image URLs if provided
- **AND** SHALL NOT save the message to `messages.json`

#### Scenario: Quick Send preparation (no actual send)
- **WHEN** user clicks "Send Now" in Quick Send form
- **THEN** the application SHALL validate the message payload
- **AND** SHALL prepare the FCM message object
- **AND** for this spec, SHALL display success message "Message prepared for sending"
- **AND** SHALL close the Quick Send form
- **COMMENT**: Actual sending to FCM will be implemented in a separate feature

### Requirement: Message Data Persistence
The application SHALL persist message template data in the project's `messages.json` file using auto-save pattern.

#### Scenario: Message template JSON format
- **WHEN** templates are saved to `messages.json`
- **THEN** each template SHALL be stored as a JSON object with fields:
  - `id`: UUID string
  - `name`: template name
  - `notification`: optional object with `title`, `body`, `imageUrl` (omit if all empty)
  - `data`: optional object with user-defined key-value pairs (omit if empty)
  - `android`: optional object with `priority` field (omit if default)
  - `apns`: optional object with `headers` and `payload` (omit if default)
  - `createdAt`: ISO 8601 timestamp string
- **AND** the file SHALL be formatted with 2-space indentation
- **AND** empty/null fields SHALL be omitted to keep JSON compact

#### Scenario: Load templates on tab open
- **WHEN** user opens the Messages tab
- **THEN** SHALL read `data/projects/[project-id]/messages.json`
- **AND** SHALL parse the JSON array
- **AND** if file is missing or empty, SHALL treat as empty array
- **AND** if JSON is malformed, SHALL display error and treat as empty array

#### Scenario: Handle concurrent template modifications
- **WHEN** saving a template (create, edit, or delete)
- **THEN** SHALL read current `messages.json`, apply changes, and write atomically
- **AND** SHALL handle file system errors gracefully with error messages

### Requirement: FCM Message Payload Structure
The application SHALL structure message payloads according to Firebase Cloud Messaging API specifications.

#### Scenario: Notification payload structure
- **WHEN** creating a message with notification fields
- **THEN** SHALL structure as:
```json
{
  "notification": {
    "title": "string",
    "body": "string",
    "imageUrl": "string"
  }
}
```
- **AND** SHALL omit the entire `notification` object if all fields are empty

#### Scenario: Data payload structure
- **WHEN** creating a message with data fields
- **THEN** SHALL structure as:
```json
{
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```
- **AND** all keys and values SHALL be strings
- **AND** SHALL omit the `data` object if no key-value pairs exist

#### Scenario: Android configuration structure
- **WHEN** creating a message with Android settings
- **THEN** SHALL structure as:
```json
{
  "android": {
    "priority": "high" | "normal"
  }
}
```
- **AND** SHALL omit `android` object if priority is default

#### Scenario: iOS APNs configuration structure
- **WHEN** creating a message with iOS settings
- **THEN** SHALL structure as:
```json
{
  "apns": {
    "headers": {
      "apns-priority": "5" | "10"
    },
    "payload": {
      "aps": {
        "contentAvailable": 0 | 1,
        "mutableContent": 0 | 1
      }
    }
  }
}
```
- **AND** SHALL omit `apns` object if all values are default
- **AND** `contentAvailable` and `mutableContent` SHALL be numbers (0 or 1), not booleans

