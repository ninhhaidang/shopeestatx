# Code Review — Chrome Store Release Prep

**Date:** 2026-03-05
**Reviewer:** code-reviewer agent
**Plan:** `plans/260305-1148-chrome-store-release-prep/`
**Score: 6.5 / 10**

---

## Scope

| File | Type |
|------|------|
| `ShopeeStatX/background.js` | Modified |
| `ShopeeStatX/popup.html` | Modified |
| `ShopeeStatX/popup.js` | Modified |
| `ShopeeStatX/popup.css` | Modified |
| `ShopeeStatX/welcome.html` | New |
| `ShopeeStatX/welcome.css` | New |
| `ShopeeStatX/privacy.html` | New |
| `ShopeeStatX/manifest.json` | Modified |

---

## Overall Assessment

Implementation covers the intended scope well — onboarding page, privacy policy, footer links, and first-run listener are all present and structurally sound. One **critical** MV3 violation will cause the welcome page buttons to silently fail. One **high** accessibility contrast failure on footer links. Everything else is solid.

---

## Critical Issues

### [CRITICAL] Inline `<script>` in `welcome.html` violates MV3 CSP

**File:** `ShopeeStatX/welcome.html` lines 125–137

MV3 extension pages (any HTML served from `chrome-extension://`) enforce `script-src 'self'` by default. Inline `<script>` blocks are **not** `'self'` — they are blocked by this policy. Chrome will silently discard the entire inline script block.

**Impact:** All three click handlers in `welcome.html` will be dead:
- `btnOpenShopee` — clicking "Mở Shopee ngay" does nothing
- `privacyLink` — privacy link in the permissions section does nothing
- `footerPrivacy` — footer privacy link does nothing

This is confirmed Chrome Extension MV3 behavior. The popup correctly avoids this by using `<script src="popup.js">`.

**Fix:** Extract the inline script to a new file `ShopeeStatX/welcome.js` and reference it:
```html
<!-- Replace the inline <script>...</script> block with: -->
<script src="welcome.js"></script>
```
Create `welcome.js` with the three event listener blocks. No other changes needed.

---

## High Priority

### [HIGH] `footer-help-link` fails WCAG AA contrast

**File:** `ShopeeStatX/popup.css` line 337

`color: var(--text-muted)` = `#a0aec0` on background `#f8f9fc` gives a contrast ratio of **2.14:1**. WCAG AA requires 4.5:1 for normal text (11px). Chrome Web Store review considers accessibility a signal.

