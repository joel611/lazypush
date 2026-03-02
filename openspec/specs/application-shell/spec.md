# application-shell Specification

## Purpose
TBD - created by archiving change setup-tauri-base. Update Purpose after archive.
## Requirements
### Requirement: Tauri Project Structure
The application SHALL be structured as a Tauri v2.x desktop application with clear separation between frontend and backend code.

#### Scenario: Project directories exist
- **WHEN** the project is initialized
- **THEN** a `src/` directory SHALL exist containing React frontend code
- **AND** a `src-tauri/` directory SHALL exist containing Rust backend code
- **AND** a `package.json` file SHALL exist with project dependencies

#### Scenario: Development server starts
- **WHEN** developer runs `pnpm tauri dev`
- **THEN** the Tauri development window SHALL open
- **AND** hot reload SHALL be enabled for React code changes
- **AND** the window SHALL display the React application

#### Scenario: Production build succeeds
- **WHEN** developer runs `pnpm tauri build`
- **THEN** a platform-specific executable SHALL be created in `src-tauri/target/release/`
- **AND** the executable SHALL launch the application when run
- **AND** the build SHALL include all necessary dependencies

### Requirement: Package Management with pnpm
The application SHALL use pnpm as the package manager for efficient and reliable dependency management.

#### Scenario: pnpm installs dependencies
- **WHEN** developer runs `pnpm install`
- **THEN** all dependencies SHALL be installed from `package.json`
- **AND** a `pnpm-lock.yaml` lockfile SHALL be generated
- **AND** the `node_modules/` directory SHALL be created with proper symlinks

#### Scenario: pnpm lockfile ensures consistency
- **WHEN** another developer clones the repository and runs `pnpm install`
- **THEN** the exact same dependency versions SHALL be installed
- **AND** the installation SHALL use the existing `pnpm-lock.yaml`
- **AND** dependency resolution SHALL be deterministic

#### Scenario: pnpm workspace configuration exists
- **WHEN** the project is initialized
- **THEN** an `.npmrc` file SHALL exist with pnpm-specific settings
- **AND** the configuration SHALL prevent phantom dependencies
- **AND** workspace settings SHALL be properly configured

### Requirement: React Frontend Setup
The application SHALL use React 18+ with TypeScript for the frontend user interface.

#### Scenario: React application renders
- **WHEN** the application starts
- **THEN** the React root component SHALL mount successfully
- **AND** TypeScript compilation SHALL complete without errors
- **AND** the UI SHALL be interactive and responsive to user input

#### Scenario: TypeScript type checking works
- **WHEN** developer writes TypeScript code with type errors
- **THEN** the TypeScript compiler SHALL report type errors
- **AND** the development server SHALL show errors in the console
- **AND** the build SHALL fail if type errors exist

### Requirement: UI Component Library
The application SHALL use shadcn/ui components built on Radix UI and Tailwind CSS for consistent styling.

#### Scenario: shadcn/ui components are available
- **WHEN** developer imports shadcn/ui components
- **THEN** components SHALL be available in `src/components/ui/` directory
- **AND** components SHALL render with proper Tailwind CSS styles
- **AND** components SHALL be customizable without modifying node_modules

#### Scenario: Tailwind CSS utility classes work
- **WHEN** developer applies Tailwind utility classes to elements
- **THEN** the styles SHALL be applied correctly in the UI
- **AND** the production build SHALL include only used Tailwind classes
- **AND** custom Tailwind configuration SHALL be respected

#### Scenario: cn() utility combines classes
- **WHEN** developer uses `cn()` utility to combine class names
- **THEN** conditional classes SHALL be applied based on conditions
- **AND** conflicting Tailwind classes SHALL be resolved correctly
- **AND** undefined or null classes SHALL be filtered out

### Requirement: Code Quality Tooling
The application SHALL use Biome for TypeScript/JavaScript linting and formatting to maintain code quality.

#### Scenario: Biome linting detects issues
- **WHEN** developer runs `pnpm biome check src/`
- **THEN** Biome SHALL analyze all TypeScript/JavaScript files
- **AND** linting errors SHALL be reported with file locations
- **AND** the command SHALL exit with non-zero status if errors exist

#### Scenario: Biome formatting fixes style
- **WHEN** developer runs `pnpm biome format --write src/`
- **THEN** Biome SHALL format all files according to configuration
- **AND** formatting changes SHALL be written to disk
- **AND** the command SHALL report which files were modified

#### Scenario: Biome configuration is customizable
- **WHEN** developer modifies `biome.json`
- **THEN** Biome SHALL respect the custom configuration
- **AND** rules SHALL be applied consistently across the codebase
- **AND** the configuration SHALL be version-controlled

### Requirement: Minimal UI Verification
The application SHALL display a simple message on screen to verify the setup is working correctly.

#### Scenario: Welcome message displays
- **WHEN** the application launches
- **THEN** the window SHALL display "FCM Push Notification Tester" text
- **AND** the text SHALL be styled using Tailwind CSS classes
- **AND** the UI SHALL use at least one shadcn/ui component

#### Scenario: UI is responsive
- **WHEN** user resizes the application window
- **THEN** the UI SHALL adapt to the new window size
- **AND** content SHALL remain readable and accessible
- **AND** no layout breaking SHALL occur

### Requirement: Security Configuration
The application SHALL prevent sensitive Firebase credentials and user data from being committed to version control.

#### Scenario: Service account files are ignored
- **WHEN** developer places Firebase service account JSON files in the project
- **THEN** Git SHALL ignore files matching `*firebase*.json` pattern
- **AND** the files SHALL NOT appear in `git status`
- **AND** accidental commits SHALL be prevented

#### Scenario: Build artifacts are ignored
- **WHEN** developer builds the application
- **THEN** Git SHALL ignore `node_modules/`, `dist/`, and `target/` directories
- **AND** Git SHALL NOT ignore `pnpm-lock.yaml` (lockfile must be committed)
- **AND** the repository SHALL remain clean of build artifacts
- **AND** `.gitignore` SHALL be version-controlled

#### Scenario: User data directory is ignored
- **WHEN** the application creates local data files
- **THEN** Git SHALL ignore the `data/` directory
- **AND** user's project/device/message data SHALL NOT be committed
- **AND** users can safely store credentials locally

### Requirement: Rust Backend Structure
The application SHALL have a minimal Rust backend configured for future Tauri commands and Firebase SDK integration.

#### Scenario: Tauri backend compiles
- **WHEN** developer builds the Tauri application
- **THEN** the Rust code SHALL compile successfully with `cargo build`
- **AND** Tauri dependencies SHALL be resolved from `Cargo.toml`
- **AND** the executable SHALL be created in the target directory

#### Scenario: Rust formatting and linting work
- **WHEN** developer runs `cargo fmt` in `src-tauri/`
- **THEN** Rust code SHALL be formatted according to rustfmt defaults
- **AND** when developer runs `cargo clippy`
- **THEN** linting warnings SHALL be displayed for the Rust code

