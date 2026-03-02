# Design Document: Notification Sending and Debug Logging

## Context

The application now supports project creation, device management, and message template management, but lacks the core capability to actually send push notifications via Firebase Cloud Messaging. Users need to send notifications to test devices and see detailed logs of what was sent and what responses were received.

**Background:**
- Legacy `index.mjs` shows the working Firebase Admin SDK integration pattern
- Firebase Admin SDK is Node.js-only, not available as a Rust library
- Tauri apps can spawn child processes and communicate via stdio/IPC
- FCM responses include per-token success/failure with error codes
- Users need to debug notification delivery issues (invalid tokens, malformed payloads, etc.)

**Stakeholders:**
- Backend developers testing notification delivery systems
- Mobile developers debugging push notification handling
- QA engineers validating notification features across devices

**Constraints:**
- Must use Firebase Admin SDK (official, well-maintained, complete API support)
- Must support sending to multiple devices in one call (FCM multicast up to 500 tokens)
- Must not block UI during send operations (async with progress feedback)
- Must preserve send history for debugging and audit purposes
- Desktop app must bundle Node.js or rely on system Node.js installation

## Goals / Non-Goals

**Goals:**
- Enable users to send FCM push notifications from the desktop app
- Provide clear success/failure feedback for each device
- Log all send operations with full request/response details
- Support both template-based and ad-hoc message sending
- Handle FCM errors gracefully with helpful error messages
- Persist send history for later review

**Non-Goals:**
- Scheduled/recurring notification sends (future feature)
- Rate limiting or throttling (FCM handles this)
- Notification delivery tracking beyond FCM's initial response (no webhook integration)
- Topic subscription management (separate future feature)
- A/B testing or audience segmentation

## Decisions

### Decision 1: Node.js Sidecar vs. Rust Native vs. Direct HTTP

**Chosen: Node.js sidecar process**

**Rationale:**
- Firebase Admin SDK is officially supported, actively maintained by Google
- Complete API surface coverage (vs. incomplete Rust libraries or manual HTTP)
- Matches existing `index.mjs` pattern, proven to work
- Easier to maintain (well-documented SDK vs. reverse-engineering HTTP API)
- User already confirmed preference for Node.js sidecar approach

**Implementation:**
- Tauri spawns Node.js child process running `fcm-sidecar.mjs`
- Communication via stdio (JSON-RPC-style messages)
- Sidecar initializes Firebase Admin SDK once per project
- Rust sends { action: "send", project_id, devices, message } → Node.js
- Node.js responds with FCM response → Rust parses and returns to frontend

**Alternatives considered:**
1. **Rust HTTP client to FCM API**: Requires manual JWT signing, complex OAuth2 flow, missing SDK conveniences
2. **Pure Rust FCM library**: Available libraries are incomplete, unmaintained, or missing features
3. **Embedded Node.js (via Neon)**: Too complex, heavy binary size increase

### Decision 2: Send UI as Dedicated Tab vs. Modal

**Chosen: Dedicated "Send" tab in ProjectView**

**Rationale:**
- User confirmed preference for tab-based approach
- Provides more screen space for device selection and message preview
- Consistent with existing Devices/Messages tab pattern
- Allows saving send state (selected devices) when switching tabs
- Easier to add send history view in same tab later

**Tab workflow:**
```
Send Tab:
1. Select Devices section (multi-select checkboxes)
2. Choose Message section:
   - Radio: "Use Template" (dropdown of templates)
   - Radio: "Create Ad-Hoc" (inline form)
3. Preview section (shows final JSON payload)
4. Send button
5. Results section (shows after send completes)
```

**Alternatives considered:**
1. **Modal from Messages tab**: Cramped, harder to show device list + message + preview
2. **Inline in message cards**: Too many entry points, inconsistent UX

### Decision 3: Debug Panel as Bottom Drawer vs. Tab vs. Modal

**Chosen: Bottom drawer/panel (collapsible)**

**Rationale:**
- User confirmed preference for bottom panel
- Familiar pattern (browser DevTools, IDE output panels)
- Accessible from any tab without losing current view context
- Can be kept open while working in other tabs
- Non-modal, doesn't block interaction with main UI

**Panel structure:**
```
[Toggle Debug Panel] button in footer/header
─────────────────────────────────────
| Devices | Messages | Send |
| [main content area]
─────────────────────────────────────
▲ Debug Log (30% height, resizable)
| [Send #1] 2025-01-06 10:30 AM
| → Project: My App Dev
| → Devices: 3 (2 success, 1 failed)
| → Request: { ... }
| → Response: { ... }
─────────────────────────────────────
```

**Alternatives considered:**
1. **Separate Debug tab**: Requires switching away from Send tab to see logs
2. **Modal**: Too intrusive, blocks UI, hard to reference while sending

### Decision 4: Send History Persistence

**Chosen: Store in project-specific `send-history.json`, limit to last 100 entries**

**File location**: `data/projects/[project-id]/send-history.json`

**Entry schema:**
```json
{
  "id": "uuid",
  "timestamp": "2025-01-06T10:30:00.000Z",
  "message": { /* full FCM payload */ },
  "devices": [
    { "id": "device-uuid", "token": "...", "name": "iPhone 15" }
  ],
  "response": {
    "successCount": 2,
    "failureCount": 1,
    "responses": [
      { "success": true, "messageId": "0:..." },
      { "success": false, "error": { "code": "...", "message": "..." } }
    ]
  }
}
```

