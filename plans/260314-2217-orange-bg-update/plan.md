# Plan: Update Orange theme background colors (Option A)

## Overview
- **Goal**: Update Orange theme background colors to use soft orange palette
- **Status**: Completed
- **Priority**: Medium

## Context
Current Orange theme uses gray colors for backgrounds:
- `--bg-card: #f8f9fa` (gray)
- `--bg-sidebar: #f1f3f5` (gray)

Other themes use their theme colors. Need to update to match design pattern.

## Solution (Option A)
Update Orange theme to use Tailwind Orange palette:
- `--bg-card: #fff7ed` (orange-50)
- `--bg-sidebar: #ffedd5` (orange-100)

## Implementation

### Phase 1: Update Orange theme CSS
File: `src/styles/themes.css`
```css
--bg-card: #fff7ed;
--bg-sidebar: #ffedd5;
```

### Phase 2: Build & Verify
- Run `npm run build`
- Verify no errors

## Files to Modify
- `src/styles/themes.css`

## Success Criteria
- Orange theme uses orange-tinted backgrounds
- Consistent with other themes (Forest/Rose/Sky/Lavender pattern)
- No build errors
