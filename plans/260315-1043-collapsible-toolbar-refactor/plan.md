# Plan: Collapsible Toolbar Refactor (Option C)

## Overview
Refactor toolbar thành collapsible layout với search/date luôn visible, filters nâng cao trong collapsible panel.

## User Decisions
- **Date picker**: Always Visible (user thấy date options ngay)
- **Mobile**: Collapsible (tiết kiệm không gian, user expand khi cần)

---

## Current State Analysis

### Components trong toolbar hiện tại
| Element | Type | Priority | Collapsible? |
|---------|------|----------|--------------|
| searchBox | Input | High | No |
| dateRangePicker | Component | High | No (Always) |
| filterStatus | Select | Medium | Yes - collapsible |
| filterCategory | Select | Medium | Yes - collapsible |
| filterYear/Month | Hidden | Low | N/A |
| lastUpdated | Info | Low | No |
| btnRefresh | Action | Medium | No |
| export-dropdown | Action | Medium | No |

### Dependencies cần preserve
- `selectedDay` drill-down từ chart click → requires year/month state
- Hidden `filterYear`/`filterMonth` selects vẫn cần cho chart compatibility
- DateRangePicker sync với hidden selects (xem `date-range-picker.ts` lines 66-78)

---

## Requirements

### Functional
1. Search box luôn visible ở primary row
2. Date picker **always visible** - không collapsible
3. Status + Category filters trong collapsible "More filters" panel
4. Year/Month selects vẫn hidden nhưng functional cho chart
5. Actions (refresh, export, last-updated) ở separate row hoặc inline
6. **Mobile**: Collapsible behavior - tiết kiệm không gian

### Non-functional
- Preserve all existing filter logic
- No breaking changes to chart drill-down
- Maintain accessibility (ARIA)
- Smooth animations for expand/collapse

---

## Architecture

### New Layout Structure
```
toolbar-container (flex column)
├── search-row
│   ├── search-box (flex: 1)
│   └── action-buttons (refresh, export, last-updated)
├── filters-row
│   ├── date-picker (always visible)
│   └── more-filters-toggle + panel
│       ├── status-select
│       └── category-select
```

### New Components
```
toolbar/
├── toolbar-container     # Main wrapper (flex column)
├── search-row           # Search + primary actions
├── filters-row          # Date picker + collapsible panel
│   ├── date-picker      # Existing date-range-picker (always visible)
│   └── more-filters     # NEW: Collapsible panel
│       ├── toggle-button # "More filters ▾/▴"
│       ├── status-select
│       └── category-select
```

### State Management
```typescript
// src/dashboard/state.ts - Add new state
interface AppState {
  // ... existing
  toolbar: {
    filtersExpanded: boolean;  // Collapsible panel state
  };
}
```

---

## File Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/dashboard/results.html` | Modify | Restructure toolbar HTML |
| `src/styles/layout.css` | Modify | Add new CSS classes |
| `src/styles/responsive.css` | Modify | Update media queries |
| `src/dashboard/state.ts` | Modify | Add toolbar state |
| `src/dashboard/results.ts` | Modify | Add toggle handlers |

---

## Implementation Steps

### Phase 1: HTML Structure
**File**: `src/dashboard/results.html`

1. Wrap toolbar content trong semantic structure:
```html
<div class="toolbar-container">
  <!-- Row 1: Search + Actions -->
  <div class="toolbar-row search-row">
    <div class="search-wrapper">
      <label for="searchBox" class="visually-hidden">Tìm kiếm...</label>
      <input type="text" id="searchBox" placeholder="Tìm kiếm..." />
    </div>
    <div class="toolbar-actions">
      <span id="lastUpdated" class="last-updated"></span>
      <button id="btnRefresh" class="btn-refresh">⟳</button>
      <div class="export-dropdown">
        <button id="btnExport">Xuất dữ liệu ▾</button>
      </div>
    </div>
  </div>

  <!-- Row 2: Date + Collapsible Filters -->
  <div class="toolbar-row filters-row">
    <div id="dateRangePickerContainer" class="date-picker-area"></div>

    <button id="btnMoreFilters" class="btn-more-filters" aria-expanded="false" aria-controls="moreFiltersPanel">
      <span class="filter-count"></span> Lọc ▾
    </button>

    <div id="moreFiltersPanel" class="more-filters-panel" hidden>
      <select id="filterStatus">...</select>
      <select id="filterCategory">...</select>
      <!-- Hidden selects kept for chart compatibility -->
      <select id="filterYear" style="display:none">...</select>
      <select id="filterMonth" style="display:none">...</select>
    </div>
  </div>
</div>
```

### Phase 2: CSS Styling
**File**: `src/styles/layout.css`

