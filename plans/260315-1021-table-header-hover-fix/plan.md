# Plan: Fix Table Header Hover CSS

## Overview
- **Priority:** Medium
- **Status:** Completed
- **Description:** Fix table header hover where background becomes white but text stays white (invisible)

## Issue
- `th.sortable:hover` has `background: rgba(255, 255, 255, 0.15)` - too light
- Text/icon remain white, causing poor contrast

## Solution
Change hover background to darker color that maintains contrast with white text

## Implementation
```css
th.sortable:hover {
  background: rgba(0, 0, 0, 0.15);
}
```

## Related Files
- `src/styles/table.css` line 80-82

## Success Criteria
- [ ] Hover background is darker (not white)
- [ ] Text/icon remains white (#ffffff)
- [ ] Subtle hover effect maintained

## Risk
- Low - CSS only change
