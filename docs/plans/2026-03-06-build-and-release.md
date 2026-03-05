# Build Command and First Release Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a build script to package.json and a GitHub Actions workflow that cross-compiles lazypush for 5 platforms and publishes to npm on version tag push.

**Architecture:** Bun's `--compile --target` flag handles cross-compilation from a single CI runner. GitHub Actions triggers on `v*` tags, builds all targets, creates a GH release with binary attachments, and publishes the npm package. The npm package uses a shebang entry point so `bun install -g lazypush` works.

**Tech Stack:** Bun (compile + runtime), GitHub Actions, npm registry

---

### Task 1: Add shebang to index.tsx for npm bin

The `bin` field in package.json requires the entry file to have a proper shebang so the OS knows to use Bun as the interpreter.

**Files:**
- Modify: `src/index.tsx` (line 1)

**Step 1: Add shebang as first line**

Edit `src/index.tsx` — prepend `#!/usr/bin/env bun` as the very first line:

```tsx
#!/usr/bin/env bun
// src/index.tsx
import { render } from "@opentui/solid";
// ... rest of file unchanged
```

**Step 2: Verify the file starts correctly**

Run: `head -2 src/index.tsx`
Expected:
```
#!/usr/bin/env bun
// src/index.tsx
```

**Step 3: Commit**

```bash
git add src/index.tsx
git commit -m "chore: add shebang for npm bin entry"
```

---

### Task 2: Update package.json with bin field and build script

**Files:**
- Modify: `package.json`

**Step 1: Add bin field and build script**

Edit `package.json` — add `bin` and `build` to scripts:

```json
{
  "name": "lazypush",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "lazypush": "src/index.tsx"
  },
  "scripts": {
    "dev": "bun run src/index.tsx",
    "build": "bun build --compile --minify src/index.tsx --outfile dist/lazypush",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "check": "ultracite check",
    "fix": "ultracite fix",
    "prepare": "husky"
  }
}
```

**Step 2: Test local build**

```bash
mkdir -p dist
bun run build
```

Expected: `dist/lazypush` binary created, no errors.

**Step 3: Verify binary runs**

```bash
./dist/lazypush --help 2>&1 || ./dist/lazypush --version 2>&1 || echo "binary exists: $(ls -lh dist/lazypush)"
```

Expected: binary exists and is executable (it will try to open a TUI, so Ctrl+C immediately; the point is it starts without crashing).

**Step 4: Add dist/ to .gitignore**

Check if `dist/` is in `.gitignore`. If not:
```bash
echo "dist/" >> .gitignore
```

**Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: add build script and npm bin entry"
```

---

### Task 3: Create GitHub Actions release workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Step 1: Create directory**

```bash
mkdir -p .github/workflows
```

**Step 2: Create the workflow file**

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    name: Build binaries
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build all targets
        run: |
          mkdir -p dist
          bun build --compile --minify --target=bun-darwin-arm64 src/index.tsx --outfile dist/lazypush-darwin-arm64
          bun build --compile --minify --target=bun-darwin-x64 src/index.tsx --outfile dist/lazypush-darwin-x64
          bun build --compile --minify --target=bun-linux-arm64 src/index.tsx --outfile dist/lazypush-linux-arm64
          bun build --compile --minify --target=bun-linux-x64 src/index.tsx --outfile dist/lazypush-linux-x64
          bun build --compile --minify --target=bun-windows-x64 src/index.tsx --outfile dist/lazypush-windows-x64.exe

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/lazypush-darwin-arm64
            dist/lazypush-darwin-x64
            dist/lazypush-linux-arm64
            dist/lazypush-linux-x64
            dist/lazypush-windows-x64.exe
          generate_release_notes: true

  publish-npm:
    name: Publish to npm
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Publish to npm
        run: bun publish --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          BUN_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Step 3: Verify YAML syntax**

```bash
cat .github/workflows/release.yml
```

Check indentation looks correct (no tabs, consistent 2-space indentation).

**Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow for binaries and npm publish"
```

---

### Task 4: Set up NPM_TOKEN secret

This task is manual — you do it in the browser.

**Step 1: Get your npm token**

1. Go to https://www.npmjs.com → Avatar → Access Tokens
2. Click "Generate New Token" → "Classic Token" → Type: "Automation"
3. Copy the token (starts with `npm_...`)

**Step 2: Add to GitHub repo secrets**

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: paste your npm token
5. Click "Add secret"

**Step 3: Verify**

Confirm the secret appears in the list as `NPM_TOKEN` (value is hidden).

---

### Task 5: Tag and push v0.1.0

**Step 1: Confirm you're on main and it's clean**

```bash
git status
git log --oneline -3
```

Expected: on `main` branch, clean working tree.

**Step 2: Create and push the tag**

```bash
git tag v0.1.0
git push origin v0.1.0
```

Expected: tag pushed, GitHub Actions workflow triggers.

**Step 3: Monitor the release workflow**

```bash
gh run list --limit 5
```

Watch for the "Release" workflow run. Monitor with:

```bash
gh run watch
```

Expected: both `build` and `publish-npm` jobs succeed.

**Step 4: Verify the release**

```bash
gh release view v0.1.0
```

Expected: release with 5 binary attachments listed.

**Step 5: Verify npm publish**

```bash
curl -s https://registry.npmjs.org/lazypush/latest | bun -e "const d=await Bun.stdin.json(); console.log(d.version)"
```

Expected: `0.1.0`
