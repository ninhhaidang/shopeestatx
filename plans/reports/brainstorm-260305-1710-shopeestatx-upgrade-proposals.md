# ShopeeStatX — Upgrade Proposals (Brainstorm Report)

**Date:** 2026-03-05
**Version:** 2.1.0 → 3.0 Roadmap
**Scope:** Major overhaul — all areas

---

## Current State Assessment

### Architecture
- Chrome Extension MV3, vanilla JS with ES modules
- 17 JS files (~1200 LOC), 1 CSS file (1465 LOC), 3 HTML pages
- Chart.js + SheetJS vendored (no CDN)
- Dual-World pattern (MAIN + ISOLATED) for Shopee API access
- `chrome.storage.local` for caching (10MB limit)
- No build system, no tests, no TypeScript, no CI/CD

### Strengths
- Clean modular architecture (state/data/charts/table/filters/comparison/export)
- Privacy-first: zero server, data never leaves browser
- Good interactive UX: drill-down charts, clickable filters, expandable rows
- Well-structured CSS with custom properties
- Responsive design with mobile breakpoints

### Weaknesses
1. **No build system** — no minification, tree-shaking, HMR
2. **No type safety** — vanilla JS, hard to refactor safely
3. **No tests** — zero coverage, manual QA only
4. **Vietnamese only** — limits user base
5. **No dark mode** — common user expectation
6. **Full re-fetch every time** — no incremental/delta sync
7. **10MB storage limit** — heavy users may hit ceiling
8. **SVG icons inline in table.js** — 7 large SVG constants per render cycle
9. **Single 1465-line CSS file** — hard to maintain
10. **No retry/error recovery** for API calls
11. **No offline capability** beyond basic cache
12. **External image in footer** (buymeacoffee CDN) — CSP concern

---

## Upgrade Proposals

### TIER 1: Quick Wins (High Impact / Low Effort)

#### 1.1 Dark Mode
- **What:** CSS-only dark mode using `prefers-color-scheme` + manual toggle
- **How:** Add `:root[data-theme="dark"]` variables, toggle button in header
- **Effort:** ~2 hours. Already have CSS custom properties — just add dark values
- **Impact:** High — most requested feature for dashboards
- **Risk:** Low

#### 1.2 SVG Icon Extraction
- **What:** Move inline SVG constants from `table.js` into a shared `icons.js` module
- **How:** Export named SVG strings, import where needed
- **Effort:** 30 min
- **Impact:** Medium — cleaner table.js, reusable icons
- **Risk:** None

#### 1.3 Incremental Data Fetching
- **What:** Only fetch orders newer than last cached timestamp
- **How:** Store `lastFetchedAt` timestamp, pass to API offset logic, merge with existing cache
- **Effort:** ~3 hours
- **Impact:** High — faster refresh for returning users (seconds vs minutes)
- **Risk:** Medium — need merge logic, handle deleted/modified orders

#### 1.4 Export CSV/PDF
- **What:** Add CSV export (trivial) and PDF export (using jsPDF or browser print)
- **How:** CSV = manual string generation. PDF = `window.print()` with print-specific CSS
- **Effort:** ~2 hours
- **Impact:** Medium — users requested alternative formats
- **Risk:** Low

#### 1.5 Keyboard Shortcuts Enhancement
- **What:** Add more shortcuts: `D` toggle dark mode, `E` export, arrow keys for pagination
- **Effort:** 30 min
- **Impact:** Low-medium — power user feature
- **Risk:** None

---

### TIER 2: UX & Features (High Impact / Medium Effort)

#### 2.1 Internationalization (i18n)
- **What:** Multi-language support (Vietnamese + English)
- **How:** Create `locales/vi.json` and `locales/en.json`, replace all hardcoded strings with `t('key')` function
- **Architecture:**
  ```
  locales/
    vi.json    # {"totalOrders": "Don hang", ...}
    en.json    # {"totalOrders": "Orders", ...}
  i18n.js      # t() function, locale detection, switcher
  ```
- **Effort:** ~6 hours (extract ~100 strings, build i18n module, add language switcher)
- **Impact:** High — opens to international Shopee markets (MY, TH, PH, SG, TW, BR)
- **Risk:** Medium — need to handle number/currency formatting per locale

