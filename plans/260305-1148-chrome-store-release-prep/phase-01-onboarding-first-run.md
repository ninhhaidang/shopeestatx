# Phase 01: Onboarding / First-run Experience

## Context Links
- Architecture: `docs/system-architecture.md`
- Code standards: `docs/code-standards.md`
- Background.js: `ShopeeStatX/background.js`
- Popup: `ShopeeStatX/popup.html`, `ShopeeStatX/popup.js`

## Overview

- **Priority**: P1
- **Status**: Pending
- **Effort**: 2h
- **Goal**: New users who install the extension see a welcome page that explains what it does, what permissions are needed and why, and how to get started.

## Key Insights

- Chrome fires `chrome.runtime.onInstalled` in service worker — reason `install` = first install, `update` = version update
- Opening a tab from `onInstalled` is the standard pattern for extension onboarding
- Extension currently has no onboarding at all — popup jumps straight to "Bắt đầu phân tích" with no context for new users
- High uninstall rate risk: users who don't understand what they installed will remove it immediately

## Requirements

**Functional:**
- On first install: automatically open `welcome.html` in new tab
- `welcome.html` explains: what extension does, why permissions are needed, step-by-step how to use
- Link to `privacy.html` from welcome page
- Popup: add a small "?" or "Hướng dẫn" link that reopens welcome page
- Do NOT show welcome page on extension update (only on fresh install)

**Non-functional:**
- Match existing visual style (Shopee orange, same CSS vars pattern)
- Mobile-friendly (welcome tab can be viewed on any screen)
- No new JS dependencies

## Architecture

```
chrome.runtime.onInstalled (reason: 'install')
  └── background.js → chrome.tabs.create({ url: 'welcome.html' })

welcome.html
  ├── welcome.css (Shopee orange design, same token pattern as results.css)
  └── welcome.js (minimal: open shopee.vn on CTA click, track step highlights)

popup.html
  └── Add footer link "Hướng dẫn" → chrome.tabs.create({ url: 'welcome.html' })
```

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Modify | `ShopeeStatX/background.js` | Add `onInstalled` listener |
| Modify | `ShopeeStatX/popup.html` | Add "Hướng dẫn" footer link |
| Modify | `ShopeeStatX/popup.js` | Wire "Hướng dẫn" click → open welcome.html |
| Create | `ShopeeStatX/welcome.html` | Onboarding page |
| Create | `ShopeeStatX/welcome.css` | Styles (keep under 150 LOC) |

## Implementation Steps

### Step 1: background.js — detect first install

```js
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});
```

### Step 2: welcome.html — structure

Sections:
1. **Hero**: Logo + name + tagline "Theo dõi chi tiêu Shopee của bạn"
2. **What it does**: 3 cards — Fetch orders, Analyze, Export (icons + short text)
3. **Permissions explained**: Table or cards explaining `activeTab`, `storage`, `scripting`, `shopee.vn` and WHY each is needed (critical for user trust)
4. **How to use**: Numbered steps with screenshots placeholders
   1. Đăng nhập Shopee
   2. Mở extension, click "Bắt đầu phân tích"
   3. Chờ dữ liệu tải xong
   4. Dùng bộ lọc và biểu đồ
5. **Privacy note**: "Dữ liệu không rời khỏi máy bạn" + link to privacy.html
6. **CTA**: Button "Mở Shopee ngay" → opens shopee.vn in new tab

### Step 3: welcome.css

- Use same CSS custom property naming pattern as `results.css`
- Primary: `#ee4d2d`, font: system font stack
- Keep under 150 LOC
- Responsive: works on 768px+

### Step 4: popup.html — add footer link

Add below the existing buttons:
```html
<div class="popup-footer">
  <a id="btnHelp" href="#">Hướng dẫn sử dụng</a>
</div>
```

### Step 5: popup.js — wire help link

```js
document.getElementById('btnHelp').addEventListener('click', function(e) {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
});
```

## Todo List

- [x] Add `onInstalled` listener to `background.js`
- [x] Create `welcome.html` with all 6 sections
- [x] Create `welcome.css` (under 150 LOC)
- [x] Add footer link in `popup.html`
- [x] Wire help link in `popup.js`
- [x] Test: install extension fresh → welcome tab opens automatically
- [x] Test: popup "Hướng dẫn" → opens welcome tab
- [x] Test: update extension → welcome tab does NOT open

## Success Criteria

- Fresh install → `welcome.html` opens automatically in new tab
- All 6 sections render correctly at 1280px and 768px widths
- Permissions section clearly explains why each permission is needed
- "Mở Shopee ngay" CTA works
- Privacy policy link resolves (after Phase 2 complete)
- popup.html shows "Hướng dẫn" link that opens welcome page

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| welcome.css grows too large | Medium | Hard limit 150 LOC, use CSS vars |
| Onboarding tab annoying for dev reload | Low | Only fires on `reason === 'install'`, not reload |
| welcome.html not listed in manifest | High | Add to `web_accessible_resources` if needed (check MV3 behavior) |

## Security Considerations

- No user input in welcome.html — no XSS risk
- Links open via `chrome.tabs.create`, not `window.open`
- Privacy policy link is internal (`chrome-extension://...`) — no external tracking

## Next Steps

- After complete: Phase 2 (privacy.html) provides the link used in welcome.html
- Screenshots from results dashboard can be embedded in welcome.html (Phase 3 work)
