# Add Notification Sending and Debug Logging

## Why

Users have created Firebase projects, registered test devices, and created message templates, but currently cannot actually send push notifications. The core value proposition of the application—testing FCM notifications—is not yet implemented. Additionally, when notifications are sent, developers need visibility into what was sent and what responses were received to debug issues.

Without sending capability, users must:
- Manually switch back to CLI scripts (defeating the purpose of the GUI app)
- Cannot verify that their device tokens are valid
- Cannot test notification delivery in real-time
- Have no way to troubleshoot failed deliveries

Without debug logging, users:
- Cannot see why notifications failed to deliver
- Have no record of what was sent for debugging
- Cannot identify which specific devices failed
- Lack visibility into FCM API responses and error codes

## What Changes

- **Add Send Tab to ProjectView**:
  - New "Send" tab alongside "Devices" and "Messages" tabs
  - Device selection interface (checkboxes to select one or more devices)
  - Message selection: choose existing template or create ad-hoc message
  - Send button that triggers FCM API call
  - Real-time send progress indicator
  - Success/failure feedback after send completes

- **Implement Firebase Cloud Messaging Integration**:
  - Node.js sidecar process to run Firebase Admin SDK
  - Tauri-to-Node.js IPC communication via child process
  - Initialize Firebase Admin SDK with project's service account
  - Support `sendEachForMulticast` for batch sending (up to 500 tokens)
  - Handle FCM responses (success count, failure details, error codes)

- **Add Debug Panel (Bottom Drawer)**:
  - Collapsible bottom panel similar to browser DevTools
  - Toggle button in app header or footer to show/hide
  - Log entry for each send operation with:
    - Timestamp of send
    - Project name
    - Number of devices targeted
    - Full request payload (JSON sent to FCM)
    - Full response from FCM (success/failure per token)
    - Individual device results (success message ID or error reason)
  - Persistent log storage in `data/projects/[project-id]/send-history.json`
  - Clear log button to remove history
  - Auto-scroll to latest entry when new sends occur

- **Send History Persistence**:
  - Save each send operation to `send-history.json` with:
    - Unique send ID (UUID)
    - Timestamp
    - Message payload
    - Device tokens sent to
    - FCM response
    - Success/failure counts
  - Load history when Debug panel opens
  - Limit history to last 100 sends per project (configurable)

## Impact

- **Affected specs**:
  - Creates new `notification-sending` capability
  - Creates new `debug-logging` capability
  - Modifies `application-shell` - adds debug panel toggle to UI shell

- **Affected code**:
  - `src/App.tsx` or layout component: Add debug panel drawer component
  - `src/components/ProjectView.tsx`: Add "Send" tab
  - `src/components/SendPanel.tsx`: New component for Send tab UI
  - `src/components/DebugPanel.tsx`: New component for bottom debug drawer
  - `src-tauri/src/fcm.rs`: New module for Node.js sidecar management
  - `src-tauri/src/send_history.rs`: New module for send history persistence
  - `src-tauri/package.json`: New file for Node.js dependencies (firebase-admin)
  - `src-tauri/fcm-sidecar.mjs`: New Node.js script for FCM operations
  - `src/types/send.ts`: New TypeScript types for send operations and history

- **User experience**:
  - **Unlocks core functionality** - users can finally send notifications!
  - Provides immediate feedback on notification delivery success/failure
  - Enables debugging of FCM integration issues
  - Creates audit trail of all sent notifications for testing review

- **Dependencies**:
  - **New**: `firebase-admin` npm package (Node.js, for FCM SDK)
  - **New**: Tauri must spawn and manage Node.js child process
  - **Risk**: Adds Node.js runtime requirement to the desktop app
