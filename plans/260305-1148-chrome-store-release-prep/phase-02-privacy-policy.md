# Phase 02: Privacy Policy Page

## Context Links
- Project overview: `docs/project-overview-pdr.md`
- Manifest: `ShopeeStatX/manifest.json`
- Existing popup: `ShopeeStatX/popup.html`

## Overview

- **Priority**: P1
- **Status**: Pending
- **Effort**: 1h
- **Goal**: Create a privacy policy page accessible both inside the extension and via public URL (GitHub Pages), satisfying Chrome Web Store review requirements.

## Key Insights

- Chrome Web Store requires a privacy policy URL for extensions that access user data or use permissions like `scripting`, `storage`
- The URL must be publicly accessible — `chrome-extension://` URLs are NOT valid for the store listing form
- Best approach: host `privacy.html` content on GitHub Pages (`ninhhaidang.github.io/shopeestatx/privacy` or similar) OR use a raw GitHub URL
- Simplest option: create `privacy.html` in repo root (not in `ShopeeStatX/`) → accessible via GitHub Pages at `https://ninhhaidang.github.io/shopeestatx/privacy.html`
- Also add `privacy.html` inside `ShopeeStatX/` for in-extension linking from welcome/popup pages

## Requirements

**Functional:**
- Publicly accessible URL for Chrome Web Store submission
- Covers: data collected, data storage, data sharing, permissions used, contact info
- Bilingual: Vietnamese primary, English secondary (or separate sections)
- Linkable from `welcome.html` and `popup.html`

**Non-functional:**
- Simple, readable layout — no complex styling needed
- Under 150 LOC HTML

## Architecture

```
Repository root:
  public/privacy.html        → served via GitHub Pages (public URL for store)

ShopeeStatX/:
  privacy.html               → in-extension version (linked from welcome + popup)
  (can be same content or redirect to public URL)
```

**Alternative simpler approach:** single `privacy.html` inside `ShopeeStatX/`, link to GitHub raw/Pages URL in store listing. The in-extension file IS the content; GitHub Pages hosts the public version.

**Recommended:** Keep one source in `ShopeeStatX/privacy.html`, copy/symlink to `public/privacy.html` for GitHub Pages. No duplication.

## Content Outline

### Privacy Policy — ShopeeStatX

**1. Tổng quan / Overview**
- Extension chỉ chạy cục bộ, không có server
- Không thu thập, lưu trữ, hay chia sẻ dữ liệu cá nhân với bên thứ ba

**2. Dữ liệu được truy cập / Data Accessed**
- Lịch sử đơn hàng Shopee (đọc qua API Shopee bằng session trình duyệt)
- Chỉ đọc khi user chủ động bấm "Bắt đầu phân tích"
- Không lưu trên server — chỉ lưu tạm trong `chrome.storage.local` trên máy người dùng

**3. Quyền truy cập / Permissions**
| Permission | Lý do sử dụng |
|-----------|--------------|
| `activeTab` | Đọc URL tab hiện tại để kiểm tra đang ở shopee.vn |
| `storage` | Lưu cache dữ liệu đơn hàng trên máy người dùng |
| `scripting` | Inject script vào tab Shopee để gọi API với cookie trình duyệt |
| `https://shopee.vn/*` | Giới hạn extension chỉ hoạt động trên shopee.vn |

**4. Dữ liệu không được chia sẻ / No Data Sharing**
- Không gửi dữ liệu ra ngoài
- Không có analytics, tracking, hay telemetry
- Không có tài khoản người dùng

**5. Lưu trữ dữ liệu / Data Storage**
- `chrome.storage.local` — dữ liệu chỉ tồn tại trên máy người dùng
- Xóa khi gỡ cài đặt extension hoặc xóa dữ liệu Chrome

**6. Liên hệ / Contact**
- GitHub Issues: link to repo
- Email: developer contact

**7. Cập nhật / Updates**
- Ngày cập nhật policy gần nhất

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Create | `ShopeeStatX/privacy.html` | In-extension privacy policy |
| Create | `public/privacy.html` | Public version for GitHub Pages (same content) |
| Modify | `ShopeeStatX/popup.html` | Add "Chính sách bảo mật" link in footer |

## Implementation Steps

### Step 1: Create `ShopeeStatX/privacy.html`

- Simple, clean HTML — no JS needed
- Inline minimal CSS or link to a `privacy.css` (< 50 LOC)
- All content in Vietnamese with English translation in parentheses for key terms
- Include `<meta charset="UTF-8">` and proper title
- "Last updated: 2026-03-05"

### Step 2: Create `public/privacy.html`

- Same content as `ShopeeStatX/privacy.html`
- Add note at top: "This extension is not affiliated with Shopee"
- Ensure GitHub Pages can serve it (no Jekyll conflicts — add `.nojekyll` if needed)

### Step 3: Add link in popup.html

In the popup footer (alongside the "Hướng dẫn" link from Phase 1):
```html
<a id="btnPrivacy" href="#">Chính sách bảo mật</a>
```
Wire in popup.js → `chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') })`

### Step 4: Enable GitHub Pages

- In repo Settings → Pages → Source: `main` branch, `/ (root)` or `/public`
- Verify: `https://ninhhaidang.github.io/shopeestatx/privacy.html` loads correctly
- This URL goes into the Chrome Web Store listing form

## Todo List

- [x] Create `ShopeeStatX/privacy.html` with all 7 sections
- [x] Create `public/privacy.html` (same content)
- [x] Add `.nojekyll` to repo root if not present
- [x] Enable GitHub Pages in repo settings
- [x] Verify public URL loads correctly
- [x] Add privacy link in `popup.html` footer
- [x] Wire click in `popup.js`
- [x] Add privacy link in `welcome.html` (Phase 1 page)

## Success Criteria

- `ShopeeStatX/privacy.html` renders correctly inside extension
- Public URL (`https://ninhhaidang.github.io/shopeestatx/privacy.html`) is accessible
- All 7 content sections present and accurate
- Links from popup and welcome page work
- Chrome Web Store accepts the URL during submission

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| GitHub Pages not enabled | High | Simple settings toggle — document in Phase 3 |
| Privacy policy URL changes | Medium | Use custom domain or stable GitHub Pages URL |
| Content inaccurate → store rejection | High | Review checklist against Google's policy requirements |

## Security Considerations

- Privacy policy must accurately describe actual data behavior — misrepresentation = store ban
- Verify that `chrome.storage.local` data is indeed never sent externally (it is — confirmed in codebase)

## Next Steps

- Public URL from this phase → needed for Phase 3 (store listing form)
- welcome.html (Phase 1) should link to `privacy.html`
