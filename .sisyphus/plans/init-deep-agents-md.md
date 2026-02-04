# Tạo AGENTS.md cho ShopeeStatX

## TL;DR

> **Mục tiêu**: Tạo file AGENTS.md ở root để document knowledge base cho AI agents
> 
> **Deliverables**:
> - `./AGENTS.md` (root) - ~100 lines
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - single task
> **Critical Path**: Task 1

---

## Context

### Original Request
User yêu cầu chạy `/init-deep` để tạo hierarchical AGENTS.md files.

### Analysis Summary
- **Project type**: Chrome Extension (Manifest V3)
- **Stack**: Vanilla JavaScript + Chart.js + SheetJS
- **Size**: ~7 JS files, ~1200 lines code
- **Structure**: Simple, single module `ShopeeStats/`
- **Test infrastructure**: None
- **Build system**: None (vendored libraries)

### Scoring Decision
| Directory | Score | Decision |
|-----------|-------|----------|
| Root (.) | - | ALWAYS create |
| ShopeeStats/ | 8 | SKIP (parent covers, project nhỏ) |

**Kết luận**: Chỉ cần 1 AGENTS.md ở root.

---

## Work Objectives

### Core Objective
Tạo file AGENTS.md chứa knowledge base cho AI agents làm việc với codebase.

### Concrete Deliverables
- `./AGENTS.md` - Root knowledge base file

### Definition of Done
- [x] File `./AGENTS.md` tồn tại với nội dung hoàn chỉnh
- [x] Nội dung ≤ 150 lines
- [x] Không có thông tin generic (chỉ specific cho project này)

### Must Have
- Overview về project
- Structure diagram
- WHERE TO LOOK table
- Architecture flow
- Conventions specific cho project
- Anti-patterns / NEVER do

### Must NOT Have (Guardrails)
- Generic JavaScript advice
- Obvious information (e.g., "HTML is for markup")
- Duplicate info từ README.md
- Emoji overload

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO
- **Agent-Executed QA**: ALWAYS

---

## TODOs

