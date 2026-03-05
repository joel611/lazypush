# Build Command and First Release Design

## Overview

Set up a `build` script in package.json and a GitHub Actions CI/CD pipeline to produce cross-platform binaries and publish to npm on version tag push.

## Distribution Targets

- npm: `bun install -g lazypush` / `bunx lazypush`
- GitHub Release binaries: 5 targets
  - `lazypush-darwin-arm64`
  - `lazypush-darwin-x64`
  - `lazypush-linux-arm64`
  - `lazypush-linux-x64`
  - `lazypush-windows-x64.exe`

## package.json Changes

Add `bin` field for npm global install:
```json
"bin": {
  "lazypush": "src/index.tsx"
}
```

Add `build` script for local testing (native platform only):
```json
"build": "bun build --compile --minify src/index.tsx --outfile dist/lazypush"
```

## GitHub Actions Workflow

File: `.github/workflows/release.yml`

- Trigger: push of `v*` tags
- Jobs:
  1. **build** — matrix across 5 Bun compile targets, uploads binary artifacts
  2. **publish-npm** — runs after build, publishes package to npm
- Secrets required: `NPM_TOKEN`

## Release Process

```bash
# From main branch, after all changes are merged
git tag v0.1.0
git push origin v0.1.0
```

CI builds all platforms and creates the GitHub release automatically.

## First Release Checklist

- [ ] Update package.json (bin + build script)
- [ ] Add .github/workflows/release.yml
- [ ] Add NPM_TOKEN secret to GitHub repo settings
- [ ] Verify npm package name `lazypush` is available
- [ ] Merge to main (already on main)
- [ ] Tag and push v0.1.0