**Rationale:**
- Project-scoped history (relevant logs per project)
- Limit to 100 prevents unbounded growth (each entry ~1-5KB)
- Can be cleared manually from Debug panel
- No database needed, simple JSON append/truncate
- Survives app restarts

**Trade-offs:**
- 100-entry limit may be too small for heavy testing (can increase if users request)
- No cross-project search (separate feature if needed)

### Decision 5: Sidecar Lifecycle Management

**Chosen: One persistent sidecar process per active project**

**Lifecycle:**
1. **Start**: When user first sends from a project, spawn Node.js process
2. **Keep alive**: Reuse same process for subsequent sends from same project
3. **Stop**: Kill process when user closes project view or app exits
4. **Crash recovery**: If process crashes, show error, offer to restart

**Rationale:**
- Firebase Admin SDK initialization is expensive (reads service account file, connects to Firebase)
- Reusing process improves performance for multiple sends
- Simple to implement: map of `project_id → ChildProcess`

**Alternatives considered:**
1. **One global sidecar**: Complicates multi-project support, need to reinitialize SDK per send
2. **One-shot per send**: Too slow, unnecessary overhead

### Decision 6: Error Handling Strategy

**Error categories:**
1. **Validation errors** (before send): Show in UI immediately
   - Example: No devices selected, invalid message JSON
2. **Sidecar errors** (Node.js process issues): Show error modal, offer restart
   - Example: Node.js not found, sidecar crashed
3. **FCM API errors** (from Firebase): Show in debug log with error details
   - Example: Invalid token, quota exceeded, authentication failed

**User-facing messages:**
- Avoid technical jargon ("Invalid registration token" → "Device token is invalid or expired")
- Provide actionable next steps ("Remove this device or update its token")
- Link to Firebase docs for specific error codes (future enhancement)

## Risks / Trade-offs

### Risk 1: Node.js Dependency

**Risk:** Users must have Node.js installed for app to send notifications.

**Mitigation:**
- Bundle Node.js runtime with Tauri app (increases app size ~50MB)
- Alternative: Detect system Node.js, show setup instructions if missing
- Document Node.js requirement prominently

**Trade-off:** App size vs. user convenience

### Risk 2: Sidecar Process Management Complexity

**Risk:** Managing child processes is error-prone (crashes, hangs, zombie processes).

**Mitigation:**
- Timeout on sidecar responses (30 seconds max)
- Health check ping/pong before each send
- Graceful shutdown on app exit (kill child processes)
- Detailed error logging for troubleshooting

**Trade-off:** Complexity vs. robustness

### Risk 3: Large Send History File Size

**Risk:** 100 entries × 5KB = 500KB per project, could be slow to load.

**Mitigation:**
- Lazy load history only when debug panel opens
- Implement pagination (show 20 most recent, load more on demand)
- Compress old entries (future optimization)

**Trade-off:** Memory usage vs. history depth

### Risk 4: FCM Rate Limiting

**Risk:** Sending too many notifications quickly may hit FCM rate limits.

**Mitigation:**
- Display success/failure counts clearly
- Show FCM error messages (rate limit errors have specific codes)
- Future: Add send throttling option (delay between batches)

**Trade-off:** Immediate feedback vs. respecting API limits

## Implementation Details

### Node.js Sidecar API

**Messages from Rust to Node.js:**
```json
{
  "action": "init",
  "project_id": "uuid",
  "service_account_path": "/path/to/service-account.json"
}
```

```json
{
  "action": "send",
  "project_id": "uuid",
  "tokens": ["token1", "token2", ...],
  "message": { /* FCM message payload */ }
}
```

```json
{
  "action": "shutdown"
}
```

**Responses from Node.js to Rust:**
```json
{
  "success": true,
  "data": {
    "successCount": 2,
    "failureCount": 0,
    "responses": [...]
  }
}
```

```json
{
  "success": false,
  "error": "Failed to initialize Firebase: ..."
}
```

### Send Flow

1. User selects devices + message in Send tab
2. User clicks "Send" button
3. Frontend calls Rust command `send_notification(project_id, device_ids, message)`
4. Rust:
   - Loads device tokens from `devices.json`
   - Checks if sidecar is running for this project, starts if needed
   - Sends message to sidecar via stdin
   - Waits for response from sidecar via stdout (with timeout)
5. Sidecar:
   - Receives message
   - Calls `getMessaging().sendEachForMulticast({ tokens, ...message })`
   - Returns FCM response
6. Rust:
   - Parses response
   - Saves to `send-history.json`
   - Returns result to frontend
7. Frontend:
   - Shows success/failure notification
   - Updates debug panel with new log entry

## Open Questions

1. **Should we validate message payloads before sending?**
   - Current decision: Basic validation (required fields), rely on FCM API for full validation
   - Risk: May send invalid payloads, waste API quota
   - Alternative: Use JSON schema validation in frontend

2. **How to handle very large device lists (>500)?**
   - Current decision: Show error "FCM supports max 500 tokens per send"
   - Future: Auto-batch into multiple sends of 500

3. **Should send history be exportable?**
   - Current decision: No export initially
   - Future: Add "Export as JSON/CSV" button in debug panel

4. **Should we support topic-based sending?**
   - Current decision: No, device tokens only
   - Future feature: Topic management and sending

5. **How to handle service account credential refresh?**
   - Current decision: Firebase Admin SDK handles this automatically
   - Monitor for auth errors, show in debug log if they occur
