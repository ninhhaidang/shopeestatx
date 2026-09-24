# Design Guidelines

## Design System

All tokens defined as CSS custom properties.
- **Base palette**: `src/styles/variables.css:5-69` (Shopee orange defaults, 30+ tokens)
- **5 theme overrides**: `src/styles/themes.css:5-261` (`:root[data-theme="…"]` blocks for orange/forest/rose/sky/lavender)
- **Aggregator**: `src/dashboard/results.css` `@import`s all 11 style modules
- **Theme picker UI**: `src/dashboard/theme-config.ts` + `src/dashboard/theme-toggle.ts`

## Color Palette

### Base Tokens (`variables.css:5-69`)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#ee4d2d` | Shopee orange (base); overridden per theme |
| `--primary-light` | `#ff6b3d` | Hover/highlight (NOT `#fff3f0`) |
| `--primary-dark` | `#d73211` | Active/pressed state |
| `--primary-gradient` | `linear-gradient(135deg, #ee4d2d, #ff6b3d)` | CTAs, headers |
| `--secondary` | `#ff9671` | Accents |
| `--secondary-light` | `#ffc371` | Soft highlights |
| `--bg-main` | `#f8f9fc` | Page background |
| `--bg-card` | `#ffffff` | Card surface |
| `--bg-sidebar` | `#ffffff` | Sidebar surface |
| `--text-primary` | `#1a202c` | Main body text |
| `--text-secondary` | `#718096` | Labels, secondary info |
| `--text-muted` | `#a0aec0` | Tertiary text, placeholders |
| `--border-color` | `#e2e8f0` | Card/table borders |

### Status Colors (darker for WCAG contrast — `variables.css:30-46`)

| Token | Value | Pair BG | Status Mapping |
|-------|-------|---------|----------------|
| `--success` | `#166534` | `#d1fae5` | Hoàn thành (3) |
| `--info` | `#1d4ed8` | `#dbeafe` | Dang giao (8) |
| `--warning` | `#b45309` | `#fef3c7` | Cho van chuyen (7) |
| `--danger` | `#b91c1c` | `#fee2e2` | Da huy (4) |
| `--pending` | `#6d28d9` | `#ede9fe` | Cho thanh toan (9) |
| `--returned` | `#c2410c` | `#ffedd5` | Tra hang (12) |

### Heatmap Intensity (`variables.css:58-69`)

| Token | Value (orange theme) |
|-------|----------------------|
| `--heatmap-0` | `#ebedf0` (no activity) |
| `--heatmap-1` | `#ffddd2` |
| `--heatmap-2` | `#ffab91` |
| `--heatmap-3` | `#ff6b3d` |
| `--heatmap-4` | `#d73211` (max) |

Each theme has its own heatmap ramp (see Theme System below).

### Shadow Scale (`variables.css:48-55`)

| Token | Value |
|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` |
| `--shadow-lg` | `0 10px 40px rgba(0,0,0,0.1)` |
| `--shadow-xl` | `0 20px 50px rgba(0,0,0,0.12)` |
| `--shadow-glow` | `0 8px 32px rgba(238,77,45,0.15)` (themed) |

### Spacing & Radius (`variables.css:57-67`)

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | `6px` | Badges, chips, small buttons |
| `--radius-md` | `10px` | Inputs, cards |
| `--radius-lg` | `14px` | Large cards, modals |
| `--radius-xl` | `20px` | Hero cards |
| `--radius-full` | `9999px` | Pills, avatars |
| `--spacing-xs` | `4px` | |
| `--spacing-sm` | `8px` | |
| `--spacing-md` | `16px` | |
| `--spacing-lg` | `24px` | |
| `--spacing-xl` | `32px` | |

## Theme System

5 themes defined in `src/styles/themes.css` and `src/dashboard/theme-config.ts`. Selected via `data-theme` attribute on `<html>`, persisted in `localStorage` under `STORAGE_KEYS.THEME`.

| Key | Vietnamese Name | Primary | Primary Dark | Shadow-glow |
|-----|----------------|---------|--------------|-------------|
| `orange` | Cam (mặc định) | `#ff6b3d` | `#ee4d2d` | `rgba(255,107,61,0.2)` |
| `forest` | Rừng | `#22c55e` | `#16a34a` | `rgba(34,197,94,0.2)` |
| `rose` | Hồng | `#f43f5e` | `#e11d48` | `rgba(244,63,94,0.2)` |
| `sky` | Trời Xanh | `#0ea5e9` | `#0284c7` | `rgba(14,165,233,0.2)` |
| `lavender` | Oải Hương | `#a78bfa` | `#8b5cf6` | `rgba(167,139,250,0.2)` |