- [x] 1. Tạo file AGENTS.md ở root

  **What to do**:
  1. Tạo file `./AGENTS.md` với nội dung bên dưới
  2. Verify file tồn tại và có nội dung đúng

  **Must NOT do**:
  - Không thêm emojis
  - Không copy README.md content
  - Không viết hơn 150 lines

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Task đơn giản, chỉ tạo 1 file
  - **Skills**: `[]`
    - Không cần skill đặc biệt

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - README.md - Context về project (KHÔNG copy, chỉ reference)
  - ShopeeStats/manifest.json - Extension config
  - ShopeeStats/content.js - Core data fetching logic
  - ShopeeStats/results.js - Dashboard logic

  **AGENTS.md Content** (copy exactly):
  
  ```markdown
  # PROJECT KNOWLEDGE BASE

  **Generated:** 2026-02-04
  **Tech Stack:** Chrome Extension (Manifest V3) | Vanilla JS | Chart.js | SheetJS

  ## OVERVIEW

  Chrome Extension thống kê chi tiêu Shopee. Fetch data từ Shopee API → cache local → visualize với charts và tables. Sử dụng Main World injection để bypass CORS.

  ## STRUCTURE

  ```
  shopeestatx/
  ├── ShopeeStats/           # Extension core (load vào Chrome)
  │   ├── manifest.json      # Entry point - Manifest V3
  │   ├── background.js      # Service worker - mở results tab
  │   ├── popup.js           # Click icon → trigger analysis
  │   ├── content.js         # MAIN world - fetch Shopee API
  │   ├── bridge.js          # ISOLATED world - message relay
  │   ├── results.js         # Dashboard logic (~1000 lines)
  │   ├── results.html/css   # Dashboard UI
  │   ├── popup.html/css     # Popup UI
  │   ├── chart.min.js       # Vendored Chart.js
  │   ├── xlsx.min.js        # Vendored SheetJS
  │   └── icons/             # Extension icons
  ├── Documents/             # Multi-language docs (vi/en)
  └── Screenshots/           # UI previews
  ```

  ## WHERE TO LOOK

  | Task | Location | Notes |
  |------|----------|-------|
  | Modify data fetching | `ShopeeStats/content.js` | `getOrders()` function, runs in MAIN world |
  | Add new charts | `ShopeeStats/results.js` | `renderCharts()` ~line 638 |
  | Change filters | `ShopeeStats/results.js` | `applyFilters()` ~line 255 |
  | Add permissions | `ShopeeStats/manifest.json` | `permissions` / `host_permissions` |
  | Export logic | `ShopeeStats/results.js` | `exportToExcel()` ~line 871 |
  | New Shopee regions | `ShopeeStats/manifest.json` | Add to `host_permissions` |

  ## ARCHITECTURE

  ### Data Flow
  ```
  popup.js (click) 
    → results.html?fetch=true
      → inject bridge.js (ISOLATED)
      → inject content.js (MAIN)
        → fetch Shopee API (uses browser cookies)
        → postMessage → bridge → chrome.runtime
          → results.js receives data
            → cache to chrome.storage.local
            → render charts + table
  ```

  ### Dual-World Pattern (CRITICAL)
  - **content.js**: Runs in MAIN world → access page's fetch context & cookies
  - **bridge.js**: Runs in ISOLATED world → relay messages to extension
  - **Why**: Bypass CORS, leverage user's authenticated session

  ## CONVENTIONS

  ### Code Style
  - Vanilla JS (ES6+), no framework
  - No build step, no npm
  - Libraries vendored as `.min.js`
  - Vietnamese UI strings hardcoded

  ### Currency Handling
  ```javascript
  // Shopee API returns amount * 100000
  const actualVND = apiAmount / 100000;
  ```

  ### Order Status Codes
  | Code | Status | Include in Total |
  |------|--------|------------------|
  | 3 | Hoàn thành | YES |
  | 4 | Đã hủy | NO |
  | 7 | Vận chuyển | YES |
  | 8 | Đang giao | YES |
  | 9 | Chờ thanh toán | YES |
  | 12 | Trả hàng | NO |

  ## ANTI-PATTERNS (THIS PROJECT)

  ### NEVER
  - Store/transmit user data externally → extension is stateless
  - Include cancelled (4) or returned (12) orders in spending totals
  - Bypass Shopee authentication → requires user login
  - Use CDN for libraries → must be vendored locally

  ### ALWAYS
  - Divide API amounts by 100000 for VND
  - Use `chrome.scripting.executeScript` for dynamic injection
  - Validate timestamps (2020-2030 range) when parsing order_id

  ### Timestamp Fallbacks (content.js:80-104)
  ```
  Priority: shipping.tracking_info.ctime
         → status.update_time
         → order_id first 10 digits (validate year)
  ```

  ## COMMANDS

  ```bash
  # Install extension
  # 1. Open chrome://extensions/
  # 2. Enable "Developer mode"
  # 3. Click "Load unpacked" → select ShopeeStats/

  # No build/test commands - vanilla JS project
  ```

  ## NOTES

  - No test suite: Manual testing in browser
  - No CI/CD: Manual release via GitHub Releases
  - Shopee API: `v4/order/get_all_order_and_checkout_list` (may change)
  - Data scope: Only displays in current session, not persisted
  - Excel export: Only exports filtered data, not all data
  ```

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify AGENTS.md created successfully
    Tool: Bash (cat/head)
    Preconditions: None
    Steps:
      1. Run: cat ./AGENTS.md | head -20
      2. Assert: Output contains "# PROJECT KNOWLEDGE BASE"
      3. Assert: Output contains "Chrome Extension"
      4. Run: wc -l ./AGENTS.md
      5. Assert: Line count < 150
    Expected Result: File exists with correct header and within size limit
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `docs: add AGENTS.md knowledge base for AI agents`
  - Files: `AGENTS.md`
  - Pre-commit: None

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `docs: add AGENTS.md knowledge base for AI agents` | AGENTS.md | cat AGENTS.md |

---

## Success Criteria

### Verification Commands
```bash
cat ./AGENTS.md | head -5  # Expected: # PROJECT KNOWLEDGE BASE
wc -l ./AGENTS.md          # Expected: < 150
```

### Final Checklist
- [x] AGENTS.md exists at root
- [x] Content is project-specific (not generic)
- [x] No emoji overload
- [x] Under 150 lines