#### 2.2 Date Range Picker
- **What:** Replace year/month dropdowns with a date range picker
- **How:** Build minimal date range picker (no library) or use lightweight `litepicker`
- **Effort:** ~4 hours
- **Impact:** High — much more flexible filtering ("last 30 days", custom ranges)
- **Risk:** Low — additive, keep dropdowns as fallback

#### 2.3 Spending Budget / Goals
- **What:** Set monthly spending limit, show progress bar, alert when approaching
- **How:** Settings panel → store budget in `chrome.storage.local` → render progress bar on summary card
- **UI:** Progress ring on "Thang nay" card, color changes green→yellow→red
- **Effort:** ~4 hours
- **Impact:** High — core value prop (spending awareness), differentiator
- **Risk:** Low

#### 2.4 Spending Heatmap (Calendar View)
- **What:** GitHub-style contribution heatmap showing daily spending intensity
- **How:** Build custom SVG heatmap (52 weeks × 7 days grid), color = spending amount
- **Effort:** ~6 hours
- **Impact:** High — visually striking, reveals spending patterns at a glance
- **Risk:** Low — pure visualization, no data model changes

#### 2.5 Improved Loading UX
- **What:** Skeleton screens instead of spinner, progressive rendering
- **How:** Show skeleton cards/charts while data loads, render summary first, then charts, then table
- **Effort:** ~3 hours
- **Impact:** Medium — perceived performance improvement
- **Risk:** Low

---

### TIER 3: Data & Analytics (High Impact / Medium-High Effort)

#### 3.1 Auto Product Categorization
- **What:** Classify orders into categories (Electronics, Fashion, Food, Beauty, Home, etc.)
- **How:** Keyword-based classifier using product name + shop name
  ```js
  const CATEGORIES = {
    'Dien tu': ['laptop', 'dien thoai', 'tai nghe', 'sac', 'cap', 'usb', ...],
    'Thoi trang': ['ao', 'quan', 'giay', 'dep', 'tui', 'balo', ...],
    'Thuc pham': ['banh', 'keo', 'tra', 'cafe', 'do an', ...],
    ...
  };
  ```
- **Visualization:** New doughnut chart "Chi tieu theo danh muc", category filter
- **Effort:** ~8 hours (classifier + UI + new chart)
- **Impact:** High — key insight users want
- **Risk:** Medium — classification accuracy depends on keyword coverage

#### 3.2 Trend Analysis & Insights
- **What:** Auto-generated insights like "Ban da chi nhieu hon 45% thang nay", "Shop X la noi ban mua nhieu nhat"
- **How:** Calculate trends (moving average, month-over-month), generate natural language summaries
- **Effort:** ~6 hours
- **Impact:** High — makes data actionable
- **Risk:** Low

#### 3.3 Spending Predictions
- **What:** "Du kien chi tieu thang nay: X VND" based on current pace
- **How:** Linear extrapolation: `(current_spending / days_elapsed) * days_in_month`
- **Effort:** ~2 hours
- **Impact:** Medium — useful combined with budget feature
- **Risk:** Low

#### 3.4 Shop Loyalty Analysis
- **What:** Show repeat purchase patterns, "Frequent shops", "New shops this month"
- **How:** Group by shop, calculate frequency, first/last purchase date
- **Effort:** ~4 hours
- **Impact:** Medium — interesting insight
- **Risk:** Low

---

### TIER 4: Technical Stack (Foundation for Scale)

#### 4.1 Build System (Vite)
- **What:** Add Vite as build tool for development and production
- **Why:** HMR for dev, minification + tree-shaking for prod, CSS modules support
- **How:**
  ```
  package.json         # vite, typescript deps
  vite.config.ts       # Chrome extension config (crxjs/vite-plugin or manual)
  src/                  # Move source files
  dist/                 # Build output = loadable extension
  ```
- **Key decision:** Use `@crxjs/vite-plugin` for seamless Chrome extension dev experience
- **Effort:** ~6 hours (setup + migrate files)
- **Impact:** High — enables TypeScript, CSS modules, faster dev cycle
- **Risk:** Medium — need to maintain Dual-World injection pattern