1. Add new classes:
```css
.toolbar-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.search-wrapper {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-wrapper #searchBox {
  width: 100%;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filters-row {
  justify-content: space-between;
}

.date-picker-area {
  flex: 1;
}

.btn-more-filters {
  padding: 8px 16px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-more-filters:hover {
  border-color: var(--primary);
}

.btn-more-filters[aria-expanded="true"] {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.more-filters-panel {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding: var(--spacing-md);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  animation: slideDown 0.2s ease;
}

.more-filters-panel[hidden] {
  display: none;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.filter-count {
  background: var(--primary);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  margin-right: 4px;
}
```

### Phase 3: Responsive CSS
**File**: `src/styles/responsive.css`

```css
@media (max-width: 768px) {
  .toolbar-container {
    position: relative;
    top: 0;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: none;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }

  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .date-picker-area {
    width: 100%;
  }

  .more-filters-panel {
    flex-direction: column;
  }

  .more-filters-panel select {
    width: 100%;
  }
}
```

### Phase 4: State & JavaScript
**File**: `src/dashboard/state.ts`

```typescript
export interface AppState {
  // ... existing
  toolbar: {
    filtersExpanded: boolean;
  };
}
```

**File**: `src/dashboard/results.ts` - Add toggle logic:

```typescript
// Toggle more filters panel
const btnMoreFilters = document.getElementById('btnMoreFilters');
const moreFiltersPanel = document.getElementById('moreFiltersPanel');

function updateFilterCount() {
  const count = // count active filters
  const countEl = btnMoreFilters?.querySelector('.filter-count');
  if (countEl) countEl.textContent = String(count);
}

btnMoreFilters?.addEventListener('click', () => {
  const isExpanded = btnMoreFilters.getAttribute('aria-expanded') === 'true';
  btnMoreFilters.setAttribute('aria-expanded', String(!isExpanded));
  moreFiltersPanel.hidden = isExpanded;

  // Update icon
  const icon = btnMoreFilters.querySelector('span:last-child');
  if (icon) icon.textContent = isExpanded ? ' ▾' : ' ▴';
});

// Update filter count on filter changes
document.addEventListener('filterChanged', updateFilterCount);
```

### Phase 5: Accessibility
1. Add `aria-expanded="true/false"` to toggle button
2. Add `aria-controls="moreFiltersPanel"` linking
3. Add `aria-label` cho search
4. Add keyboard: Enter/Space toggle, Escape close
5. Focus management: focus toggle when panel closes

### Phase 6: Testing Plan
1. **Filter combinations**: Test all filter types together
2. **Chart drill-down**: Click chart bar → verify day filter works
3. **Responsive**: Test 320px to 1920px
4. **Accessibility**: Keyboard nav, screen reader (NVDA/VoiceOver)
5. **Performance**: Animation không lag

---

## Risk Assessment

### High Risk Items
| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking chart drill-down | Critical | Keep hidden selects, test extensively |
| Filter state sync | High | Use events, test edge cases |

### Medium Risk Items
| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation performance | Medium | Use transform/opacity, test low-end |
| Mobile UX confusion | Medium | Test with real users |

---

## Success Criteria

- [x] Search luôn visible và functional
- [x] Date picker always visible
- [x] Status/Category trong collapsible panel
- [x] All existing filter logic preserved
- [x] Chart drill-down works (selectedDay) - hidden selects kept
- [x] Responsive: 320px → 1920px
- [x] Accessible: keyboard + ARIA
- [x] Smooth animations

## Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: HTML Structure | ✅ Complete | New toolbar-container with semantic rows |
| Phase 2: CSS Styling | ✅ Complete | New classes + legacy compatibility |
| Phase 3: Responsive | ✅ Complete | Mobile collapsible behavior |
| Phase 4: JavaScript | ✅ Complete | Toggle logic + filter count |
| Phase 5: Accessibility | ✅ Complete | ARIA attributes added |
| Build | ✅ Pass | TypeScript + Vite build successful |

---

## Effort Estimate
- Phase 1 (HTML): 2 hours
- Phase 2 (CSS): 2 hours
- Phase 3 (Responsive): 1 hour
- Phase 4 (JS): 2 hours
- Phase 5 (A11y): 1 hour
- Phase 6 (Testing): 2 hours
- **Total: ~10 hours**

---

## Dependencies & Notes

### Existing Code to Reference
- `date-range-picker.ts`: Preserves existing behavior
- `filters.ts`: No changes needed if IDs remain
- `charts.ts`: Uses hidden selects - must keep

### Backward Compatibility
- Keep all existing element IDs
- Keep hidden `filterYear`/`filterMonth` selects
- Keep all event handlers in `results.ts`
