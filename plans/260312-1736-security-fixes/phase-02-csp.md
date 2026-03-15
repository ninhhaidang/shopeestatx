# Phase 2: Content Security Policy

**Priority:** High
**Status:** Pending

## Overview

Add `content_security_policy` to manifest.json to restrict script sources and prevent XSS via inline scripts.

## Implementation

Update `src/manifest.json` to add CSP:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

## Constraints
- Cannot use `'unsafe-eval'` - triggers install-time error
- Cannot use external scripts (no CDN)
- All scripts must be bundled locally (already done - Chart.js, SheetJS are vendored)

## Success Criteria
- [ ] Extension loads without CSP warnings
- [ ] No inline scripts execute
- [ ] manifest.json validates successfully

<!-- Updated: Validation Session 1 - Confirmed: Strict CSP (Recommended) -->
