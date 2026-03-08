# Multi-Theme Support Plan

**Status:** Completed
**Mode:** Auto
**Date:** 2026-03-07

## Overview

Implement multi-theme support with 5+ themes instead of just dark/light toggle.

## Context

- Current: Only dark/light toggle via `theme-toggle.ts`
- File: `src/dashboard/theme-toggle.ts`
- CSS: `src/styles/dark-theme.css`

## Requirements

- 5 themes: Light, Dark (Obsidian), Midnight Frost, Royal Purple, Slate
- User can select from dropdown/popup
- Theme persists in localStorage
- CSS variables per theme

## Architecture

1. **Theme Config** — Define themes array with id, name, primary color
2. **Theme Service** — Replace toggle with setTheme(themeId)
3. **CSS Files** — Separate CSS files per theme OR single file with :root[data-theme="X"]
4. **UI** — Theme selector dropdown in header

## Implementation Phases

| Phase | Status | Description |
|-------|--------|-------------|
| [Phase 1](phase-01-create-theme-config-and-service.md) | Pending | Create theme config + service |
| [Phase 2](phase-02-create-css-for-all-themes.md) | Pending | Create CSS for all 5 themes |
| [Phase 3](phase-03-update-ui-with-theme-selector.md) | Pending | Update UI with theme selector |
| [Phase 4](phase-04-test-and-build.md) | Pending | Test + build |

## Files to Modify/Create

- Create: `src/dashboard/theme-config.ts`
- Modify: `src/dashboard/theme-toggle.ts`
- Create: `src/styles/themes.css`
- Modify: `src/dashboard/results.css`
- Modify: `src/dashboard/results.html`

## Themes

| ID | Name | Primary | Background |
|----|------|---------|------------|
| light | Light | #ff6b3d (Orange) | #ffffff |
| dark-obsidian | Dark (Obsidian) | #f59e0b (Amber) | #0d0f14 |
| midnight-frost | Midnight Frost | #06b6d4 (Cyan) | #0a0f1a |
| royal-purple | Royal Purple | #8b5cf6 (Violet) | #0f0f1a |
| slate | Slate | #64748b (Gray Blue) | #0f172a |
