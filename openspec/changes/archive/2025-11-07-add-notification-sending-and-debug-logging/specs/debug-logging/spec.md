## ADDED Requirements

### Requirement: Debug Panel Toggle
The application SHALL provide a collapsible debug panel at the bottom of the window that can be toggled open/closed.

#### Scenario: Display debug panel toggle button
- **WHEN** application is running
- **THEN** SHALL display a "Debug" toggle button in the application footer or toolbar
- **AND** button SHALL show open/close icon indicating current panel state
- **AND** button SHALL be accessible from any view (Quick Start, Project View)

#### Scenario: Toggle debug panel open
- **WHEN** user clicks debug toggle button while panel is closed
- **THEN** SHALL slide debug panel up from bottom of window
- **AND** SHALL occupy 30% of window height (or user's last saved size)
- **AND** SHALL push main content area up to accommodate panel
- **AND** SHALL update toggle button to show "close" icon
- **AND** SHALL preserve panel open state across tab switches within Project View

#### Scenario: Toggle debug panel closed
- **WHEN** user clicks debug toggle button while panel is open
- **THEN** SHALL slide debug panel down and hide it
- **AND** SHALL restore main content area to full height
- **AND** SHALL update toggle button to show "open" icon
- **AND** SHALL remember panel state when user re-opens

#### Scenario: Resize debug panel
- **WHEN** user drags the top edge of debug panel
- **THEN** SHALL allow resizing between 20% and 60% of window height
- **AND** SHALL save user's preferred size to local storage
- **AND** SHALL restore saved size when panel is reopened

### Requirement: Send Log Display
The debug panel SHALL display a chronological list of all notification send operations with request/response details.

#### Scenario: Display send log entries
- **WHEN** debug panel is open
- **THEN** SHALL load send history from `send-history.json` for current project
- **AND** SHALL display entries in reverse chronological order (newest first)
- **AND** each entry SHALL show:
  - Timestamp (formatted: "Jan 6, 2025 10:30 AM")
  - Project name
  - Device count and success/failure summary
  - Expandable arrow to show details
- **AND** if no history exists, SHALL show empty state: "No sends recorded yet"

#### Scenario: Expand log entry details
- **WHEN** user clicks on a log entry or expand arrow
- **THEN** SHALL expand entry to show detailed information:
  - **Request Payload** section:
    - Full JSON payload sent to FCM
    - Syntax-highlighted and formatted with 2-space indentation
  - **Devices Targeted** section:
    - List of device names and tokens
  - **Response** section:
    - Success count / failure count
    - Per-device results table with columns:
      - Device name
      - Token (truncated)
      - Status (Success ✓ or Failed ✗)
      - Message ID (if successful) or Error code/message (if failed)
  - **Raw FCM Response** section (collapsible):
    - Complete response object from Firebase Admin SDK
- **AND** when user clicks entry again, SHALL collapse details

#### Scenario: Auto-scroll to latest entry
- **WHEN** a new notification send completes
- **THEN** SHALL add new log entry to top of list
- **AND** if debug panel is open, SHALL auto-scroll to show new entry
- **AND** SHALL highlight new entry briefly (2 seconds) with background color

#### Scenario: Paginate long history
- **WHEN** send history has more than 20 entries
- **THEN** SHALL display first 20 entries by default
- **AND** SHALL show "Load More" button at bottom
- **AND** when clicked, SHALL load and display next 20 entries
- **AND** SHALL continue until all entries are loaded

### Requirement: Debug Log Filtering and Search
The application SHALL allow users to filter and search log entries to find specific sends.

#### Scenario: Filter by status
- **WHEN** user selects filter dropdown in debug panel
- **THEN** SHALL provide options:
  - "All" (default)
  - "Successful only" (successCount > 0, failureCount = 0)
  - "Failed only" (failureCount > 0)
  - "Partial failures" (successCount > 0 AND failureCount > 0)
- **AND** when user selects filter, SHALL update log list to show only matching entries

#### Scenario: Search log entries
- **WHEN** user types in search box in debug panel
- **THEN** SHALL filter log entries in real-time to match search query
- **AND** SHALL search across:
  - Device names
  - Device tokens
  - Message payload content (notification title/body)
  - Error messages
- **AND** SHALL highlight matched text in search results
- **AND** if no matches, SHALL show "No entries match your search"

#### Scenario: Clear search/filter
- **WHEN** user clicks "Clear" button or deletes search text
- **THEN** SHALL reset filters to "All"
- **AND** SHALL show complete unfiltered log list

### Requirement: Debug Log Management
The application SHALL provide controls to manage and clear send history.

#### Scenario: Clear entire log
- **WHEN** user clicks "Clear Log" button in debug panel
- **THEN** SHALL display confirmation dialog: "Delete all send history? This cannot be undone."
- **AND** when user confirms
- **THEN** SHALL delete all entries from `send-history.json`
- **AND** SHALL clear log display
- **AND** SHALL show empty state message

#### Scenario: Delete individual log entry
- **WHEN** user clicks delete icon on a log entry
- **THEN** SHALL display confirmation dialog: "Delete this send record?"
- **AND** when user confirms
- **THEN** SHALL remove entry from `send-history.json`
- **AND** SHALL remove entry from display
- **AND** SHALL update entry count

#### Scenario: Export log history
- **WHEN** user clicks "Export" button in debug panel (future feature)
- **THEN** SHALL open save dialog to export history as:
  - JSON file (complete data)
  - CSV file (summary data: timestamp, devices, success/fail counts)
- **AND** SHALL save file to user-selected location
- **AND** SHALL show success notification when export completes

### Requirement: Real-Time Log Updates
The debug panel SHALL update in real-time as new sends occur without requiring manual refresh.

#### Scenario: Update log during send
- **WHEN** user initiates a send from Send tab
- **THEN** if debug panel is open, SHALL show "Sending..." indicator in panel
- **AND** when send completes, SHALL immediately add new entry to top of log
- **AND** SHALL auto-scroll to new entry if panel is scrolled near top

#### Scenario: Show send progress in debug panel
- **WHEN** send is in progress
- **THEN** debug panel MAY show real-time progress:
  - "Initializing Firebase Admin SDK..."
  - "Sending to 3 devices..."
  - "Waiting for FCM response..."
- **AND** when complete, SHALL replace progress with final log entry

#### Scenario: Handle send errors in debug panel
- **WHEN** send fails due to error (sidecar crash, network timeout, etc.)
- **THEN** SHALL add log entry marked as "Error"
- **AND** SHALL display error details in red/warning color
- **AND** SHALL include error message and stack trace if available

### Requirement: Debug Panel Context Awareness
The debug panel SHALL show logs relevant to the current project context.

#### Scenario: Show project-specific logs in Project View
- **WHEN** user is viewing a specific project in Project View
- **THEN** debug panel SHALL load and display send history for that project only
- **AND** SHALL show project name in panel header
- **AND** when user switches to different project, SHALL reload history for new project

#### Scenario: Show all logs in Quick Start view
- **WHEN** user is in Quick Start view (no specific project selected)
- **THEN** debug panel SHALL display combined send history from all projects
- **AND** SHALL label each entry with its project name for clarity
- **AND** SHALL sort by timestamp across all projects

#### Scenario: Empty debug panel in Quick Start with no history
- **WHEN** user opens debug panel in Quick Start view and no projects have send history
- **THEN** SHALL show empty state: "No notification sends recorded. Send notifications from a project to see logs here."
