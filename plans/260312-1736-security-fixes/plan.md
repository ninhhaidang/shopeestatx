# Security Fixes Implementation Plan - ShopeeStatX

**Date:** 2026-03-12
**Status:** Completed
**Priority:** High

## Overview

Fix 5 security/code quality issues identified in code review:
1. XSS Vulnerability - user data via innerHTML without sanitization
2. Missing CSP - no content security policy in manifest.json
3. Memory Leak - Chart.js instances not cleaned up on page unload
4. Missing Error Handling - API/storage operations lack proper try-catch
5. Accessibility - missing ARIA labels in dropdowns

## Research Summary

### XSS Prevention
- Prefer `innerText`/`textContent` over `innerHTML` for user data
- Use `escapeHtml()` utility (exists in utils.ts) before inserting via innerHTML
- For complex HTML: use DOMPurify with limited ALLOWED_TAGS

### CSP for Chrome Extensions
- Default policy: `script-src 'self'; object-src 'self'`
- Minimum required: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`
- Cannot add `'unsafe-eval'` - triggers install-time error

### Chart.js Cleanup
- Call `chart.destroy()` before page unload or chart recreation
- Add `window.addEventListener('beforeunload', cleanup)` to release canvas resources

---

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Completed | XSS Prevention - Add escapeHtml to all innerHTML calls |
| 2 | ✅ Completed | CSP - Add content_security_policy to manifest.json |
| 3 | ✅ Completed | Memory Leak - Add Chart.js cleanup on page unload |
| 4 | ✅ Completed | Error Handling - Add try-catch to storage operations |
| 5 | ✅ Completed | Accessibility - Add ARIA labels to dropdowns |

---

## Dependencies
- Phase 1 → Phase 5 (independent, can run in parallel after Phase 1)

## Key Files to Modify
- `src/dashboard/filters.ts`
- `src/dashboard/table.ts`
- `src/dashboard/insights.ts`
- `src/dashboard/budget.ts`
- `src/dashboard/heatmap.ts`
- `src/dashboard/date-range-picker.ts`
- `src/dashboard/predictions.ts`
- `src/dashboard/comparison.ts`
- `src/dashboard/shop-loyalty.ts`
- `src/dashboard/results.ts`
- `src/dashboard/charts.ts`
- `src/manifest.json`

## Risks
- Some existing innerHTML may be safe (static strings) - verify each case

## Validation Log

| Question | Option Selected |
|----------|-----------------|
| XSS Prevention | escapeHtml (Recommended) |
| CSP Level | Strict CSP (Recommended) |
| Error Messages | i18n System |

## Next Steps
→ See [phase-01-xss-prevention.md](phase-01-xss-prevention.md)
