# Proposal: Setup Tauri Base Project

## Why
The project currently only has a legacy CLI script (`index.mjs`) for sending FCM notifications. To build the planned desktop application with a GUI, we need to establish the Tauri foundation with React frontend, shadcn/ui components, and Tailwind CSS. This is the first step toward migrating from the CLI script to a full-featured desktop application.

## What Changes
- Initialize Tauri v2.x project structure with Vite build system
- Set up React 18+ with TypeScript for the frontend
- Configure pnpm as the package manager for faster, more efficient dependency management
- Configure Tailwind CSS for styling
- Install and configure shadcn/ui component library
- Install and configure Biome for TypeScript/JavaScript linting and formatting
- Create minimal "Hello World" UI to verify the setup works
- Configure project to ignore service account JSON files
- Set up basic Tauri window configuration

## Impact
- **Affected specs**: `application-shell` (new capability)
- **Affected code**:
  - New `src/` directory for React frontend code
  - New `src-tauri/` directory for Rust backend code
  - New `package.json` with dependencies
  - New `pnpm-lock.yaml` for lockfile
  - New `.npmrc` to configure pnpm settings
  - New `biome.json` for linting/formatting configuration
  - New `tailwind.config.js` and `postcss.config.js` for styling
  - New `tsconfig.json` for TypeScript configuration
- **Breaking changes**: None (additive only)
- **Migration path**: Legacy `index.mjs` remains functional during transition