#### 4.2 TypeScript Migration
- **What:** Convert all .js to .ts with strict mode
- **How:** Incremental: rename files, add types, fix errors. Start with `state.ts` (easiest), then `utils.ts`, etc.
- **Key types:**
  ```ts
  interface Order {
    orderId: string;
    name: string;
    productCount: number;
    subTotal: number;
    status: string;
    statusCode: StatusCode;
    shopName: string;
    deliveryDate: string | null;
    orderMonth: number | null;
    orderYear: number | null;
  }

  type StatusCode = 0 | 3 | 4 | 7 | 8 | 9 | 12;
  type ShopMetric = 'amount' | 'orders' | 'products';
  ```
- **Effort:** ~8 hours (17 files, ~1200 LOC)
- **Impact:** High — catch bugs at compile time, better DX, safer refactoring
- **Risk:** Low — incremental migration, Vite handles TS natively
- **Note:** `content.js` stays as JS (IIFE in MAIN world, no module support)

#### 4.3 IndexedDB Storage
- **What:** Replace `chrome.storage.local` with IndexedDB for large datasets
- **Why:** chrome.storage.local = 10MB limit. IndexedDB = virtually unlimited
- **How:** Use `idb` wrapper library (~1KB), store orders in object store with indices
- **Effort:** ~4 hours
- **Impact:** Medium-high — unlocks users with thousands of orders
- **Risk:** Medium — migration from existing chrome.storage.local cache

#### 4.4 Unit Testing (Vitest)
- **What:** Add tests for core logic (filters, comparison, utils, data processing)
- **How:** Vitest (works natively with Vite), test pure functions first
- **Priority test targets:**
  - `filters.js` — sortOrders, filter logic
  - `comparison.js` — renderTimeComparison calculations
  - `utils.js` — formatVND, escapeHtml
  - `content.js` — parseStatusLabel, order parsing
- **Effort:** ~8 hours for meaningful coverage (~70%)
- **Impact:** High — confidence for refactoring during major overhaul
- **Risk:** Low

#### 4.5 CSS Modularization
- **What:** Split 1465-line `results.css` into component-scoped CSS modules
- **How:** With Vite, use CSS modules or just split into logical files:
  ```
  styles/
    variables.css      # CSS custom properties + dark theme
    layout.css         # Header, toolbar, footer
    cards.css          # Summary + comparison cards
    charts.css         # Chart containers
    table.css          # Table, pagination, expandable rows
    filters.css        # Filter chips, active filters
    states.css         # Loading, empty, no-data states
    responsive.css     # Media queries
  ```
- **Effort:** ~3 hours
- **Impact:** Medium — maintainability
- **Risk:** None

---

### TIER 5: Infrastructure & Distribution

#### 5.1 CI/CD Pipeline (GitHub Actions)
- **What:** Automated lint, test, build, and release workflow
- **How:**
  ```yaml
  # .github/workflows/ci.yml
  - Lint (ESLint/Biome)
  - Type check (tsc --noEmit)
  - Unit tests (vitest)
  - Build extension (vite build)
  - Upload artifact (.zip)
  ```
- **Effort:** ~3 hours
- **Impact:** Medium — quality gate, automated releases
- **Risk:** Low

#### 5.2 Chrome Web Store Auto-Publish
- **What:** Auto-publish to Chrome Web Store on tagged releases
- **How:** `chrome-webstore-upload-cli` in GitHub Actions
- **Effort:** ~2 hours (after CI setup)
- **Impact:** Medium — streamlined release process
- **Risk:** Low

#### 5.3 Multi-marketplace Support (Future)
- **What:** Support Lazada, Tiki, Sendo (Vietnamese e-commerce)
- **How:** Abstract data fetching layer, marketplace-specific API adapters
- **Effort:** ~20+ hours per marketplace
- **Impact:** Very high — major differentiator
- **Risk:** High — each marketplace has different API structure, auth model
- **Recommendation:** Defer until v3.x is stable. Design adapter interface now.

---

## Recommended Roadmap

### Phase 1: Foundation (v2.5) — "Developer Experience"
**Goal:** Set up modern tooling without changing user-facing behavior.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Vite build system (4.1) | 6h | P0 |
| 2 | TypeScript migration (4.2) | 8h | P0 |
| 3 | CSS modularization (4.5) | 3h | P1 |
| 4 | SVG icon extraction (1.2) | 0.5h | P1 |
| 5 | Unit tests — core logic (4.4) | 8h | P1 |
| 6 | CI/CD pipeline (5.1) | 3h | P2 |

