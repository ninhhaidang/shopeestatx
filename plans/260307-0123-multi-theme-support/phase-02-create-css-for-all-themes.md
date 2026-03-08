# Phase 2: Create CSS for All Themes

**Status:** Completed
**Priority:** High

## Overview

Create CSS variables for all 5 themes in a single file.

## Context

- File: `src/styles/themes.css` (new)
- File: `src/styles/dark-theme.css` (deprecated)

## Requirements

- All theme CSS in single file using :root[data-theme="X"]
- Light theme uses existing variables
- Each theme has unique primary, background, text colors

## Implementation Steps

1. Create `src/styles/themes.css`:
   - :root[data-theme="light"] - existing light theme
   - :root[data-theme="dark-obsidian"] - dark with amber
   - :root[data-theme="midnight-frost"] - dark with cyan
   - :root[data-theme="royal-purple"] - dark with violet
   - :root[data-theme="slate"] - dark with gray-blue

2. Update `src/dashboard/results.css`:
   - Replace @import dark-theme.css with @import themes.css

## CSS Structure

```css
:root[data-theme="light"] {
  --primary: #ff6b3d;
  --bg-main: #ffffff;
  --text-primary: #1a1a2e;
  /* ... */
}

:root[data-theme="dark-obsidian"] {
  --primary: #f59e0b;
  --bg-main: #0d0f14;
  --text-primary: #f0f2f5;
  /* ... */
}

:root[data-theme="midnight-frost"] {
  --primary: #06b6d4;
  --bg-main: #0a0f1a;
  --text-primary: #e0f2fe;
  /* ... */
}

:root[data-theme="royal-purple"] {
  --primary: #8b5cf6;
  --bg-main: #0f0f1a;
  --text-primary: #f0f0ff;
  /* ... */
}

:root[data-theme="slate"] {
  --primary: #64748b;
  --bg-main: #0f172a;
  --text-primary: #e2e8f0;
  /* ... */
}
```

## Success Criteria

- [ ] 5 themes with distinct color palettes
- [ ] All CSS variables defined per theme
- [ ] Build passes
