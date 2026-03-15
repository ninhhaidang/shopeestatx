# Design Guidelines

## Design System

All tokens defined as CSS custom properties in `results.css:9-58`.

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#ee4d2d` | Shopee orange — CTAs, active states, highlights |
| `--primary-dark` | `#d73211` | Hover states on primary |
| `--primary-light` | `#fff3f0` | Backgrounds, soft highlights |
| `--success` | `#00b14f` | Completed status badge |
| `--warning` | `#f59e0b` | Pending/in-transit status |
| `--danger` | `#ef4444` | Cancelled, error states |
| `--info` | `#3b82f6` | Info badges |
| `--text-primary` | `#1a1a2e` | Main body text |
| `--text-secondary` | `#666` | Labels, secondary info |
| `--border` | `#e8e8e8` | Card/table borders |
| `--bg` | `#f5f5f5` | Page background |

## Typography

- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- No web fonts (performance + offline reliability)
- Vietnamese text renders correctly on all major OS

## Status Badges

| Status | Color |
|--------|-------|
| Hoan thanh (3) | Green `--success` |
| Da huy (4) | Red `--danger` |
| Cho van chuyen (7) | Orange `--warning` |
| Dang giao (8) | Blue `--info` |
| Cho thanh toan (9) | Yellow |
| Tra hang (12) | Purple |
| Khong ro (0) | Gray |

## Animations (9 keyframes)

| Name | Usage |
|------|-------|
| spin | Loading spinner |
| pulse | Loading skeleton |
| slideIn | Page entry |
| slideDown | Dropdown open |
| chipIn | Filter chip appear |
| fadeIn | Content reveal |
| bounce | Empty state illustration |
| tooltipFade | Tooltip show |
| expandRow | Table row expand |
| slideDown | Collapsible panel open |

## Spacing & Shape

- Border radius: `--radius` (cards), `--radius-sm` (badges/chips), `--radius-lg` (modals)
- Shadow scale: `--shadow-sm`, `--shadow`, `--shadow-lg`
- Consistent padding via CSS variables — never hardcoded values

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|---------|
| Desktop | > 1024px | Full layout, all columns visible |
| Tablet | 768–1024px | Compressed layout |
| Mobile | < 768px | Hidden non-essential columns, stacked controls, full-width inputs |

## Scrollbar

Custom scrollbar styling applied globally (`results.css:1446-1463`):
- Thin track, rounded thumb
- Primary color on hover

## Component Patterns

- **Summary cards**: icon + label + value + tooltip on hover
- **Filter chips**: animated entry, X button to remove individually
- **Table rows**: expandable with chevron, product details in nested list
- **Charts**: responsive canvas, click-interactive
- **Pagination**: first/prev/next/last buttons + page info label
- **Collapsible toolbar**: search + date always visible, secondary filters in expandable panel

## Popup UI

- Minimal: logo, version, start button, domain warning
- Matches Shopee orange branding
- Disabled state clearly communicated when not on shopee.vn