### Per-Theme Token Override Pattern

Each theme block (`:root[data-theme="…"]`) defines **15 tokens**:

1. `--primary` (varies per theme)
2. `--primary-light`
3. `--primary-dark`
4. `--primary-gradient`
5. `--secondary`
6. `--secondary-light`
7. `--bg-main` (#ffffff, identical across themes)
8. `--bg-card` (#f8f9fa, identical)
9. `--bg-sidebar` (#f1f3f5, identical)
10. `--text-primary` (themed — e.g. forest uses dark green `#14532d`)
11. `--text-secondary` (themed)
12. `--text-muted` (themed)
13. `--border-color` (#dee2e6, identical)
14. `--heatmap-0..4` (5 tokens, theme-colored ramp)
15. 6 shadow tokens (`--shadow-xs/sm/md/lg/xl/glow`, glow is themed)

### Theme Constants (per file location)

| Theme | Block Location |
|-------|----------------|
| `orange` | `themes.css:5-53` |
| `forest` | `themes.css:55-103` |
| `rose` | `themes.css:115-163` |
| `sky` | `themes.css:164-212` |
| `lavender` | `themes.css:214-261` |

### Theme Behavior Notes

- **Backgrounds, status colors, border color**: identical across all 5 themes
- **Text colors**: themed (forest/rose/sky/lavender use deep variants of their hue for WCAG contrast)
- **Heatmap ramp**: distinct per theme (e.g. forest uses `#dcfce7 → #22c55e` green ramp)
- **Shadow-glow**: themed (color tinted to match primary)
- **No dark theme exists** (no `prefers-color-scheme` media query, no dark token set)
- **FOUC prevention**: `theme-toggle.ts` applies theme synchronously before first paint

## Typography

- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- No web fonts (performance + offline reliability)
- Vietnamese text renders correctly on all major OS
- Monospace fallback: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`

## Status Badges

| Status (VI) | Code | Token | Text | BG |
|-------------|------|-------|------|----|
| Hoàn thành | 3 | `--success` | `#166534` | `#d1fae5` |
| Da huy | 4 | `--danger` | `#b91c1c` | `#fee2e2` |
| Cho van chuyen | 7 | `--warning` | `#b45309` | `#fef3c7` |
| Dang giao | 8 | `--info` | `#1d4ed8` | `#dbeafe` |
| Cho thanh toan | 9 | `--pending` | `#6d28d9` | `#ede9fe` |
| Tra hang | 12 | `--returned` | `#c2410c` | `#ffedd5` |
| Khong ro | 0 | `--text-muted` | `#a0aec0` | `#f1f5f9` |

Unknown codes (1, 2, 5, 6, 10, 11) default to neutral badge (gray, `--text-muted`).

## Animations

Defined as `@keyframes` in `src/styles/states.css` and module-specific files. Common animations:

| Name | Usage |
|------|-------|
| `spin` | Loading spinner |
| `pulse` | Loading skeleton |
| `slideIn` | Page entry |
| `slideDown` | Dropdown open |
| `chipIn` | Filter chip appear |
| `fadeIn` | Content reveal |
| `bounce` | Empty state illustration |
| `tooltipFade` | Tooltip show |
| `expandRow` | Table row expand |

## Responsive Breakpoints

Defined in `src/styles/responsive.css`:

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | > 1024px | Full layout, all columns visible |
| Tablet | 768–1024px | Compressed layout |
| Mobile | < 768px | Hidden non-essential columns, stacked controls, full-width inputs |

## Scrollbar

Custom scrollbar styling in `src/styles/layout.css` (not `results.css:1446-1463` — that was a stale reference):
- Thin track, rounded thumb
- Primary color on hover

## Component Patterns

### Summary Cards (`cards.css`)
- Icon + label + value + tooltip on hover
- Subtle shadow, 14px radius
- Themed `--primary` icon background

### Filter Chips (`filters.css`)
- Animated entry (`chipIn` keyframe)
- X button to remove individually
- Active state uses `--primary` background
- Themed text on light `--bg-card`

### Table Rows (`table.css`)
- Expandable with chevron (`expandRow` keyframe)
- Product details in nested list (two-column layout)
- Click-to-filter on cells (year/month/status)
- Order ID is clickable link (opens Shopee order page in new tab)
- Sortable headers with direction arrow

### Charts (`charts.css`)
- Responsive canvas, click-interactive
- Drill-down: click bar month → daily view → click day → filter table
- Theme-aware colors via `cssVar` helper in `theme-toggle.ts`

### Heatmap (`insights.css`)
- 52-week SVG calendar (7 rows × 53 columns)
- Day labels on Y axis (Mon, Wed, Fri)
- Month labels on X axis
- 5 intensity levels (`--heatmap-0..4`)
- Tooltip on hover with order count

### Budget Ring (`insights.css`)
- SVG circular progress ring
- Animated fill on mount
- Threshold exceeded triggers toast (`budget.ts`)

### Insight Card (`insights.css`)
- Max 5 cards shown (top-priority sort)
- Icon + title + value + sub-text
- Categories: trend, top-shop, top-category, comparison, alert

### Shop Loyalty Table (`insights.css`)
- Repeat rate metric
- Loyalty tier badge (VIP/Regular/New, 3+ orders threshold)
- Top shops by order count

### Prediction Card (`insights.css`)
- Linear extrapolation next-month forecast
- Trend line indicator (up/down/stable)
- Confidence interval visual

### Pagination (`table.css`)
- First/prev/next/last buttons
- Page info label
- Items per page selector (20/50/100/all)

### Collapsible Toolbar (`filters.css`)
- Search + date always visible on primary row
- Secondary filters in expandable "More filters" panel
- Filter count badge on toggle button
- `aria-expanded` + `aria-controls` for a11y

### Date Range Picker (`date-picker.css`)
- Preset buttons row: Last 7 days, This month, Last month, 3 months, This year, Custom
- Custom date input panel (from/to)
- Click-to-toggle preset selection

### Theme Toggle (`theme-toggle.ts` + CSS)
- Dropdown selector in header
- 5 theme options with Vietnamese names (Cam, Rừng, Hồng, Trời Xanh, Oải Hương)
- FOUC-safe init (applied before first paint)
- Persists to `localStorage`

## Popup UI (`popup.html` + `popup.css`)

- **Header**: avatar (from user profile) + name greeting
- **Body**: minimal start button, domain check, version display
- **Domain check**: Bắt đầu button enabled only on supported Shopee site
- **Theme**: matches dashboard primary color
- **Footer**: small version text

## Welcome / Onboarding (`welcome.html` + `welcome.css`)

- Full-page welcome screen on first install
- Hero illustration + heading
- Two CTAs: "Start Analysis" (opens dashboard), "Privacy Policy" (opens `privacy.html`)
- Theme-aware background

## Accessibility

- All interactive elements have `aria-label` or visible text
- Dropdowns use `aria-expanded`, `aria-controls`
- Filter chips removable with both click and keyboard
- Color is not the only signal — status badges include text label
- Status color tokens chosen for WCAG AA contrast (darker variants for text, lighter for backgrounds)
- `prefers-reduced-motion` is **partially supported**: rules exist in `src/popup/popup.css:590` and `src/styles/states.css:32`. Full coverage across all interactive modules is a Phase 5/6 roadmap item.
- Keyboard navigation: `/` focuses search, `Esc` clears, `R` refreshes
- Form controls (date inputs) have associated labels

## File Reference

| Concern | File | LOC (approx) |
|---------|------|------|
| Base tokens | `src/styles/variables.css` | 69 |
| 5 themes | `src/styles/themes.css` | 485 |
| Layout shell | `src/styles/layout.css` | 493 |
| Summary cards | `src/styles/cards.css` | 193 |
| Charts | `src/styles/charts.css` | 239 |
| Table | `src/styles/table.css` | 503 |
| Filters + toolbar | `src/styles/filters.css` | 170 |
| Date picker | `src/styles/date-picker.css` | 141 |
| Insights, heatmap, loyalty, budget, predictions | `src/styles/insights.css` | 358 |
| Loading/empty/error states | `src/styles/states.css` | 180 |
| Responsive breakpoints | `src/styles/responsive.css` | 155 |
| Aggregator | `src/dashboard/results.css` | 17 (`@import`s the 11 modules) |
| Theme definitions (TS) | `src/dashboard/theme-config.ts` | 115 |
| Theme picker UI | `src/dashboard/theme-toggle.ts` | 85 |
| Heroicons SVG strings | `src/dashboard/icons.ts` | 17 |
