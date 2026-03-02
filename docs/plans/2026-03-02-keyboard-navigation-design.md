# Keyboard Navigation Enhancement Design

## Overview

Add number key pane jumping (1-5) and nvim-style `j`/`k` movement to supplement existing arrow key navigation.

## Pane Mapping

```
1 → templates
2 → environments
3 → projects
4 → devices
5 → console
```

Matches visual top-to-bottom order of the left column, then right column.

## Key Bindings

| Key | Action |
|-----|--------|
| `1`-`5` | Jump directly to pane |
| `j` | Move down within focused pane (alias for `down`) |
| `k` | Move up within focused pane (alias for `up`) |

Arrow keys continue to work unchanged.

## UI Changes

Each panel title gains a highlighted number prefix:

```
1 Templates      (cyan "1", white " Templates")
2 Environments
3 Projects
4 Devices
5 Console
```

## Files Changed

- `src/App.tsx` — add `1-5` global jump handler; alias `j`/`k` in each panel block
- `src/components/TemplateList.tsx` — title prefix
- `src/components/EnvironmentList.tsx` — title prefix
- `src/components/ProjectList.tsx` — title prefix
- `src/components/DeviceList.tsx` — title prefix
- `src/components/DebugConsole.tsx` — title prefix
- `src/components/StatusBar.tsx` — update hints
