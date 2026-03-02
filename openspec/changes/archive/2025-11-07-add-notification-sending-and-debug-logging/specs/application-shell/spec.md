## MODIFIED Requirements

### Requirement: Application Layout and Shell
The application SHALL provide a consistent shell layout with navigation, content area, and utility panels accessible from all views.

#### Scenario: Debug panel integration in shell
- **WHEN** application renders main layout
- **THEN** SHALL include a collapsible debug panel drawer at bottom of window
- **AND** SHALL provide debug panel toggle button in footer or toolbar
- **AND** SHALL manage debug panel state (open/closed, height) globally across views
- **AND** debug panel SHALL be accessible from Quick Start view and Project View
- **AND** SHALL preserve debug panel state when navigating between views
