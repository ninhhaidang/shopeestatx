# Security Fixes Implementation Plan - ShopeeStatX

**Date:** 2026-03-12
**Type:** Implementation Plan
**Project:** ShopeeStatX Chrome Extension

---

## Executive Summary

Created detailed 5-phase plan to fix security issues identified in code review:
- XSS vulnerability in innerHTML usage
- Missing Content Security Policy
- Chart.js memory leaks
- Missing error handling
- Accessibility issues

## Research Findings

### XSS Prevention (2 sources)
- Use `escapeHtml()` utility before inserting user data via `innerHTML`
- Prefer `innerText`/`textContent` for non-HTML content
- DOMPurify available if complex HTML sanitization needed

### CSP Best Practices
- Default policy: `script-src 'self'; object-src 'self'`
- Chrome enforces minimum: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`
- Cannot add `'unsafe-eval'` - causes install-time error
- All scripts already vendored locally ✓

### Chart.js Cleanup
- Call `chart.destroy()` to release canvas resources
- Add `beforeunload`/`unload` event listeners for page cleanup

---

## Plan Structure

```
plans/260312-1736-security-fixes/
├── plan.md                    # Overview
├── phase-01-xss-prevention.md # Critical - escapeHtml
├── phase-02-csp.md           # High - manifest.json
├── phase-03-chart-cleanup.md # High - memory leak
├── phase-04-error-handling.md # High - try-catch
└── phase-05-accessibility.md  # Medium - ARIA labels
```

## Files to Modify

| Phase | Files |
|-------|-------|
| 1 | filters.ts, table.ts, insights.ts, budget.ts, heatmap.ts, shop-loyalty.ts |
| 2 | manifest.json |
| 3 | charts.ts |
| 4 | data.ts, budget.ts |
| 5 | results.html OR results.ts |

## Dependencies
- Phases 1-5: Can run in parallel after Phase 1 (XSS is foundation)

## Success Criteria Summary
- [ ] All user data escaped before innerHTML
- [ ] CSP policy added to manifest
- [ ] Chart cleanup on page unload
- [ ] All storage operations wrapped in try-catch
- [ ] All dropdowns have aria-label

---

## Unresolved Questions
1. Should we add DOMPurify for complex HTML (insights), or is escapeHtml sufficient?
2. Should we track categoryChart instance for cleanup in charts.ts?
3. Should error messages be localized (i18n) or use fixed Vietnamese strings?
