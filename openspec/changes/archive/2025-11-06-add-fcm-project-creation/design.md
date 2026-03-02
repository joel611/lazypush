# Design Document: FCM Project Creation

## Context

This is the first major feature implementation for the FCM Push Notification Tester application. The application needs to enable users to create Firebase Cloud Messaging projects by providing their Firebase service account JSON files. This feature establishes the foundational data model and storage patterns that will be used throughout the application.

**Background:**
- Tauri v2 application with React frontend and Rust backend
- File-based storage (no database) for simplicity and portability
- Desktop application targeting developers testing push notifications
- Current state: basic Tauri shell with no project management functionality

**Stakeholders:**
- Backend developers testing FCM notifications
- Mobile app developers debugging push notification handling
- QA engineers validating notification features

**Constraints:**
- Must work offline (no cloud services)
- Must be cross-platform (Windows, macOS, Linux)
- Must handle sensitive credentials securely (service account files)
- Must maintain simplicity (file-based storage, no external databases)

## Goals / Non-Goals

**Goals:**
- Enable users to create FCM projects by uploading service account JSON files
- Validate service account files to prevent invalid configurations
- Store project data in organized, portable file structure
- Provide clear error messages for validation failures
- Auto-extract project metadata to reduce manual data entry
- Prevent duplicate project names
- Ensure atomic operations (no partial project creation)

**Non-Goals:**
- Multi-user support or project sharing
- Cloud sync or backup functionality
- Encryption of service account files (relies on OS-level file security)
- Editing existing projects (separate feature)
- Deleting projects (separate feature)
- Firebase Admin SDK initialization (will be implemented when sending notifications)

## Decisions

### Decision 1: Copy Service Account File vs. Store Path Reference

**Chosen: Copy file to app's data directory**

**Rationale:**
- Self-contained project data: All project files in one location
- Protection from external file moves/deletions by user
- Simplifies backup and export workflows (future features)
- Consistent file structure across all projects

**Alternatives considered:**
1. **Store path reference only**
   - Pros: No duplicate files, respects user's file organization
   - Cons: Breaks if user moves/deletes original file, harder to backup projects
2. **User choice (copy or reference)**
   - Pros: Maximum flexibility
   - Cons: Adds UI complexity, inconsistent project portability

### Decision 2: Modal Dialog vs. Dedicated Page for Project Creation

**Chosen: Modal Dialog**

**Rationale:**
- Faster user flow: Create project without leaving current view
- Less navigation complexity for simple form
- Consistent with desktop app patterns (quick actions in modals)
- Reduces cognitive load for single-purpose action

**Alternatives considered:**
1. **Dedicated full-page form**
   - Pros: More space for complex validation feedback
   - Cons: Requires navigation, slower workflow, overkill for simple form

### Decision 3: Two-Stage Validation (Immediate + On Save)

**Chosen: Basic validation on file selection, comprehensive validation on save**

**Rationale:**
- Immediate feedback prevents obvious errors early (invalid JSON, wrong file type)
- Deferred comprehensive validation avoids blocking file selection flow
- Balances UX speed with validation thoroughness
- Reduces perceived latency during file selection

**Validation stages:**
1. **On file selection:**
   - JSON syntax validation
   - File size check (<100KB)
   - Extract project_id and client_email for display
2. **On save:**
   - All required Firebase service account fields present
   - `type` field equals "service_account"
   - Project name uniqueness check
   - File system operations validation

### Decision 4: UUID for Project IDs

**Chosen: UUID v4 for project identifiers**

**Rationale:**
- Guarantees uniqueness without central coordination
- No collisions between projects
- URL-safe and filesystem-safe
- Standard practice for distributed systems

**Alternatives considered:**
1. **Sequential integers**
   - Cons: Requires state management, not collision-resistant
2. **Slugified project name**
   - Cons: Breaks if user renames project, conflicts on similar names

### Decision 5: Project Directory Structure

**Chosen:**
```
data/projects/[uuid]/
├── service-account.json    # Copied Firebase credentials
├── config.json             # Project metadata
├── devices.json            # Device registry (empty array initially)
└── messages.json           # Message templates (empty array initially)
```

**Rationale:**
- Isolation: Each project is self-contained in its own directory
- Predictable: Easy to backup, export, or delete entire project
- Extensible: Easy to add new files per project (logs, history, etc.)
- Portable: Can move project folder between machines

