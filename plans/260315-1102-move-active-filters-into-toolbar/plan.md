# Plan: Move Active Filters INTO Toolbar

## Overview
Move active filter chips from between Summary and Comparison cards back INTO the toolbar, right below the filter controls. This creates better UX by keeping filter controls and filter feedback together.

## Problem Statement
- "More filters" button shows count badge → implies "filters are here"
- But actual filter chips appear after Summary cards (far from toolbar)
- Violates UX proximity principle: related elements should be close together

---

## Current Layout (Problem)
```
┌─────────────────────────────────────────┐
│ TOOLBAR (sticky)                        │
│ [Search] [Date Picker] [More Filters ▾]│
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ SUMMARY (3 cards)                        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ ACTIVE FILTERS ← TOO FAR!               │
│ "Bộ lọc đang áp dụng:" [chip] [chip]  │
└─────────────────────────────────────────┘
```

---

## Target Layout (Solution)
```
┌────────────────────────────────────────────────────────┐
│ TOOLBAR                                               │
│ [Search] [Date Picker] [▾ More Filters (2)]          │
├────────────────────────────────────────────────────────┤
│ Active: [2024 ×] [Hoàn thành ×] [Xóa tất cả]        │ ← NEW
└────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ SUMMARY                                 │
└─────────────────────────────────────────┘
```

---

## Requirements

### Functional
1. Active filter chips display inside toolbar container, below filter controls
2. "Xóa tất cả" button integrated with chips
3. Filter count badge on "More filters" button still works
4. All existing filter removal logic still works
5. Responsive on mobile

### Non-functional
- Preserve all existing filter functionality
- No breaking changes to filter logic
- Smooth transition animation
- Maintain accessibility

---

## File Changes

| File | Change |
|------|--------|
| `src/dashboard/results.html` | Move activeFiltersContainer INTO toolbar, add to filters-row |
| `src/styles/layout.css` | Update styling for active filters inside toolbar |
| `src/styles/responsive.css` | Mobile responsive adjustments |
| `src/dashboard/filters.ts` | No changes expected |

---

## Implementation Steps

### Phase 1: HTML Structure (results.html)
Move `activeFiltersContainer` inside toolbar:

```html
<div class="toolbar-container">
  <!-- Row 1: Search + Actions -->
  <div class="toolbar-row search-row">
    ...
  </div>

  <!-- Row 2: Date + Filters + Active Chips -->
  <div class="toolbar-row filters-row">
    <div id="dateRangePickerContainer" class="date-picker-area"></div>

    <button id="btnMoreFilters" class="btn-more-filters" ...>
      <span class="filter-count hidden">0</span>
      <span class="filter-label">Lọc</span>
    </button>

    <!-- NEW: Move active filters here -->
    <div id="activeFiltersContainer" class="active-filters-container hidden">
      <div class="active-filters-label" data-i18n="filter.active">Bộ lọc:</div>
      <div id="activeFilters" class="active-filters"></div>
      <button id="btnClearFilters" class="btn-clear-filters" data-i18n="filter.clearAll">Xóa</button>
    </div>
  </div>
</div>
```

### Phase 2: CSS Styling (layout.css)
Update styles for active filters inside toolbar:

```css
/* Active filters inside toolbar - compact style */
.filters-row .active-filters-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.filters-row .active-filters-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.filters-row .active-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filters-row .filter-chip {
  padding: 4px 8px;
  font-size: 12px;
}

.filters-row .btn-clear-filters {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.filters-row .btn-clear-filters:hover {
  color: var(--error);
}
```

### Phase 3: Responsive (responsive.css)
Adjust for mobile:

```css
@media (max-width: 768px) {
  .filters-row .active-filters-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row .active-filters {
    width: 100%;
  }
}
```

### Phase 4: Remove Old Location
Delete the old `activeFiltersContainer` from between Summary and Comparison cards.

---

## Risk Assessment

### Low Risk
- Simple HTML move
- CSS styling update
- No logic changes

### Mitigation
- Test filter removal (click × on chip)
- Test "Xóa tất cả" button
- Verify mobile responsive

---

## Success Criteria

- [x] Active filters appear immediately below filter controls
- [x] "Xóa tất cả" button integrated
- [x] Filter count badge on "More filters" works
- [x] Click × on chip removes individual filter
- [x] Click "Xóa tất cả" clears all filters
- [x] Responsive on mobile
- [x] Build passes

## Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: HTML Structure | ✅ Complete | Moved activeFiltersContainer into toolbar |
| Phase 2: CSS Styling | ✅ Complete | Added .active-filters-toolbar styles |
| Phase 3: Responsive | ✅ Complete | Mobile adjustments added |
| Build | ✅ Pass | TypeScript + Vite build successful |

**Completed:** 2026-03-15

---

## Effort Estimate
- Phase 1 (HTML): 30 min
- Phase 2 (CSS): 30 min
- Phase 3 (Responsive): 15 min
- Phase 4 (Cleanup): 15 min
- **Total: ~1.5 hours**
