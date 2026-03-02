# Design Document: Device and Message Management

## Context

With project creation now functional, users need the ability to manage test devices and message payloads to complete the core workflow of testing FCM notifications. The current application ends at project creation, providing no way to register devices or compose notification payloads.

**Background:**
- Projects are stored in `data/projects/[uuid]/` with `config.json`, `devices.json`, and `messages.json`
- `devices.json` and `messages.json` are currently empty arrays `[]`
- The legacy `index.mjs` script shows the expected notification payload structure
- Users currently cannot navigate beyond the Quick Start view after creating projects

**Stakeholders:**
- Backend developers who need to test notification delivery to specific devices
- Mobile developers who need to verify notification handling across different payload structures
- QA engineers who need repeatable test scenarios with saved templates

**Constraints:**
- Must support both iOS and Android device tokens
- Must handle platform-specific FCM configurations (APNs vs Android)
- Must maintain file-based storage pattern (no database)
- Must support auto-save for all changes

## Goals / Non-Goals

**Goals:**
- Enable users to register and manage test devices with FCM tokens
- Enable users to create reusable message templates with full FCM payload support
- Enable users to send quick one-off messages without saving templates
- Prevent confusion from duplicate Firebase projects by warning users
- Provide organized project-centric workflow with navigation
- Support all common FCM notification scenarios (text, rich, data-only, etc.)

**Non-Goals:**
- Sending notifications (separate future feature - requires Firebase Admin SDK integration)
- Automatic device discovery or token extraction
- Cloud sync of devices or templates
- Device grouping or bulk operations (can add later if needed)
- Topic subscription management (future feature)
- Notification history or delivery tracking (future feature)

## Decisions

### Decision 1: Dedicated Project View vs. Split-Pane

**Chosen: Dedicated full-screen Project View page**

**Rationale:**
- User confirmed preference for dedicated page
- More screen real estate for complex forms (message payloads can be large)
- Clearer mental model: Quick Start = project selection, Project View = project management
- Easier to implement without complex layout constraints
- Simpler navigation flow for desktop app

**Navigation:**
```
Quick Start View
    ↓ (click project)
Project View (with Devices & Messages tabs)
    ↓ (back button)
Quick Start View
```

**Alternatives considered:**
1. **Split-pane**: Pros - keep project list visible; Cons - cramped space for forms, complex responsive layout
2. **Modal overlay**: Pros - quick access; Cons - modal fatigue, limited space for large forms

### Decision 2: Device Data Model

**Chosen: Store name, platform, token, notes, and createdAt**

**Device schema:**
```json
{
  "id": "uuid",
  "name": "Joel's iPhone 15",
  "platform": "iOS",
  "token": "fKNfcfwwTkROt4enLHZs3f:APA91bGnTyIoEc6M...",
  "notes": "Test device for production builds",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Rationale:**
- **name**: Essential for identifying devices in list (user confirmed)
- **platform**: Needed for filtering and UI organization (user confirmed)
- **token**: Core requirement for sending notifications
- **notes**: Flexibility for additional context (user confirmed)
- **createdAt**: Helps track device registration chronology (user confirmed)
- **id**: UUID for stable identity even if token changes

**Alternatives considered:**
1. **Token-only**: Too minimal, no way to distinguish devices
2. **Additional fields** (device model, OS version): Overkill, user can put in notes if needed

### Decision 3: Message Template Model

**Chosen: Both reusable templates and quick send (user confirmed)**

**Message template schema:**
```json
{
  "id": "uuid",
  "name": "Welcome Notification",
  "notification": {
    "title": "Welcome!",
    "body": "Thanks for installing our app",
    "imageUrl": "https://example.com/image.png"
  },
  "data": {
    "navigate": "HOME",
    "userId": "123"
  },
  "android": {
    "priority": "high"
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "contentAvailable": 1,
        "mutableContent": 1
      }
    }
  },
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Rationale:**
- Templates support reusable scenarios (regression testing, common flows)
- Quick send supports ad-hoc testing without template clutter
- Matches FCM message structure from `index.mjs` legacy script
- Supports both notification and data payloads
- Supports platform-specific configurations

**Form design:**
- Template name field (shown only when saving as template, hidden for quick send)
- Notification section: title, body, imageUrl
- Data section: dynamic key-value editor (add/remove pairs)
- Android section: priority dropdown (normal/high)
- iOS section: APNs priority, content-available, mutable-content toggles
- Save Template / Send Now / Cancel buttons

### Decision 4: Duplicate Firebase Project Detection

**Chosen: Warn user with confirmation modal allowing override**

