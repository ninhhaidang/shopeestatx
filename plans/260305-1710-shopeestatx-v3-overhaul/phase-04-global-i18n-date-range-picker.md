# Phase 4: Global — i18n + Date Range Picker

## Context Links
- [Plan overview](./plan.md)
- [Phase 3: Insights](./phase-03-insights-heatmap-categories-budget.md)
- Depends on Phase 1 (TypeScript) for type-safe i18n

## Overview
- **Priority:** P2
- **Status:** Complete
- **Effort:** 12h
- **Version target:** v3.1

Internationalize the app for global Shopee markets and add flexible date range filtering. This phase opens ShopeeStatX to millions of non-Vietnamese Shopee users (MY, TH, PH, SG, TW, BR).

## Key Insights
- ~100 translatable strings across all views (dashboard, popup, welcome)
- Shopee operates in 7+ markets with different currencies and languages
- Date range picker is more intuitive than separate year/month dropdowns
- Number/currency formatting must adapt per locale
- Category keywords (Phase 3) also need localization

## Requirements

### Functional
- Support Vietnamese (default) + English as initial languages
- Language switcher accessible from header
- All UI strings translatable via JSON locale files
- Date range picker with presets ("Last 7 days", "This month", "Last 3 months", custom)
- Currency formatting per locale (VND, MYR, THB, etc.)

### Non-Functional
- Language switch < 100ms (no page reload)
- Locale files < 5KB each
- Date picker lightweight (no external library, custom-built)
- URL params support: `?lang=en` for shareable links

## Architecture

### i18n Module
```
src/
├── i18n/
│   ├── index.ts           # t() function, locale management
│   ├── locales/
│   │   ├── vi.json        # Vietnamese (default)
│   │   └── en.json        # English
│   └── format.ts          # Number/currency/date formatting per locale
```

### Translation Function
```ts
// src/i18n/index.ts
type LocaleKey = keyof typeof import('./locales/vi.json');

let currentLocale: Record<string, string> = {};

export async function setLocale(lang: string): Promise<void> {
  const module = await import(`./locales/${lang}.json`);
  currentLocale = module.default;
  document.documentElement.lang = lang;
  localStorage.setItem('shopeestatx-lang', lang);
}

export function t(key: string, params?: Record<string, string | number>): string {
  let text = currentLocale[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
```

### Date Range Picker
```
Custom component (no library):
┌─────────────────────────────────────┐
│ [7 ngay] [Thang nay] [3 thang] [▼] │
│                                     │
│ Tu: [____/____/____]                │
│ Den: [____/____/____]               │
│                                     │
│ [Ap dung]              [Huy]        │
└─────────────────────────────────────┘
```

## Related Code Files

### Files to Create
| File | Description |
|------|-------------|
| `src/i18n/index.ts` | Core i18n: t(), setLocale(), getLocale() |
| `src/i18n/format.ts` | Locale-aware number, currency, date formatting |
| `src/i18n/locales/vi.json` | Vietnamese translations (~100 keys) |
| `src/i18n/locales/en.json` | English translations |
| `src/dashboard/date-range-picker.ts` | Custom date range picker component |
| `src/styles/date-picker.css` | Date picker styles |
| `tests/i18n.test.ts` | i18n function tests |

### Files to Modify
| File | Changes |
|------|---------|
| `src/dashboard/results.html` | Replace hardcoded strings with `data-i18n` attributes, add language switcher, replace year/month dropdowns with date range picker slot |
| `src/dashboard/results.ts` | Import i18n, call `setLocale()` on init, wire language switcher |
| `src/dashboard/comparison.ts` | Use `t()` for "Thang nay", "Nam nay", comparison text |
| `src/dashboard/table.ts` | Use `t()` for column headers, status text |
| `src/dashboard/filters.ts` | Use `t()` for filter labels, adapt for date range |
| `src/dashboard/charts.ts` | Use `t()` for chart labels, tooltip text |
| `src/dashboard/insights.ts` | Use `t()` with params for insight templates |
| `src/dashboard/budget.ts` | Use `t()` for budget dialog labels |
| `src/dashboard/heatmap.ts` | Use `t()` for tooltip text, month labels |
| `src/dashboard/export.ts` | Use `t()` for export headers |
| `src/dashboard/utils.ts` | Replace `formatVND()` with locale-aware `formatCurrency()` |
| `src/popup/popup.html` | Add `data-i18n` attributes |
| `src/popup/popup.ts` | Import i18n |
| `src/welcome/welcome.html` | Add `data-i18n` attributes |

