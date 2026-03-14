# Plan: Update all themes to use Tailwind colors

## Overview
- **Goal**: Update Orange theme (and verify others) to use consistent Tailwind color palette
- **Status**: Completed
- **Priority**: Medium

## Background
Currently themes use inconsistent color palettes:
- Orange theme: Bootstrap colors (legacy)
- Forest/Rose/Sky/Lavender: Tailwind colors (modern)

Need to unify all themes to use Tailwind color system for consistency.

## Requirements

### Functional
- Update Orange theme status colors to Tailwind palette
- Verify other themes already use Tailwind colors

### Non-functional
- Maintain visual distinction between status types
- Keep colors accessible (sufficient contrast)

## Implementation

### Phase 1: Update Orange Theme Colors
Update `src/styles/themes.css` - Orange theme section:
- success: `#22c55e` (Tailwind green-500)
- success-bg: `#dcfce7` (Tailwind green-100)
- info: `#0ea5e9` (Tailwind sky-500)
- info-bg: `#e0f2fe` (Tailwind sky-100)
- warning: `#f59e0b` (Tailwind amber-500)
- warning-bg: `#fef3c7` (Tailwind amber-100)
- danger: `#ef4444` (Tailwind red-500)
- danger-bg: `#fee2e2` (Tailwind red-100)
- pending: `#8b5cf6` (Tailwind violet-500)
- pending-bg: `#ede9fe` (Tailwind violet-100)
- returned: `#f97316` (Tailwind orange-500)
- returned-bg: `#ffedd5` (Tailwind orange-100)

### Phase 2: Verify Other Themes
Check Forest, Rose, Sky, Lavender themes for consistency

### Phase 3: Build & Test
- Run `npm run build`
- Verify no errors

## Files to Modify
- `src/styles/themes.css`

## Success Criteria
- All 5 themes use Tailwind color palette
- No build errors
- Status badges remain visually distinct
