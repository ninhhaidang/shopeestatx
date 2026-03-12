# UI/UX Review - ShopeeStatX Dashboard

**Date:** 2026-03-12
**Reviewer:** ui-ux-pro-max
**Project:** ShopeeStatX Chrome Extension (Dashboard)

---

## Executive Summary

Dự án có codebase UI tương đối tốt với multi-theme support, responsive layout, và skeleton loading. Tuy nhiên có một số vấn đề về **accessibility**, **code quality** (inline styles, hardcoded colors), và **design consistency**.

**Overall Score:** 7/10

---

## Critical Issues (Cần fix ngay)

### 1. Accessibility - Missing ARIA Labels

**Vấn đề:** Các button không có `aria-label` cho screen readers.

```html
<!-- ❌ Hiện tại -->
<button id="btnRefresh" class="btn-refresh" title="Làm mới dữ liệu">&#8635;</button>

<!-- ✅ Nên có -->
<button id="btnRefresh" class="btn-refresh" aria-label="Làm mới dữ liệu">&#8635;</button>
```

**Files cần fix:**
- `src/dashboard/results.html` - Refresh button, theme selector, export buttons

### 2. Search Box - Missing Label

**Vấn đề:** Input tìm kiếm không có `<label>` (dùng placeholder thay thế - không đúng semantic).

```html
<!-- ❌ Hiện tại -->
<input type="text" id="searchBox" placeholder="Tìm kiếm đơn hàng..." />

<!-- ✅ Nên có -->
<label for="searchBox" class="visually-hidden">Tìm kiếm đơn hàng, sản phẩm, shop</label>
<input type="text" id="searchBox" placeholder="Tìm kiếm đơn hàng, sản phẩm, shop..." />
```

### 3. Keyboard Navigation - Focus States

**Vấn đề:** Một số elements thiếu visible focus states cho keyboard navigation.

**Cần thêm:**
```css
/* Thêm vào layout.css hoặc states.css */
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## Medium Issues (Nên cải thiện)

### 4. Inline Styles trong HTML

**Vấn đề:** `results.html` có nhiều inline styles, khó maintain.

```html
<!-- ❌ Inline styles -->
<div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
  <img style="width:40px;height:40px;border-radius:50%;object-fit:cover;">

<!-- ✅ Nên tách ra class -->
.header-controls { display: flex; align-items: center; justify-content: space-between; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
```

**Files cần refactor:**
- `src/dashboard/results.html` (lines 39-61, 44-48)

### 5. Hardcoded Colors (Không dùng CSS Variables)

**Vấn đề:** Một số chỗ dùng hardcoded colors thay vì variables.

```css
/* ❌ Hardcoded */
background: white;
color: #1a1a2e;

/* ✅ Dùng variables */
background: var(--bg-card);
color: var(--text-primary);
```

**Tìm thấy trong:**
- `src/styles/cards.css` line 11: `background: white;`
- `src/styles/cards.css` line 122: `background: white;`
- `src/styles/table.css` line 138: `background: #f3e5f5;` (status-9)
- `src/styles/table.css` line 148: `background: #fed7aa;` (status-12)

### 6. Touch Target Size

**Vấn đề:** Một số buttons có thể quá nhỏ cho touch devices.

```css
/* ❌ Refresh button 40x40px */
.btn-refresh {
  width: 40px;
  height: 40px;
}

/* ✅ Nên >= 44x44px theo WCAG */
.btn-refresh {
  width: 44px;
  height: 44px;
}
```

### 7. Font Typography Chưa Tối ưu

**Vấn đề:** Đang dùng system fonts, chưa có dedicated dashboard font.

```css
/* Hiện tại */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;

/* ✅ Nên thêm Fira Code/Fira Sans như khuyến nghị cho dashboard */
font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

---

## Good Practices (Giữ lại)

### ✅ Multi-theme Support
- 6 themes: light, dark, forest, rose, sky, lavender
- CSS variables well-organized
- Dark mode override đầy đủ

### ✅ Responsive Layout
- Sử dụng `auto-fit` và `minmax()` cho grids
- Sticky toolbar
- Mobile-friendly pagination

### ✅ Skeleton Loading
- Có shimmer animation
- FOUC prevention với theme script

### ✅ Performance
- Inline SVG backgrounds (không cần HTTP requests)
- CSS variables cho reusability

### ✅ Visual Feedback
- Hover states với transform
- Toast notifications
- Loading spinners

---

## Recommendations

### Priority 1 (Fix ngay)
1. Thêm `aria-label` cho icon buttons
2. Thêm label cho search input
3. Thêm focus-visible states

### Priority 2 (Cải thiện)
4. Refactor inline styles → CSS classes
5. Thay hardcoded colors → CSS variables
6. Tăng touch targets lên 44px minimum

### Priority 3 (Tùy chọn)
7. Thêm Fira Sans font cho dashboard
8. Thêm `prefers-reduced-motion` media query
9. Consider `role="button"` cho clickable divs

---

## Summary Table

| Category | Status | Score |
|----------|--------|-------|
| Accessibility | ✅ Đã fix | 8/10 |
| Touch & Interaction | ✅ Đã fix | 9/10 |
| Visual Design | ✅ Tốt | 8/10 |
| Code Quality | ✅ Đã fix | 8/10 |
| Performance | ✅ Tốt | 9/10 |
| Dark Mode | ✅ Xuất sắc | 9/10 |
| Responsive | ✅ Tốt | 8/10 |

---

## Fixes Applied (2026-03-12)

### ✅ Fixed Issues

1. **Accessibility - aria-labels** - Thêm aria-label cho:
   - Refresh button
   - Export dropdown + menu items
   - Language buttons (VI/EN)
   - Theme selector

2. **Accessibility - search label** - Thêm `<label class="visually-hidden">` cho search input

3. **Accessibility - focus states** - Thêm CSS focus-visible trong `states.css`

4. **Accessibility - reduced motion** - Thêm `@media (prefers-reduced-motion: reduce)`

5. **Code quality - inline styles** - Chuyển inline styles thành classes:
   - `header-controls`, `header-brand`, `header-actions`
   - `user-avatar`, `user-name`

6. **Code quality - hardcoded colors** - Chuyển sang CSS variables:
   - `summary-item`, `comparison-card` dùng `var(--bg-card)`
   - Thêm `--pending`, `--pending-bg`, `--returned`, `--returned-bg` variables

7. **Touch targets** - Tăng `.btn-refresh` từ 40px lên 44px

---

## Files Reviewed

- `src/dashboard/results.html`
- `src/styles/themes.css`
- `src/styles/layout.css`
- `src/styles/cards.css`
- `src/styles/table.css`
- `src/styles/dark-theme.css`
