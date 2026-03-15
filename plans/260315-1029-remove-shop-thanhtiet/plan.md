# Plan: Remove Shop thân thiết Section

## Overview
- **Priority:** Low
- **Status:** Completed
- **Description:** Remove "Shop thân thiết" section from dashboard as it's not necessary

## Current State
- Exists in `src/dashboard/results.html` (lines 216-222)
- Logic in `src/dashboard/shop-loyalty.ts`
- Translation in `src/i18n/locales/vi.json` and `en.json`

## Implementation

### Step 1: Remove HTML
File: `src/dashboard/results.html`
```html
<!-- Remove lines 216-222 -->
<details class="loyalty-section">
  <summary data-i18n="loyalty.title">Shop thân thiết</summary>
  ...
</details>
```

### Step 2: (Optional) Remove Logic
- File: `src/dashboard/shop-loyalty.ts` - can keep for future use
- No changes needed if keeping for later

### Step 3: (Optional) Remove Translations
- `src/i18n/locales/vi.json`: remove "loyalty.title"
- `src/i18n/locales/en.json`: remove "loyalty.title"

## Related Files
- `src/dashboard/results.html` - HTML to remove
- `src/dashboard/shop-loyalty.ts` - Logic (optional)
- `src/i18n/locales/vi.json` - Translation (optional)
- `src/i18n/locales/en.json` - Translation (optional)

## Success Criteria
- [ ] Shop thân thiết section removed from UI
- [ ] Build passes
- [ ] No broken references
