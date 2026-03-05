# Phase 03: Store Listing Assets

## Context Links
- Project overview: `docs/project-overview-pdr.md`
- Design guidelines: `docs/design-guidelines.md`
- Manifest: `ShopeeStatX/manifest.json`
- Screenshots: `Screenshots/`

## Overview

- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Goal**: Fix version inconsistency, prepare all Chrome Web Store listing content (descriptions, screenshots, store assets) so the extension can be submitted.

## Key Insights

- `manifest.json` says `1.0.0` but README says `v2.1` — must fix before submission
- Chrome Web Store requires: name, description (short ≤132 chars, detailed ≤16000 chars), category, screenshots (1280×800 or 640×400, min 1, max 5), icon 128×128
- Store listing supports multiple languages — submit both Vietnamese and English
- Existing screenshots in `Screenshots/` may not be 1280×800 — need to verify/retake
- Category: "Productivity" or "Shopping" — Shopping more accurate
- Store does NOT require source maps, test files, or dev-only files

## Requirements

**Functional:**
- Fix `manifest.json` version to `2.1.0`
- Prepare 3-5 screenshots at exactly 1280×800px
- Write short description (≤132 chars) in Vietnamese and English
- Write detailed description (≤16000 chars) in Vietnamese and English
- Prepare store icon (128×128) — already exists at `ShopeeStatX/icons/icon128.png`

**Non-functional:**
- Screenshots should show real data (use demo mode with mock data)
- Descriptions should be honest about what the extension does
- No misleading claims about Shopee affiliation

## Architecture

No code changes needed for most of this phase. Deliverables are:
1. Updated `manifest.json`
2. `store-assets/` directory with text descriptions and screenshot specs
3. Screenshots retaken at correct dimensions

## Store Listing Content

### Short Description (Vietnamese, ≤132 chars)
```
Theo dõi và phân tích toàn bộ lịch sử chi tiêu Shopee của bạn với biểu đồ trực quan. Không cần tài khoản, dữ liệu không rời máy.
```
*(131 chars — fits)*

### Short Description (English, ≤132 chars)
```
Track and analyze your complete Shopee spending history with interactive charts. No account needed, all data stays on your device.
```
*(130 chars — fits)*

### Detailed Description (Vietnamese)
Key sections:
1. Giới thiệu — Shopee không cung cấp công cụ thống kê, ShopeeStatX giải quyết vấn đề đó
2. Tính năng chính (bulleted list)
3. Cách hoạt động — Dual-world pattern, browser session, không có server
4. Bảo mật & quyền riêng tư
5. Lưu ý — chỉ hoạt động trên shopee.vn, cần đăng nhập
6. Liên hệ & mã nguồn (GitHub link)

*(Draft in `store-assets/description-vi.md`)*

### Detailed Description (English)
Same structure as Vietnamese.
*(Draft in `store-assets/description-en.md`)*

## Screenshot Plan

| # | Screen | Content | Notes |
|---|--------|---------|-------|
| 1 | Dashboard overview | Full results page with charts + table visible | Most important — shows the value prop |
| 2 | Bar chart drill-down | Monthly chart → click → daily view | Shows interactivity |
| 3 | Table with filters | Filter chips + sorted table + expanded row | Shows filtering power |
| 4 | Popup | Popup UI on shopee.vn tab | Shows entry point |
| 5 | Excel export | Download dialog or Excel file opened | Shows export feature |

**Capture process:**
1. Run `npm run dev` → open localhost:3000/results.html (uses mock data)
2. Use Chrome DevTools → toggle device toolbar → set to 1280×800
3. Take screenshot of each state
4. OR: load extension unpacked, use real Shopee data (better authenticity)

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Modify | `ShopeeStatX/manifest.json` | Version: `1.0.0` → `2.1.0` |
| Create | `store-assets/description-vi.md` | Vietnamese store description |
| Create | `store-assets/description-en.md` | English store description |
| Create | `store-assets/screenshots/` | 5x PNG at 1280×800 |
| Create | `store-assets/submission-checklist.md` | Step-by-step store submission guide |

## Implementation Steps

### Step 1: Fix manifest version

```json
{
  "version": "2.1.0"
}
```

Also ensure `manifest.json` has no dev-only fields that would cause store rejection.

### Step 2: Verify icon files

- `icons/icon16.png` → 16×16
- `icons/icon48.png` → 48×48
- `icons/icon128.png` → 128×128
- Run: `identify ShopeeStatX/icons/*.png` (ImageMagick) to verify dimensions

### Step 3: Write store descriptions

Create `store-assets/description-vi.md` and `store-assets/description-en.md` with full text ready to paste into the Developer Dashboard.

### Step 4: Take screenshots

Use demo mode (`npm run dev`) + mock data to capture:
1. Set browser window to 1280×800 (exact)
2. Capture each screen state listed above
3. Save as `store-assets/screenshots/screenshot-01-dashboard.png` etc.

### Step 5: Create submission checklist

`store-assets/submission-checklist.md` — step-by-step guide:
- [ ] Create Chrome Developer account ($5 one-time fee)
- [ ] Go to Chrome Web Store Developer Dashboard
- [ ] Click "New Item" → upload zip of `ShopeeStatX/` directory
- [ ] Fill: name, descriptions (VI + EN), category (Shopping)
- [ ] Upload 5 screenshots
- [ ] Enter privacy policy URL (from Phase 2)
- [ ] Enter website URL (GitHub repo)
- [ ] Set distribution: All countries
- [ ] Submit for review (typically 1-3 business days)

### Step 6: Prepare submission zip

The zip should contain ONLY `ShopeeStatX/` contents (not the directory itself):
```bash
cd ShopeeStatX && zip -r ../shopeestatx-v2.1.0.zip . --exclude "*.DS_Store"
```

## Todo List

- [x] Fix `manifest.json` version to `2.1.0`
- [ ] Verify icon dimensions with ImageMagick or browser
- [x] Write `store-assets/description-vi.md`
- [x] Write `store-assets/description-en.md`
- [ ] Take 5 screenshots at 1280×800
- [ ] Save screenshots to `store-assets/screenshots/`
- [x] Create `store-assets/submission-checklist.md`
- [ ] Test zip file loads correctly in Chrome as unpacked extension

## Success Criteria

- `manifest.json` version matches README (`2.1.0`)
- 5 screenshots exist at exactly 1280×800px
- Both description files written and within character limits
- Submission checklist complete
- Test zip installs cleanly in Chrome

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Store rejects due to permissions | High | Permissions justification doc in phase-02; `scripting` must be explained |
| Screenshots show Shopee private data | Medium | Use mock data from demo mode, not real account |
| Extension rejected for Shopee branding | Medium | Ensure name/icon don't imply Shopee affiliation; "not affiliated" disclaimer |
| Review takes > 2 weeks | Low | Normal process; nothing to do but wait |

## Security Considerations

- Submission zip must NOT include `.env`, API keys, or credentials (none exist in this project)
- Ensure `manifest.json` has no `unsafe-eval` or remotely-hosted scripts (it doesn't)
- Review Google's [spam and prohibited content policies](https://developer.chrome.com/docs/webstore/program-policies/)

## Next Steps

- After all 3 phases complete → submit to Chrome Web Store
- Post-publish: update README with Chrome Web Store badge and install link
- Future: localization for other Shopee markets (Thailand, Indonesia, etc.)