**Milestone:** All existing features work identically, but codebase is TypeScript + Vite with tests.

### Phase 2: Quick Wins (v2.6) — "Polish"
**Goal:** Ship high-impact features with minimal risk.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Dark mode (1.1) | 2h | P0 |
| 2 | Incremental fetch (1.3) | 3h | P0 |
| 3 | Export CSV/PDF (1.4) | 2h | P1 |
| 4 | Improved loading UX (2.5) | 3h | P1 |
| 5 | Keyboard shortcuts (1.5) | 0.5h | P2 |

### Phase 3: Analytics Power-Up (v3.0) — "Insights"
**Goal:** Transform from "data viewer" to "spending intelligence tool".

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | Spending heatmap (2.4) | 6h | P0 |
| 2 | Auto categorization (3.1) | 8h | P0 |
| 3 | Budget/goals (2.3) | 4h | P0 |
| 4 | Trend analysis + insights (3.2) | 6h | P1 |
| 5 | Spending predictions (3.3) | 2h | P1 |
| 6 | Shop loyalty analysis (3.4) | 4h | P2 |
| 7 | IndexedDB storage (4.3) | 4h | P2 |

### Phase 4: Internationalization (v3.1) — "Go Global"
**Goal:** Expand beyond Vietnamese market.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1 | i18n framework (2.1) | 6h | P0 |
| 2 | English translation | 2h | P0 |
| 3 | Date range picker (2.2) | 4h | P1 |
| 4 | Multi-marketplace adapter design (5.3) | 4h | P2 |
| 5 | Chrome Web Store auto-publish (5.2) | 2h | P2 |

---

## Impact/Effort Matrix

```
HIGH IMPACT
     |
     |  [Budget/Goals]    [Dark Mode]     [Incremental Fetch]
     |  [Heatmap]         [i18n]          [TypeScript]
     |  [Categorization]  [Vite]          [Trends/Insights]
     |
     |  [IndexedDB]       [Date Range]    [Unit Tests]
     |  [CSV/PDF]         [CSS Split]     [CI/CD]
     |
     |  [Multi-market]    [Skeleton UX]   [Keyboard]
     |  [Predictions]     [SVG Extract]   [Shop Loyalty]
     |
LOW  |___________________________________________________
     LOW EFFORT                              HIGH EFFORT
```

---

## Key Technical Decisions Needed

1. **Build tool:** Vite + `@crxjs/vite-plugin` vs Vite + manual Chrome extension setup?
   - Recommendation: `@crxjs/vite-plugin` — handles manifest, HMR, content script injection automatically

2. **UI Framework:** Stay vanilla or adopt Preact/Svelte?
   - Recommendation: Stay vanilla for now. Current architecture is clean enough. Framework adds bundle size, learning curve, and complexity for a single-page dashboard. Reconsider if adding settings page, multi-page routing, or complex state management.

3. **CSS approach:** CSS modules vs Tailwind vs plain split?
   - Recommendation: Plain split (already using CSS custom properties effectively). CSS modules if want component scoping later.

4. **Categorization approach:** Keyword-based vs ML?
   - Recommendation: Keyword-based. ML is overkill for this use case, adds huge bundle size. Keyword classifier with user override is practical and accurate enough.

5. **content.js bundling:** content.js runs in MAIN world (no module support)
   - Must stay as IIFE. Can use Vite to build separately with `build.rollupOptions.input`

---

## Success Metrics

- **v2.5:** Build time < 2s, test coverage > 60%, zero TypeScript errors
- **v2.6:** Time-to-data < 5s (incremental), dark mode adoption > 30%
- **v3.0:** Users engage with heatmap/categories, budget feature reduces user spending awareness gap
- **v3.1:** English users > 10% of total, Chrome Web Store reviews > 4.5 stars

---

## Unresolved Questions

1. Does Shopee API v4 support `since` timestamp for incremental fetching, or must we always paginate from offset 0?
2. Should dark mode preference sync across devices via `chrome.storage.sync` or stay local?
3. For i18n, should we support Shopee marketplace-specific languages (Thai, Malay, etc.) in phase 4 or defer?
4. Is `@crxjs/vite-plugin` still maintained and compatible with MV3 in 2026? Need to verify.
5. Budget notifications — should they use `chrome.notifications` API (needs permission) or just in-dashboard alerts?
