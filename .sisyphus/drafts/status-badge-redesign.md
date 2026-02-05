# Draft: Status Badge Redesign

## Requirements (confirmed)

- **Icon type**: SVG Icons (custom, embedded in CSS)
- **Icon source**: Heroicons (Tailwind's official icon set)
- **Icon size**: 16px (medium, balanced visibility)
- **Color differentiation**: YES - Status 7 and 8 need different colors
- **Visual style**: Soft/Pastel (current style - pastel backgrounds with colored text)
- **Status 7 color**: Yellow/Amber (#f59e0b) - "waiting" semantic
- **Status 12 color**: Red-Orange (#ea580c) - moves from current orange to avoid conflict with new Status 7

## Current Status Badges

| Status         | Code | Current Color | Current Issue    |
| -------------- | ---- | ------------- | ---------------- |
| Hoàn thành     | 3    | Green         | No icon          |
| Đã hủy         | 4    | Red           | No icon          |
| Chờ vận chuyển | 7    | Blue          | Same color as 8  |
| Đang giao      | 8    | Blue          | Same color as 7  |
| Chờ thanh toán | 9    | Purple        | No icon          |
| Trả hàng       | 12   | Orange        | No icon          |
| Không rõ       | 0    | N/A           | Missing entirely |

## Technical Decisions

- SVG icons will be embedded as data URIs or inline SVG in CSS/JS
- Keep current pastel background + colored text approach
- Need to pick a new color for status 7 or 8

## Open Questions (RESOLVED)

All questions answered during interview.

## Code Verification (from Metis review)

**Badge Rendering Location**: `results.js` lines 472-494
```javascript
// Status badge with icon (current implementation)
let statusIcon = '';
let statusClass = `status-${order.statusCode}`;
switch (order.statusCode) {
  case 3: statusIcon = '✓'; break; // Hoàn thành
  case 4: statusIcon = '✗'; statusClass += ' status-cancelled'; break;
  case 7: case 8: statusIcon = '🚚'; statusClass += ' status-shipping'; break;
  case 12: statusIcon = '↩'; statusClass += ' status-return'; break;
  default: statusIcon = '●';
}
// Badge HTML: <span class="status-badge ${statusClass}">${statusIcon} ${status}</span>
```

**Current Icons**: Unicode characters, NOT SVG
**Badge HTML**: `<span class="status-badge status-N">icon text</span>`
**CSS Location**: `results.css` lines 938-976 (uses CSS variables)

**Implementation Approach**:
- Option A: Inline SVG in JS template literal (change results.js)
- Option B: CSS ::before pseudo-element with data URI (CSS-only, minimal JS change)

## Scope Boundaries

- INCLUDE: All 7 status types (3, 4, 7, 8, 9, 12, 0)
- INCLUDE: SVG icons + color updates
- EXCLUDE: Other UI changes outside status badges