## Implementation Steps

### Step 1: i18n Core Module (3h)
1. Create `src/i18n/index.ts` with:
   - `t(key, params?)` — translation with interpolation
   - `setLocale(lang)` — load locale file, update DOM
   - `getLocale()` — current locale string
   - `applyTranslations()` — scan `[data-i18n]` attributes and set textContent
2. Create `src/i18n/format.ts`:
   ```ts
   const CURRENCY_MAP: Record<string, { locale: string; currency: string }> = {
     vi: { locale: 'vi-VN', currency: 'VND' },
     en: { locale: 'en-US', currency: 'VND' }, // still VND for Shopee VN
     // Future: my: { locale: 'ms-MY', currency: 'MYR' }, etc.
   };

   export function formatCurrency(amount: number, short = false): string {
     const { locale, currency } = CURRENCY_MAP[getLocale()] || CURRENCY_MAP.vi;
     if (short) {
       if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
       if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
     }
     return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
   }

   export function formatDate(date: Date): string {
     const locale = getLocale() === 'vi' ? 'vi-VN' : 'en-US';
     return date.toLocaleDateString(locale);
   }
   ```

### Step 2: Extract Translation Strings (2h)
1. Create `src/i18n/locales/vi.json`:
   ```json
   {
     "app.title": "ShopeeStatX",
     "summary.orders": "Don hang",
     "summary.products": "Tong san pham",
     "summary.totalSpent": "Tong tien da tieu",
     "filter.allYears": "Tat ca nam",
     "filter.allMonths": "Tat ca thang",
     "filter.allStatus": "Tat ca trang thai",
     "filter.search": "Tim kiem don hang, san pham, shop...",
     "status.completed": "Hoan thanh",
     "status.cancelled": "Da huy",
     "status.shipping": "Cho van chuyen",
     "status.delivering": "Dang giao",
     "status.payment": "Cho thanh toan",
     "status.return": "Tra hang",
     "table.index": "STT",
     "table.orderId": "Ma don hang",
     "table.date": "Ngay giao",
     "table.status": "Trang thai",
     "table.product": "Ten san pham",
     "table.quantity": "So luong",
     "table.total": "Tong tien",
     "comparison.thisMonth": "Thang nay",
     "comparison.thisYear": "Nam nay",
     "comparison.avgOrder": "Gia trung binh/don",
     "comparison.vsLastMonth": "{change}% so voi thang truoc",
     "comparison.vsLastYear": "{change}% so voi nam ngoai",
     "chart.monthlySpending": "Chi tieu theo thang",
     "chart.dailySpending": "Chi tieu theo ngay",
     "chart.topShops": "Top {count} Shop",
     "export.excel": "Excel (.xlsx)",
     "export.csv": "CSV (.csv)",
     "export.pdf": "In / PDF",
     "budget.title": "Cai dat ngan sach",
     "budget.limit": "Han muc hang thang",
     "budget.threshold": "Canh bao tai (%)",
     "budget.save": "Luu",
     "loading.text": "Dang lay du lieu tu Shopee...",
     "empty.title": "Khong tim thay don hang nao",
     "empty.message": "Thu thay doi bo loc hoac tu khoa tim kiem",
     "noData.text": "Khong co du lieu. Vui long thu lai."
   }
   ```
2. Create `src/i18n/locales/en.json` with English equivalents
3. Audit all HTML files and JS strings for missed translations

