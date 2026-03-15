# Plan: Table Alignment & UX Fix

## Overview
- **Priority:** High
- **Status:** Completed
- **Description:** Fix alignment issues between `<th>` and `<td>` in orders table, improve STT column UX

## Current Issues
1. **Alignment:** Cột Tổng tiền và Số lượng chưa đúng căn lề
2. **STT Column:** Icon mũi tên đè lên số, layout bị xô lệch khi hover

## Requirements

### 1. Column Alignment Fixes
| Cột | Yêu cầu |
|-----|----------|
| Tổng tiền | `text-align: right` + thêm `padding-right` |
| Số lượng | `text-align: center` |
| Các cột còn lại | `text-align: left` + đồng bộ `padding-left` |

### 2. STT Column UX
- `<th>` STT: `text-align: center`
- `<td>` STT: `position: relative; display: flex; align-items: center; justify-content: center`
- Icon: `position: absolute; right: 8px; opacity: 0; transition: opacity 0.2s`
- Hover: `tr:hover .expand-icon { opacity: 1 }`

## Related Files
- `src/styles/table.css` - Main CSS
- `src/dashboard/results.html` - Table HTML structure
- `src/dashboard/table.ts` - Table rendering logic

## Implementation Steps

### Step 1: Update HTML for column classes
- Add class `col-amount` to Tổng tiền column
- Add class `col-quantity` to Số lượng column
- Add class `col-stt` to STT column

### Step 2: Update table.css - Column alignment
```css
/* Cột Tổng tiền */
th.col-amount, td.col-amount {
  text-align: right;
  padding-right: 20px;
}

/* Cột Số lượng */
th.col-quantity, td.col-quantity {
  text-align: center;
}

/* Cột STT */
th.col-stt {
  text-align: center;
}

td.col-stt {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Step 3: Update STT icon positioning
```css
td.col-stt .expand-icon {
  position: absolute;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

tr:hover td.col-stt .expand-icon {
  opacity: 1;
}
```

### Step 4: Update table.ts to add column classes
- Add `col-stt` class to STT `<td>`
- Add `col-amount` class to Tổng tiền `<td>`
- Add `col-quantity` class to Số lượng `<td>`

## Success Criteria
- [ ] Cột Tổng tiền căn phải, text không dính lề
- [ ] Cột Số lượng căn giữa
- [ ] Cột STT căn giữa, số đứng cố định
- [ ] Icon mũi tên ẩn mặc định, hiện khi hover
- [ ] Không giật layout khi icon hiện/ẩn

## Risk Assessment
- Low risk: Chỉ CSS và thêm class vào HTML/TS

## Next Steps
Proceed to implementation after approval
