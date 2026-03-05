# Phase 2: Polish — Dark Mode + Incremental Fetch + Export

## Context Links
- [Plan overview](./plan.md)
- [Phase 1: Foundation](./phase-01-foundation-vite-typescript-tests.md)
- Depends on Phase 1 completion (TypeScript + Vite build system)

## Overview
- **Priority:** P0
- **Status:** Complete
- **Effort:** 12h (completed)
- **Version target:** v2.6

Ship high-impact user-facing features: dark mode, faster data refresh via incremental fetch, CSV/PDF export, improved loading UX.

## Key Insights
- CSS custom properties already in `:root` — dark mode is straightforward variable swap
- Shopee API pagination starts from offset 0, no `since` param — incremental fetch = cache merge by orderId
- Current loading is a plain spinner — skeleton screens give better perceived performance
- CSV export is trivial (string concatenation), PDF = browser print with print CSS

## Requirements

### Functional
- Dark mode: system preference detection + manual toggle, persisted in storage
- Incremental fetch: only process new orders, merge with cache, show "X new orders" count
- CSV export: same columns as Excel, UTF-8 BOM for Excel compatibility
- PDF export: print-optimized CSS, browser print dialog

### Non-Functional
- Dark mode toggle < 50ms (CSS-only swap)
- Incremental fetch 2-5x faster than full fetch for returning users
- No layout shift during theme switch

## Architecture

### Dark Mode
```
User clicks toggle → document.documentElement.dataset.theme = 'dark'
                   → chrome.storage.local.set({ theme: 'dark' })
                   → CSS :root[data-theme="dark"] { ... } activates

Page load → check chrome.storage.local.theme
          → if none: check prefers-color-scheme
          → apply before first paint (inline script in <head>)
```

### Incremental Fetch
```
Click refresh → load cache from storage
             → get lastOrderId from cache
             → fetch from offset 0, stop when hitting lastOrderId
             → merge new orders into cache (prepend)
             → save merged cache
             → re-render UI
```

## Related Code Files

### Files to Create
| File | Description |
|------|-------------|
| `src/styles/dark-theme.css` | Dark mode CSS variable overrides |
| `src/dashboard/theme-toggle.ts` | Theme switching logic + persistence |
| `src/dashboard/skeleton-loader.ts` | Skeleton screen component builder |

### Files to Modify
| File | Changes |
|------|---------|
| `src/styles/variables.css` | Add dark theme variables under `:root[data-theme="dark"]` |
| `src/dashboard/results.html` | Add theme toggle button in header, add inline theme detection script in `<head>` |
| `src/dashboard/data.ts` | Add `incrementalFetch()`, modify `fetchDataFromShopee()` to support merge |
| `src/dashboard/export.ts` | Add `exportToCSV()` and `exportToPDF()` functions |
| `src/dashboard/results.ts` | Wire new buttons (theme toggle, CSV, PDF), import new modules |
| `src/dashboard/results.html` | Add export dropdown, skeleton markup |
| `src/styles/states.css` | Add skeleton animation styles |
| `src/styles/responsive.css` | Add print-specific styles for PDF export |
| `src/content/content.js` | No changes (fetch logic stays same) |

## Implementation Steps

### Step 1: Dark Mode — CSS Variables (2h)
1. Create `src/styles/dark-theme.css`:
   ```css
   :root[data-theme="dark"] {
     --bg-main: #0f1117;
     --bg-card: #1a1d27;
     --text-primary: #e2e8f0;
     --text-secondary: #94a3b8;
     --text-muted: #64748b;
     --border-color: #2d3348;
     --primary: #ff6b3d;        /* slightly lighter for dark bg */
     --primary-light: #ff8c5a;
     --primary-gradient: linear-gradient(135deg, #ff6b3d 0%, #ff8c5a 100%);
     --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
     --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
     /* ... all other variables ... */
   }
   ```
2. Import in `src/dashboard/results.css` after `variables.css`
3. Ensure all components use CSS variables (already true — minimal fixes)
4. Fix any hardcoded colors (search for `#fff`, `white`, `#f8f9fc`, etc.)

### Step 2: Dark Mode — Toggle & Persistence (2h)
1. Create `src/dashboard/theme-toggle.ts`:
   ```ts
   export function initTheme(): void {
     // Check storage first, then system preference
     const stored = localStorage.getItem('shopeestatx-theme');
     if (stored) {
       document.documentElement.dataset.theme = stored;
     } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
       document.documentElement.dataset.theme = 'dark';
     }
   }

   export function toggleTheme(): void {
     const current = document.documentElement.dataset.theme;
     const next = current === 'dark' ? 'light' : 'dark';
     document.documentElement.dataset.theme = next;
     localStorage.setItem('shopeestatx-theme', next);
   }
   ```
2. Add inline script in `<head>` of results.html for FOUC prevention:
   ```html
   <script>
     const t = localStorage.getItem('shopeestatx-theme');
     if (t) document.documentElement.dataset.theme = t;
     else if (matchMedia('(prefers-color-scheme: dark)').matches)
       document.documentElement.dataset.theme = 'dark';
   </script>
   ```
3. Add toggle button in header (sun/moon icon)
4. Wire in `results.ts`

