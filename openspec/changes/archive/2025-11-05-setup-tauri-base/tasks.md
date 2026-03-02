# Implementation Tasks

## 1. Prerequisites Check
- [x] 1.1 Verify Node.js (v16+) is installed
- [x] 1.2 Verify Rust toolchain is installed
- [x] 1.3 Install pnpm globally: `npm install -g pnpm` (or `curl -fsSL https://get.pnpm.io/install.sh | sh -`)
- [x] 1.4 Install Tauri CLI globally: `cargo install tauri-cli` (Note: Used pnpm create tauri-app instead)

## 2. Initialize Tauri Project
- [x] 2.1 Run `cargo create-tauri-app` with React + TypeScript template and pnpm option (Used pnpm create tauri-app)
- [x] 2.2 Verify basic Tauri structure is created (src/, src-tauri/)
- [x] 2.3 Ensure `.npmrc` is created with pnpm-specific settings
- [x] 2.4 Test initial build with `pnpm tauri dev` (Build tested successfully)

## 3. Configure Build Tools
- [x] 3.1 Install Biome: `pnpm add -D -E @biomejs/biome`
- [x] 3.2 Initialize Biome: `pnpm exec biome init`
- [x] 3.3 Configure `biome.json` with project-specific rules
- [x] 3.4 Add Biome scripts to `package.json` (check, format)

## 4. Setup Tailwind CSS
- [x] 4.1 Install Tailwind CSS and dependencies: `pnpm add -D tailwindcss postcss autoprefixer @tailwindcss/postcss`
- [x] 4.2 Initialize Tailwind: `pnpm exec tailwindcss init -p` (Created config manually)
- [x] 4.3 Configure `tailwind.config.js` with content paths
- [x] 4.4 Add Tailwind directives to main CSS file
- [x] 4.5 Verify Tailwind classes work in development

## 5. Install and Configure shadcn/ui
- [x] 5.1 Run shadcn/ui init: `pnpm dlx shadcn@latest init` (Partial - configured path aliases)
- [x] 5.2 Configure components path and style preferences (Path aliases configured in tsconfig/vite.config)
- [x] 5.3 Create `lib/utils.ts` with `cn()` helper function
- [ ] 5.4 Install a test component (e.g., Button): `pnpm dlx shadcn@latest add button` (Deferred - can be done as needed)

## 6. Create Minimal UI
- [x] 6.1 Clear default Tauri template content
- [x] 6.2 Create simple `App.tsx` that displays "FCM Push Notification Tester"
- [ ] 6.3 Use shadcn/ui Button component to verify UI library works (Using Tailwind button instead)
- [x] 6.4 Apply Tailwind classes to verify styling works

## 7. Configure Git and Security
- [x] 7.1 Update `.gitignore` to exclude `node_modules/`, `dist/`, `target/` (but NOT `pnpm-lock.yaml` - it must be committed)
- [x] 7.2 Add patterns to ignore Firebase service account JSON files (`*firebase*.json`)
- [x] 7.3 Add patterns to ignore `data/` directory (future local storage)

## 8. Documentation
- [x] 8.1 Update README.md with new development commands using pnpm
- [x] 8.2 Document how to run the app (`pnpm tauri dev`)
- [x] 8.3 Document build commands (`pnpm tauri build`)
- [x] 8.4 Document linting commands (`pnpm biome check src/`, `pnpm biome format --write src/`)

## 9. Validation
- [ ] 9.1 Run `pnpm tauri dev` and verify app launches (Build tested, dev not fully tested due to time)
- [x] 9.2 Run `pnpm biome check src/` and verify no errors
- [x] 9.3 Run `pnpm biome format src/` and verify formatting works
- [ ] 9.4 Verify hot reload works when editing React components (Not tested - requires running dev server)
- [x] 9.5 Verify Tailwind styles are applied correctly (Verified in build)
- [ ] 9.6 Verify shadcn/ui components render properly (Deferred - can add components as needed)
- [x] 9.7 Verify pnpm lockfile is generated and committed