**Flow:**
1. User selects service account JSON file
2. Backend extracts `project_id` from JSON
3. Backend checks all existing projects for matching `project_id`
4. If match found:
   - Show warning modal: "Firebase project '[project_id]' is already used by project '[existing_name]'. Creating this project will result in multiple projects using the same Firebase credentials. Do you want to continue?"
   - Buttons: "Cancel" (close modal, don't create) and "Create Anyway" (proceed with creation)
5. If no match, proceed normally

**Rationale:**
- Prevents accidental duplicates while allowing intentional ones (e.g., testing different device sets with same Firebase project)
- User confirmed preference for "warn and ask to confirm"
- Balances safety with flexibility
- Helps users understand what they're doing

**Alternatives considered:**
1. **Block creation entirely**: Too restrictive, legitimate use cases for multiple projects pointing to same Firebase
2. **Info only**: Too passive, users might not notice and create duplicates unintentionally

### Decision 5: Tab-based UI for Devices vs. Messages

**Chosen: Tabbed interface in Project View**

**Rationale:**
- Clear separation of concerns (devices vs. message templates)
- Familiar pattern for users (browser tabs, IDE tabs)
- Prevents overcrowding single view with two feature sets
- Easy to add more tabs in future (e.g., "Send", "History")

**Tab structure:**
```
[Back to Projects] | [Project Name]
------------------------
[ Devices ] [ Messages ]
------------------------
[Content area with list + actions]
```

**Alternatives considered:**
1. **Separate pages**: Too much navigation depth (Quick Start → Project → Devices/Messages)
2. **Accordion sections**: Harder to see both sections at once, more scrolling

### Decision 6: Auto-save vs. Manual Save

**Chosen: Auto-save for devices and templates**

**Rationale:**
- Consistent with application philosophy from `project.md`: "Auto-save on every change"
- Desktop app users expect persistence without explicit save actions
- Reduces user friction and potential data loss
- Simpler UI (no save button to manage state for)

**Implementation:**
- Device form: Save immediately on "Add Device" button click
- Message template form: Save immediately on "Save Template" button click
- Edit operations: Save immediately on "Save" button in edit modal
- Delete operations: Immediate with confirmation dialog

## Risks / Trade-offs

### Risk 1: Large Message Payloads Causing Performance Issues

**Risk:** If users create very complex message templates with large data payloads, form rendering and JSON serialization could slow down.

**Mitigation:**
- JSON file size is typically small (1-10KB per message)
- Lazy load messages (only load when Messages tab is selected)
- No hard limit on payload size initially; monitor for user feedback
- Can add validation later if needed (e.g., max 100KB per message)

**Trade-off:** Simplicity vs. performance guardrails

### Risk 2: Duplicate Firebase Project Confusion

**Risk:** Even with warning, users might not understand implications of using same Firebase project in multiple app projects.

**Mitigation:**
- Clear warning message explaining the duplication
- Show which existing project already uses the Firebase project
- Document the use case in help/docs (future)
- Log warning to console for debugging

**Trade-off:** User freedom vs. preventing mistakes

### Risk 3: Device Token Expiration

**Risk:** FCM tokens can become invalid over time (app uninstall, token refresh), but users won't know until send fails.

**Mitigation:**
- Store tokens as-is without validation
- Future enhancement: Track send failures and mark devices as "invalid"
- Users can manually delete stale devices
- Document token lifecycle in help/docs

**Trade-off:** Immediate simplicity vs. token management complexity

### Risk 4: Complex FCM Payload Editing

**Risk:** Advanced users might need to edit raw JSON for complex payloads that don't fit the form structure.

**Mitigation:**
- Provide comprehensive form fields for common use cases
- Future enhancement: Add "Advanced JSON Editor" tab for raw editing
- Users can manually edit `messages.json` file if needed (power user escape hatch)

**Trade-off:** Form simplicity vs. advanced customization

## Migration Plan

**Data Migration:**
- Existing `devices.json` and `messages.json` files are already initialized as empty arrays
- No migration needed for existing projects
- New fields added to schemas are optional, so future migrations are additive

**Backward Compatibility:**
- Device and message features are net-new, no breaking changes to existing functionality
- Duplicate detection adds validation but doesn't break existing project creation flow

**Rollback Strategy:**
- Can remove Project View navigation and hide Devices/Messages tabs
- Data persists in JSON files, so rollback doesn't lose user data
- Re-enabling features just requires restoring UI components

## Open Questions

1. **Should device tokens be masked/truncated in the UI for security?**
   - Current decision: Show full token for easy copying, no masking
   - Consideration: Tokens are sensitive but stored locally anyway

2. **Should there be a limit on number of devices per project?**
   - Current decision: No limit
   - FCM multicast supports up to 500 tokens, but users can have more devices registered

3. **Should message templates support variables/placeholders?**
   - Current decision: No, keep it simple with static values
   - Future enhancement: Could add {{placeholders}} for dynamic values

4. **Should we validate FCM token format on device creation?**
   - Current decision: No validation, accept any string
   - FCM tokens don't have a strict regex pattern, validation would be unreliable

5. **How should we handle platform-specific fields in message form?**
   - Current decision: Show all fields (Android + iOS sections) with labels
   - Fields only apply when sending to respective platform
   - Alternative: Could hide/show based on selected devices, but adds complexity