### Step 3: Apply i18n to Existing Code (3h)
1. Add `data-i18n="key"` attributes to static HTML elements
2. Replace `formatVND()` calls with `formatCurrency()` throughout
3. Replace hardcoded status text in `content.js` output → keep Vietnamese in API layer, translate in display layer
4. Update `comparison.ts` to use `t()` with params for change percentages
5. Update `insights.ts` templates to use `t()` with params
6. Update `export.ts` headers to use `t()` for column names

### Step 4: Language Switcher UI (1h)
1. Add to header:
   ```html
   <div class="lang-switcher">
     <button data-lang="vi" class="lang-btn active">VI</button>
     <button data-lang="en" class="lang-btn">EN</button>
   </div>
   ```
2. On click: `setLocale(lang)` → `applyTranslations()` → re-render dynamic content
3. Persist choice in `localStorage`

### Step 5: Date Range Picker (3h)
1. Create `src/dashboard/date-range-picker.ts`:
   - Preset buttons: "7 ngay", "Thang nay", "Thang truoc", "3 thang", "Nam nay", "Tuy chinh"
   - Custom mode: two date inputs (from/to)
   - Returns `{ start: Date, end: Date }` to filter logic
2. Create `src/styles/date-picker.css`
3. Replace year + month `<select>` dropdowns in toolbar
4. Keep year/month dropdowns as internal state derivation from date range
5. Modify `applyFilters()`:
   ```ts
   // Instead of year + month, use start/end dates
   if (dateRange.start && dateRange.end) {
     if (!order.deliveryDate) return false;
     const d = new Date(order.deliveryDate);
     if (d < dateRange.start || d > dateRange.end) return false;
   }
   ```
6. Update `state.ts`:
   ```ts
   // Add to AppState
   dateRange: { start: Date | null; end: Date | null };
   ```
7. Wire to chart drill-down (clicking chart bar sets date range)

## Todo List
- [ ] Create i18n core module (t, setLocale, getLocale)
- [ ] Create format.ts (formatCurrency, formatDate)
- [ ] Create vi.json locale file
- [ ] Create en.json locale file
- [ ] Add data-i18n attributes to results.html
- [ ] Add data-i18n attributes to popup.html
- [ ] Add data-i18n attributes to welcome.html
- [ ] Replace formatVND with formatCurrency
- [ ] Update comparison.ts with t()
- [ ] Update table.ts with t()
- [ ] Update charts.ts with t()
- [ ] Update insights.ts with t()
- [ ] Update export.ts headers with t()
- [ ] Create language switcher UI
- [ ] Create date range picker component
- [ ] Create date picker styles
- [ ] Modify applyFilters for date range
- [ ] Update state.ts with dateRange
- [ ] Wire date picker to chart drill-down
- [ ] Write i18n tests
- [ ] Test full app in English
- [ ] Test date range picker with all presets
- [ ] Bump version to 3.1.0

## Success Criteria
- All visible text translatable via locale files
- Language switch instant, no page reload
- English version fully functional and natural-sounding
- Date range picker works with presets and custom ranges
- Chart drill-down works with date range picker
- All Phase 2-3 features work in both languages

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Translation strings missed | High | Low | Audit pass: grep for hardcoded Vietnamese text |
| Category keywords need localization | Medium | Medium | Phase 3 categories stay Vietnamese-keyword-based; English users see translated category names but matching uses original Vietnamese |
| Date picker conflicts with chart drill-down | Medium | Medium | Date picker and chart share same date range state |
| Currency format confusion (VND shown in English) | Low | Low | Clear: app always shows Shopee VN currency, language only changes UI text |

## Security Considerations
- Locale files bundled locally (no external fetch)
- No user data in translation strings
- Language preference in localStorage (non-sensitive)

## Next Steps
- After v3.1: Consider multi-marketplace support (Lazada, Tiki)
- Add more languages as demand grows (Thai, Malay for Shopee TH/MY)
- IndexedDB migration for heavy users with large order history
