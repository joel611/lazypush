# Tasks: Notification Sending and Debug Logging

## Section 1: Backend - Node.js Sidecar Setup (7 tasks)

1. Create `src-tauri/package.json` with firebase-admin dependency
2. Create `src-tauri/fcm-sidecar.mjs` Node.js script skeleton
3. Implement Firebase Admin SDK initialization in sidecar (read service account, init app)
4. Implement JSON message protocol (stdin reader, stdout writer)
5. Implement `send` action handler using `sendEachForMulticast`
6. Add error handling and timeout logic in sidecar
7. Test sidecar independently with mock messages

## Section 2: Backend - Sidecar Process Management (9 tasks)

8. Create `src-tauri/src/sidecar.rs` module for process management
9. Implement `spawn_sidecar()` function to start Node.js child process
10. Implement sidecar lifecycle map (project_id -> ChildProcess)
11. Implement stdin/stdout communication helpers (send JSON, receive JSON)
12. Add health check ping/pong before sends
13. Implement 30-second timeout for sidecar responses
14. Add graceful shutdown on app exit (kill all sidecars)
15. Handle sidecar crashes (detect, log, restart)
16. Test sidecar lifecycle (start, communicate, stop)

## Section 3: Backend - Send History Persistence (6 tasks)

17. Create `src-tauri/src/send_history.rs` module
18. Define `SendHistoryEntry` struct matching JSON schema
19. Implement `load_send_history(project_id)` function
20. Implement `save_send_entry(project_id, entry)` with append logic
21. Implement entry limit enforcement (max 100 per project)
22. Test history persistence (load, save, truncate)

## Section 4: Backend - Send Notification Command (8 tasks)

23. Register `send_notification` Tauri command in `lib.rs`
24. Implement command handler:
    - Accept project_id, device_ids, message_payload
    - Load device tokens from devices.json
    - Validate device selection (1-500 tokens)
25. Check/start sidecar for project
26. Send init message to sidecar if first use
27. Send notification message to sidecar
28. Parse FCM response from sidecar
29. Save send entry to history
30. Return result to frontend with success/failure details

## Section 5: Frontend - TypeScript Types (5 tasks)

31. Create `src/types/send.ts` with SendOperation interface
32. Define SendHistoryEntry interface
33. Define FCM response types (SendResponse, TokenResult, ErrorInfo)
34. Define sidecar message types (InitMessage, SendMessage)
35. Update imports in components

## Section 6: Frontend - Send Panel Component (12 tasks)

36. Create `src/components/SendPanel.tsx` skeleton
37. Implement device selection UI:
    - Load devices from context/props
    - Render checkboxes with device cards
    - Track selected device IDs in state
38. Add "Select All" / "Deselect All" buttons
39. Display selected device count
40. Implement message selection UI:
    - Radio buttons for "Use Template" vs "Ad-Hoc"
    - Template dropdown (load from templates)
    - Ad-hoc message form (reuse MessageForm components)
41. Implement message preview section (collapsible JSON view)
42. Add "Send" button with validation
43. Implement send handler:
    - Call `invoke('send_notification', { ... })`
    - Show loading state during send
44. Display send results (success/failure counts)
45. Show error messages for validation or send failures
46. Add empty state when no devices exist
47. Test Send panel end-to-end

## Section 7: Frontend - Debug Panel Component (15 tasks)

48. Create `src/components/DebugPanel.tsx` skeleton
49. Implement collapsible drawer UI (bottom panel, slides up/down)
50. Add resize handle for panel height adjustment
51. Save/load panel state (open/closed, height) to localStorage
52. Load send history when panel opens (`load_send_history` command)
53. Implement log entry list view:
    - Render entries in reverse chronological order
    - Show timestamp, project, device count, status summary
54. Implement expand/collapse for entry details
55. Display expanded entry sections:
    - Request payload (JSON viewer)
    - Devices targeted (table)
    - Response (success/failure table)
    - Raw FCM response (collapsible)
56. Add auto-scroll to latest entry on new sends
57. Implement pagination ("Load More" for 20+ entries)
58. Add filter dropdown (All, Successful, Failed, Partial)
59. Add search box with real-time filtering
60. Implement "Clear Log" button with confirmation
61. Add empty state when no logs exist
62. Test debug panel interactions

## Section 8: Frontend - App Layout Integration (5 tasks)

63. Update `src/App.tsx` or main layout to include DebugPanel component
64. Add debug toggle button in footer/toolbar
65. Manage debug panel global state (React context or props)
66. Ensure panel persists across view navigation
67. Test debug panel visibility in Quick Start and Project View

## Section 9: Frontend - ProjectView Send Tab (6 tasks)

68. Update `src/components/ProjectView.tsx` to add "Send" tab
69. Render SendPanel component when Send tab is active
70. Pass project context (project_id, devices, messages) to SendPanel
71. Handle tab switching with state preservation
72. Update tab styling to accommodate third tab
73. Test tab navigation and Send panel display

## Section 10: Backend - Load Send History Command (3 tasks)

74. Register `load_send_history` Tauri command
75. Implement command to read and return history entries
76. Handle project_id parameter (load specific project or all projects)

## Section 11: Backend - Clear History Command (3 tasks)

77. Register `clear_send_history` Tauri command
78. Implement command to delete history entries (all or specific project)
79. Test history clearing

## Section 12: Error Handling and Edge Cases (8 tasks)

80. Handle Node.js not installed (detect, show setup instructions)
81. Handle sidecar startup failures (show error, offer retry)
82. Handle FCM authentication errors (invalid service account)
83. Handle network timeouts (30s timeout, user-friendly message)
84. Handle invalid device tokens (show in debug log with details)
85. Handle sends with >500 devices (validation error)
86. Test all error scenarios end-to-end
87. Add error recovery flows (restart sidecar, retry send)

## Section 13: UI Polish and UX (7 tasks)

88. Add send progress indicator (loading spinner, status text)
89. Style success/failure notifications with icons and colors
90. Add syntax highlighting to JSON payload viewers
91. Add copy-to-clipboard for tokens and payloads in debug panel
92. Improve empty states with helpful instructions
93. Add keyboard shortcuts (Ctrl+D to toggle debug panel)
94. Test responsive layout for debug panel at different sizes

## Section 14: Testing (10 tasks)

95. Write unit tests for sidecar message parsing
96. Write unit tests for send history persistence
97. Test send with 1 device (success scenario)
98. Test send with multiple devices (2-10, mixed success/failure)
99. Test send with 500 devices (max batch size)
100. Test send with invalid token (expect FCM error)
101. Test send with expired service account (expect auth error)
102. Test sidecar crash recovery
103. Test debug panel log filtering and search
104. Test history persistence across app restarts

## Section 15: Documentation (5 tasks)

105. Update README with Node.js requirement
106. Document send history JSON schema
107. Document sidecar message protocol
108. Add troubleshooting guide for common FCM errors
109. Update CLAUDE.md with send/debug features