**Fix:** Use `var(--text-secondary)` (#718096) instead — gives ~4.6:1 contrast:
```css
.footer-help-link {
  color: var(--text-secondary); /* was var(--text-muted) */
```

### [HIGH] `welcome.css` exceeds 150 LOC target

**File:** `ShopeeStatX/welcome.css` — **188 lines** (target: ≤150)

Per project rules, files over 200 LOC should be split; the brief specified ≤150 for this file. While not a hard failure, it's 25% over the stated target. Some redundant one-liner rules (`.hero-inner`, `.content`, `.steps-list`) could be consolidated.

---

## Medium Priority

### [MEDIUM] Duplicate privacy click handlers in `welcome.html`

Two separate elements (`#privacyLink` and `#footerPrivacy`) both open `privacy.html`. While not a bug, this means two nearly identical event listeners. Both serve the same function — could share a common CSS class and a single delegated handler. Low priority given KISS principle, but worth noting.

### [MEDIUM] `onMessage` listener missing `return true` for async cases

**File:** `ShopeeStatX/background.js` lines 10–14

The listener doesn't call `sendResponse`, so no `return true` is needed here. However, if any caller in the future sends a message expecting a response, this listener will silently close the channel. The current usage (one-way fire-and-forget for `openResults`) is fine — annotate with a comment to prevent future misuse.

### [MEDIUM] Version jump 1.0.0 → 2.1.0 skips 2.0.0

**File:** `ShopeeStatX/manifest.json`

Jumping from 1.0.0 to 2.1.0 without a 2.0.0 intermediate is unusual. Chrome Web Store reviewers may question this during review. Not a blocker, but consider whether 2.0.0 better reflects this as a major UI/onboarding addition.

---

## Low Priority

### [LOW] `href="#"` on footer links causes scroll-to-top flash

**File:** `ShopeeStatX/popup.html` lines 38, 40

`e.preventDefault()` is correctly called in `popup.js`, so navigation is stopped. However in a 380px fixed-height popup, the scroll-to-top is imperceptible. No action required — noted for awareness.

### [LOW] `privacy.html` uses inline `<style>` instead of external CSS

Inconsistent with `welcome.html` (which uses `welcome.css`). This is fine for a simple static policy page — inline styles are valid and keep it self-contained. Not recommended to change (YAGNI).

### [LOW] `hero` negative margin trick in `welcome.css`

```css
.hero { margin: 0 -20px 40px; }
```
This works but is fragile — tied to the parent `padding: 0 20px`. If container padding changes, the hero bleed breaks. A minor structural coupling to document.

---

## Edge Cases from Scouting

- **`tabs[0]` undefined in popup.js**: If `chrome.tabs.query` returns an empty array (edge case in some contexts), `tabs[0].url` throws. Existing code uses `|| ''` fallback — correctly handled.
- **`onInstalled` with `reason === 'update'`**: Welcome page intentionally only fires on `'install'`, not `'update'`. This is correct — re-showing onboarding on every update would be annoying. No issue.
- **`chrome.tabs.create` in popup without `tabs` permission**: `chrome.tabs.create` does not require the `tabs` permission (only reading tab metadata does). `activeTab` in popup context (user clicked extension icon) covers `tabs.query` + `url` access. Correct.
- **`chrome.runtime.getURL` usage**: All usages pass string literals (`'welcome.html'`, `'privacy.html'`, `'results.html'`) — no dynamic construction, no XSS vector.
- **Remote CDN image in popup.html**: `https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png` — pre-existing before this diff. MV3 does not restrict `img-src` in extension pages by default. Not introduced by this change.

---

## Positive Observations

- `background.js`: Clean, minimal service worker. `onInstalled` reason check is correct (`'install'` only).
- `popup.js`: Proper use of `chrome.runtime.getURL()` for all internal page navigation — no hardcoded `chrome-extension://` URLs.
- `privacy.html`: Comprehensive, well-structured privacy policy. Self-contained with inline styles. No scripts (correct for a static page).
- `welcome.html`: Good semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`), proper `lang="vi"` attribute, `alt` text on logo image.
- `welcome.css`: Clean responsive grid, 188 lines is dense but readable. Responsive breakpoint at 600px is appropriate.
- `popup.css`: `.footer-help-links` is minimal and correctly placed — KISS principle respected.
- No `eval()`, no remote scripts loaded, no `innerHTML` with user data anywhere.

---

## Recommended Actions

| Priority | Action | File |
|----------|--------|------|
| CRITICAL | Extract inline `<script>` to `welcome.js`, reference externally | `welcome.html`, create `welcome.js` |
| HIGH | Change `.footer-help-link` color to `var(--text-secondary)` | `popup.css` |
| HIGH | Reduce `welcome.css` toward 150 LOC (consolidate one-liners) | `welcome.css` |
| MEDIUM | Consider version 2.0.0 instead of 2.1.0 | `manifest.json` |

---

## Plan TODO Status

Based on `plan.md`:
- Phase 1 (Onboarding): Implemented — **1 fix required** (inline script extraction)
- Phase 2 (Privacy Policy): Implemented — looks complete, no blockers
- Phase 3 (Store Listing Assets): Not reviewed (outside scope of this diff; `store-assets/` and `privacy.css` not present)

---

## Unresolved Questions

1. `welcome.css` is 188 lines — is the ≤150 target a hard requirement or a guideline? If hard, which sections should be trimmed?
2. Is version `2.1.0` intentional (skipping `2.0.0`), or should it be `2.0.0` for this first public release?
3. Phase 3 (`store-assets/`, store descriptions, screenshots) — not present in working tree. Is this out of scope for this review pass?
