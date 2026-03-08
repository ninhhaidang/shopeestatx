# Phase 1: Create Theme Config and Service

**Status:** Completed
**Priority:** High

## Overview

Create theme configuration and service to manage multiple themes.

## Context

- File to create: `src/dashboard/theme-config.ts`
- File to modify: `src/dashboard/theme-toggle.ts`

## Theme Palette

| Theme ID | Name | Primary Color | Background |
|----------|------|---------------|------------|
| light | Light | #ff6b3d (Shopee Orange) | #ffffff |
| dark-obsidian | Dark (Obsidian) | #f59e0b (Amber) | #0d0f14 |
| midnight-frost | Midnight Frost | #06b6d4 (Cyan) | #0a0f1a |
| royal-purple | Royal Purple | #8b5cf6 (Violet) | #0f0f1a |
| slate | Slate | #64748b (Gray Blue) | #0f172a |

## Requirements

- Define Theme interface with id, name, primaryColor
- Create themes array with 5 themes above
- Replace toggleTheme() with setTheme(themeId)
- Support system preference detection
- Persist to localStorage

## Implementation Steps

1. Create `src/dashboard/theme-config.ts`:
   - Export Theme interface
   - Export themes array
   - Export getTheme(id) helper

2. Modify `src/dashboard/theme-toggle.ts`:
   - Import ThemeConfig
   - Replace toggleTheme with setTheme(themeId)
   - Update initTheme to handle theme IDs

## Success Criteria

- [ ] Theme config with 5 themes
- [ ] setTheme function works
- [ ] localStorage persistence works
- [ ] System preference detection works