### Step 3: Incremental Fetch (3h)
1. In `src/dashboard/data.ts`, add:
   ```ts
   export async function incrementalFetch(): Promise<void> {
     const cached = await chrome.storage.local.get(['shopeeStats']);
     const existingOrders = cached.shopeeStats?.orders || [];
     const existingIds = new Set(existingOrders.map((o: Order) => o.orderId));

     // Fetch from Shopee starting at offset 0
     // Stop when we encounter an orderId already in cache
     // (orders are returned newest-first from API)
     const newOrders = await fetchNewOrders(existingIds);

     if (newOrders.length === 0) {
       // No new orders, just re-render from cache
       state.allOrdersData = cached.shopeeStats;
       initializeUI(cached.shopeeStats);
       showToast(`Du lieu da cap nhat. Khong co don moi.`);
       return;
     }

     // Merge: new orders first, then existing
     const merged = {
       ...cached.shopeeStats,
       orders: [...newOrders, ...existingOrders],
       cachedAt: new Date().toISOString(),
     };
     // Recalculate totals
     merged.totalCount = merged.orders.reduce((s, o) => s + o.productCount, 0);
     merged.totalAmount = merged.orders
       .filter(o => o.statusCode !== 4 && o.statusCode !== 12)
       .reduce((s, o) => s + o.subTotal, 0);

     await chrome.storage.local.set({ shopeeStats: merged });
     state.allOrdersData = merged;
     initializeUI(merged);
     showToast(`Da them ${newOrders.length} don hang moi!`);
   }
   ```
2. Modify `refreshData()` to call `incrementalFetch()` instead of full page reload
3. Add `showToast()` utility for non-intrusive notifications
4. Update loading text to show incremental progress

### Step 4: CSV Export (1h)
1. In `src/dashboard/export.ts`, add:
   ```ts
   export function exportToCSV(): void {
     const orders = state.filteredOrders;
     const BOM = '\uFEFF'; // UTF-8 BOM for Excel
     const headers = ['STT', 'Ma don', 'Ngay giao', 'Trang thai', 'San pham', 'So luong', 'Tong tien'];
     const rows = orders.map((o, i) => [
       i + 1,
       o.orderId,
       o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '',
       o.status,
       `"${o.name.replace(/"/g, '""')}"`,
       o.productCount,
       o.subTotal,
     ].join(','));

     const csv = BOM + [headers.join(','), ...rows].join('\n');
     downloadFile(csv, 'shopeestatx-export.csv', 'text/csv;charset=utf-8');
   }
   ```

### Step 5: PDF Export (1h)
1. Add print-optimized CSS in `src/styles/responsive.css`:
   ```css
   @media print {
     .toolbar, .pagination-container, .btn-export,
     .btn-refresh, .page-footer, .chart-controls { display: none; }
     .charts-container { grid-template-columns: 1fr; }
     .table-container { margin: 0; box-shadow: none; border: 1px solid #ccc; }
     body { background: white; }
   }
   ```
2. PDF export = `window.print()` (browser handles PDF generation)
3. Add PDF button alongside CSV and Excel buttons

### Step 6: Export Dropdown UI (1h)
Replace single "Xuat file xlsx" button with dropdown:
```html
<div class="export-dropdown">
  <button class="btn-export">Xuat du lieu ▾</button>
  <div class="export-menu">
    <button id="btnExportXlsx">Excel (.xlsx)</button>
    <button id="btnExportCsv">CSV (.csv)</button>
    <button id="btnExportPdf">In / PDF</button>
  </div>
</div>
```

### Step 7: Skeleton Loading (2h)
1. Create skeleton markup in results.html (hidden by default)
2. Show skeleton cards + chart placeholders during data loading
3. Animate with CSS shimmer effect
4. Replace spinner with skeletons progressively

## Todo List
- [x] Create dark theme CSS variables
- [x] Fix hardcoded colors in existing CSS
- [x] Create theme toggle module
- [x] Add FOUC prevention inline script
- [x] Add toggle button UI in header
- [x] Implement incrementalFetch in data.ts
- [x] Add showToast utility
- [x] Modify refreshData to use incremental fetch
- [x] Implement CSV export
- [x] Add print CSS for PDF export
- [x] Create export dropdown UI
- [x] Wire new buttons in results.ts
- [x] Create skeleton loading markup + CSS
- [x] Test dark mode in all views (popup, welcome, results)
- [x] Test incremental fetch (first load vs refresh)
- [x] Test all export formats
- [x] Bump version to 2.6.0

## Success Criteria
- Dark mode works with system preference + manual toggle
- Theme persists across sessions
- No FOUC on page load
- Incremental fetch completes in < 5s for returning users (vs 30s+ full fetch)
- CSV opens correctly in Excel with Vietnamese characters
- PDF prints cleanly with charts visible
- All existing features still work in both themes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Chart.js colors not adapting to dark mode | Medium | Medium | Override Chart.js defaults in dark theme, or regenerate charts on theme switch |
| Incremental fetch misses modified orders | Low | Low | Full re-fetch button as fallback |
| CSV encoding issues on non-UTF8 systems | Low | Low | UTF-8 BOM prefix ensures Excel compatibility |

## Security Considerations
- Theme preference stored in localStorage (non-sensitive)
- No new permissions needed
- No external API calls added

## Next Steps
- Phase 3: Spending insights features (heatmap, categories, budget)