**config.json schema:**
```json
{
  "id": "uuid-string",
  "name": "User-provided name",
  "projectId": "firebase-project-id",
  "clientEmail": "service-account@project.iam.gserviceaccount.com",
  "serviceAccountPath": "service-account.json",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Decision 6: Rust Backend for File Operations

**Chosen: Implement all file I/O and validation in Rust backend**

**Rationale:**
- Security: Rust's memory safety prevents vulnerabilities in file handling
- Performance: Faster JSON parsing and file operations than JavaScript
- Native file system access: Better integration with OS-level operations
- Type safety: Strong typing prevents JSON parsing bugs
- Tauri pattern: Backend handles system operations, frontend handles UI

**Tauri command architecture:**
```
Frontend (React) → Tauri IPC → Rust Commands → File System
                              ↓
                         Validation Logic
```

**Commands:**
- `validate_service_account(path: String) -> ValidationResult`
- `create_project(name: String, serviceAccountPath: String) -> CreateProjectResult`
- `check_project_name_exists(name: String) -> bool`
- `load_all_projects() -> Vec<ProjectConfig>`

## Risks / Trade-offs

### Risk 1: Service Account File Security

**Risk:** Service account files contain sensitive credentials; storing them unencrypted in app directory exposes them to malware or unauthorized access.

**Mitigation:**
- Document in user guide that files are stored unencrypted
- Rely on OS-level file permissions (Tauri respects user's home directory permissions)
- Add to `.gitignore` to prevent accidental commits
- Future enhancement: Optional encryption with user-provided password

**Trade-off:** Simplicity and immediate usability vs. enhanced security

### Risk 2: Disk Space Consumption

**Risk:** Copying service account files duplicates data; users with many projects accumulate redundant 2-5KB files.

**Mitigation:**
- Service account files are tiny (<5KB), so duplication is negligible
- 100KB file size limit prevents accidental large file imports
- Monitor for user complaints; can add cleanup tools if needed

**Trade-off:** Disk space vs. project portability and self-containment

### Risk 3: File System Race Conditions

**Risk:** Concurrent project creation operations could corrupt data or create inconsistent state.

**Mitigation:**
- Atomic operations: Create all project files in transaction-style logic
- Rollback on failure: Delete partial project data if any operation fails
- UUID collision probability is negligible (1 in 5.3×10^36)
- Desktop app typically has single user, concurrent operations unlikely

**Trade-off:** Simplicity vs. enterprise-grade concurrency control

### Risk 4: Invalid JSON in Existing Projects

**Risk:** Users might manually edit project files and introduce invalid JSON, breaking project loading.

**Mitigation:**
- Add error handling when loading projects: skip corrupted configs, log warnings
- Show error indicator in UI for projects with corrupted configs
- Future enhancement: Config repair tool or JSON schema validation
- Document config.json format for advanced users

**Trade-off:** Flexibility for power users vs. data integrity guarantees

## Migration Plan

This is a net-new feature with no existing data to migrate. However, future changes must consider:

**Forward Compatibility:**
- `config.json` schema may evolve; plan for versioning:
  - Add `schemaVersion` field in future changes
  - Implement config migration logic when schema changes
  - Never remove required fields without migration path

**Rollback Strategy:**
- Feature can be rolled back by reverting code changes
- Existing created projects will remain in `data/projects/` directory
- Users can manually delete `data/projects/` folder to reset

**Data Loss Prevention:**
- Backup `data/` directory before major version upgrades
- Future enhancement: Export/import project functionality

## Open Questions

1. **Should we allow users to edit the copied service account file after creation?**
   - Leaning no: Prevents accidental corruption, encourages re-creating project if credentials change
   - Alternative: Add "Update Credentials" feature in future

2. **Should project names be globally unique or allow duplicates with disambiguation?**
   - Current decision: Globally unique (enforced)
   - Future consideration: Allow duplicates with "(2)", "(3)" suffixes

3. **Should we validate that the Firebase project is active and accessible during creation?**
   - Current decision: No (requires network call to Firebase APIs)
   - Future consideration: Optional "Test Connection" button

4. **What happens if user manually deletes files from project directory?**
   - Current decision: Load will fail gracefully, show error in UI
   - Future consideration: Add repair/recovery tools

5. **Should we store file paths as absolute or relative?**
   - Current decision: Relative (to project directory) for portability
   - Example: `serviceAccountPath: "service-account.json"` (not full path)
