# Phase 1: Update dark-theme.css

**Status:** Completed
**Priority:** High

## Overview

Replace dark-theme.css with new "Obsidian Ember" palette including color-scheme: dark.

## Context

- **Report:** `plans/reports/brainstorm-260307-0105-dark-theme-redesign.md`
- **File:** `src/styles/dark-theme.css`

## Requirements

- Replace ALL existing CSS variables with new Obsidian Ember palette
- Add `color-scheme: dark` to `:root[data-theme="dark"]`
- Keep file structure clean and readable

## New CSS Variables

```css
:root[data-theme="dark"] {
  --primary: #f59e0b;
  --primary-light: #fbbf24;
  --primary-dark: #d97706;
  --primary-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  --secondary: #fbbf24;
  --secondary-light: #fcd34d;
  --bg-main: #0d0f14;
  --bg-card: #16181f;
  --bg-sidebar: #16181f;
  --text-primary: #f0f2f5;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --border-color: #2a2f3a;
  --success: #34d399;
  --success-bg: #064e3b;
  --info: #60a5fa;
  --info-bg: #1e3a5f;
  --warning: #fbbf24;
  --warning-bg: #451a03;
  --danger: #f87171;
  --danger-bg: #450a0a;
  --heatmap-0: #1a1d26;
  --heatmap-1: #3d2e14;
  --heatmap-2: #6b4a1a;
  --heatmap-3: #a07020;
  --heatmap-4: #f59e0b;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.7);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.8);
  --shadow-glow: 0 8px 32px rgba(245, 158, 11, 0.2);
  color-scheme: dark;
}
```

## Implementation Steps

1. Read current `src/styles/dark-theme.css`
2. Replace entire file content with new palette above
3. Verify syntax is valid

## Success Criteria

- [ ] All CSS variables use new Obsidian Ember palette
- [ ] color-scheme: dark present
- [ ] No syntax errors
