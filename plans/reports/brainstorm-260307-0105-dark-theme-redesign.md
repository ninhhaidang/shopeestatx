# Brainstorm Report: Dark Theme Redesign

**Date:** 2026-03-07
**Type:** brainstorm
**Status:** Completed

## Problem Statement

User反馈 current dark theme sử dụng màu không đẹp. Cần cải thiện để tạo cảm giác premium, modern cho Shopee spending tracker Chrome extension.

## User Preferences

| Option | Choice |
|--------|--------|
| Heatmap | Amber (#f59e0b) |
| Style | Modern Dark |
| Primary | Amber (#f59e0b) |

## Current Issues

1. **Flat & Monotonous** — backgrounds cùng blue-gray family, không có chiều sâu
2. **Inconsistent** — 10+ hardcoded hex values phá vỡ CSS variables
3. **Weak Hierarchy** — text colors đều cool-toned
4. **Harsh Heatmap** — Level 0 nearly invisible, Level 4 neon orange
5. **Primary too vibrant** — `#ff6b3d` feels like warning color

## Recommended Solution: "Obsidian Ember"

### New Color Palette

```css
:root[data-theme="dark"] {
  /* Primary - Amber */
  --primary: #f59e0b;
  --primary-light: #fbbf24;
  --primary-dark: #d97706;
  --primary-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  --secondary: #fbbf24;
  --secondary-light: #fcd34d;

  /* Backgrounds - Slightly warmer, deeper */
  --bg-main: #0d0f14;
  --bg-card: #16181f;
  --bg-sidebar: #16181f;

  /* Text - Warmer white */
  --text-primary: #f0f2f5;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  /* Border - Subtle */
  --border-color: #2a2f3a;

  /* Accent Colors (adjusted for amber) */
  --success: #34d399;
  --success-bg: #064e3b;
  --info: #60a5fa;
  --info-bg: #1e3a5f;
  --warning: #fbbf24;
  --warning-bg: #451a03;
  --danger: #f87171;
  --danger-bg: #450a0a;

  /* Heatmap - Amber gradient */
  --heatmap-0: #1a1d26;
  --heatmap-1: #3d2e14;
  --heatmap-2: #6b4a1a;
  --heatmap-3: #a07020;
  --heatmap-4: #f59e0b;

  /* Shadows - Layered for depth */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.7);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.8);
  --shadow-glow: 0 8px 32px rgba(245, 158, 11, 0.2);
}
```

### Design Improvements

1. **Subtle Gradients** — Thay flat colors bằng subtle gradients
2. **Layered Shadows** — Tạo chiều sâu với layered dark shadows
3. **Glassmorphism** — Cho modals/dropdowns (optional, performance-aware)
4. **8px Border Radius** — Modern feel
5. **color-scheme: dark** — Thêm vào HTML để browser hiển thị đúng
6. **meta theme-color** — Thêm để toolbar hiển đúng màu với dark theme

### Web Design Guidelines Compliance

| Rule | Status |
|------|--------|
| `color-scheme: dark` on `:root[data-theme="dark"]` | Needs fix |
| `<meta name="theme-color">` in HTML | Needs fix |

### Implementation Scope

| File | Changes |
|------|---------|
| `src/styles/dark-theme.css` | Full redesign với new palette + color-scheme |
| `src/dashboard/results.html` | Thêm meta theme-color |

### Risks

- **Low** — CSS-only change
- Test tất cả components với new colors
- Verify heatmap readability

## Success Criteria

- [ ] Dark theme cảm giác premium và modern
- [ ] Text dễ đọc, không mỏi mắt
- [ ] Heatmap hiển thị rõ ràng với amber gradient
- [ ] Consistent sử dụng CSS variables
- [ ] Build passes

## Next Steps

Tạo implementation plan để apply new dark theme colors.

---

## Unresolved Questions

1. None — đã có đầy đủ requirements từ user
