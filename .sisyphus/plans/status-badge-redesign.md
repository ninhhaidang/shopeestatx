# Status Badge Redesign - Icons & Color Differentiation

## TL;DR

> **Quick Summary**: Add SVG icons (Heroicons Outline) to all status badges and differentiate colors between status 7 (Chờ vận chuyển) and status 8 (Đang giao) for better visual distinction.
> 
> **Deliverables**:
> - Updated `results.js` with inline SVG icons for all 7 status types
> - Updated `results.css` with new color scheme (status 7 → yellow, status 0 → gray)
> - All badges visually distinct with icons + unique colors
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential (CSS depends on knowing final icon structure)
> **Critical Path**: Task 1 (Icons in JS) → Task 2 (Colors in CSS) → Task 3 (Manual QA)

---

## Context

### Original Request
User asked about current status colors/icons and wanted a proposed redesign. After interview, confirmed: add Heroicons Outline SVG icons, differentiate status 7 and 8 colors.

### Interview Summary
**Key Discussions**:
- **Icon type**: SVG icons (Heroicons Outline, 16px)
- **Icon approach**: Inline SVG in JavaScript template literals
- **Visual style**: Keep soft/pastel (pastel bg + colored text)
- **Color change**: Status 7 → Yellow/Amber, Status 8 → Blue (stays)
- **Test strategy**: Manual testing only

**Research Findings**:
- Badge rendering in `results.js` lines 472-494
- Current icons are Unicode chars (✓, ✗, 🚚, ↩, ●)
- Badge HTML: `<span class="status-badge status-N">icon text</span>`
- CSS in `results.css` lines 938-976 uses CSS variables

### Metis Review
**Identified Gaps** (addressed):
- Heroicons variant → Confirmed: Outline
- SVG implementation → Confirmed: Inline in JS
- Exact hex codes → See color spec below
- Status 0 handling → Adding gray styling

---

## Work Objectives

### Core Objective
Replace Unicode status icons with Heroicons Outline SVG icons and add color differentiation between status 7 (waiting to ship) and status 8 (in transit).

### Concrete Deliverables
- `ShopeeStats/results.js` - Updated switch statement with inline SVG icons
- `ShopeeStats/results.css` - New CSS rules for status 7, status 12, status 0

### Definition of Done
- [x] All 7 status types display distinct SVG icons
- [x] Status 7 (Chờ vận chuyển) has yellow/amber color scheme
- [x] Status 8 (Đang giao) has blue color scheme (different from 7)
- [x] Status 0 (Không rõ) has gray fallback styling
- [x] Icons are 16px and visually aligned with text

### Must Have
- SVG icons from Heroicons Outline (MIT license, vendored inline)
- 16px icon size, vertically centered with text
- Pastel background + colored text (current style preserved)
- All 7 statuses: 3, 4, 7, 8, 9, 12, 0

### Must NOT Have (Guardrails)
- No icons outside status badges (filters, charts, headers)
- No badge shape/padding/font changes (only icon + color)
- No hover animations or transitions on badges
- No external icon dependencies (CDN, npm)
- No refactoring of badge rendering logic beyond icon changes
- No new CSS color variables beyond the 3 status changes

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> All verification is executed by the agent using browser DevTools inspection.

### Test Decision
- **Infrastructure exists**: NO (vanilla JS project, no test framework)
- **Automated tests**: None
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

All verification uses Playwright to open the extension results page and inspect DOM/styles.

---

## Color Specification

| Status | Code | Color Name | Background (Pastel) | Text/Icon Color | CSS Variable |
|--------|------|------------|---------------------|-----------------|--------------|
| Hoàn thành | 3 | Green | `#d1fae5` | `#10b981` | `--success-bg`, `--success` |
| Đã hủy | 4 | Red | `#fee2e2` | `#ef4444` | `--danger-bg`, `--danger` |
| Chờ vận chuyển | 7 | **Yellow** | `#fef3c7` | `#d97706` | `--warning-bg`, `--warning` |
| Đang giao | 8 | Blue | `#dbeafe` | `#3b82f6` | `--info-bg`, `--info` |
| Chờ thanh toán | 9 | Purple | `#f3e5f5` | `#7b1fa2` | (hardcoded) |
| Trả hàng | 12 | **Orange-Red** | `#fed7aa` | `#ea580c` | (new) |
| Không rõ | 0 | **Gray** | `#f3f4f6` | `#6b7280` | (new) |

---

## Icon Specification (Heroicons Outline)

| Status | Heroicon Name | SVG Source |
|--------|---------------|------------|
| Hoàn thành (3) | `check-circle` | https://heroicons.com/outline/check-circle |
| Đã hủy (4) | `x-circle` | https://heroicons.com/outline/x-circle |
| Chờ vận chuyển (7) | `clock` | https://heroicons.com/outline/clock |
| Đang giao (8) | `truck` | https://heroicons.com/outline/truck |
| Chờ thanh toán (9) | `credit-card` | https://heroicons.com/outline/credit-card |
| Trả hàng (12) | `arrow-uturn-left` | https://heroicons.com/outline/arrow-uturn-left |
| Không rõ (0) | `question-mark-circle` | https://heroicons.com/outline/question-mark-circle |

---

## Execution Strategy

### Sequential Execution (No Parallelization)

```
Task 1: Update results.js with inline SVG icons
    ↓
Task 2: Update results.css with new color scheme
    ↓
Task 3: Manual QA verification in browser
```

**Rationale**: Tasks are dependent. CSS color changes reference the same status codes modified in JS. QA requires both to be complete.

---

## TODOs

- [x] 1. Add Heroicons SVG Icons to results.js

  **What to do**:
  - Open results.js lines 472-494
  - Replace Unicode icon strings with inline SVG elements
  - Each SVG: 16x16, stroke="currentColor", stroke-width="1.5", fill="none"
  - Define SVG strings as constants at top of switch block for readability
  - Update case statements to use SVG strings
  - Test icon alignment with text (may need flex/alignment CSS tweaks)

  **SVG Template** (example for check-circle):
  ```html
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  ```

  **Must NOT do**:
  - Do NOT add icons to any other UI elements
  - Do NOT change badge HTML structure beyond adding SVG
  - Do NOT use external icon library/CDN

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file change, straightforward string replacement
  - **Skills**: `[]` (no special skills needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 1 of 3)
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `ShopeeStats/results.js:472-494` - Current icon switch statement (replace this)

  **API/Type References**:
  - N/A (vanilla JS, no types)

  **External References**:
  - Heroicons source: https://heroicons.com/ - Copy SVG markup from here
  - Heroicons GitHub: https://github.com/tailwindlabs/heroicons (MIT license)

  **WHY Each Reference Matters**:
  - `results.js:472-494`: This is the EXACT code to modify. Contains switch statement with Unicode icons.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify SVG icons render in status badges
    Tool: Playwright (playwright skill)
    Preconditions: Extension loaded, results.html open with order data
    Steps:
      1. Navigate to: chrome-extension://[id]/results.html
      2. Wait for: #tableBody tr (at least 1 row)
      3. Query: document.querySelector('.status-badge svg')
      4. Assert: SVG element exists (not null)
      5. Assert: SVG width="16" and height="16"
      6. Assert: SVG has stroke="currentColor" attribute
      7. Screenshot: .sisyphus/evidence/task-1-svg-icon-present.png
    Expected Result: SVG icons visible in status badges
    Evidence: .sisyphus/evidence/task-1-svg-icon-present.png

  Scenario: Verify all 7 status types have unique icons
    Tool: Playwright (playwright skill)
    Preconditions: Page has orders with all status types (may need mock data)
    Steps:
      1. For each status class (.status-3, .status-4, .status-7, .status-8, .status-9, .status-12, .status-0):
         a. Query: document.querySelector('.status-badge.status-N svg path')
         b. Get: path.getAttribute('d') value
      2. Assert: All 7 path 'd' values are unique (different icons)
    Expected Result: Each status has distinct SVG path
    Evidence: Console log of path 'd' values
  ```

  **Commit**: YES
  - Message: `feat(ui): add Heroicons SVG icons to status badges`
  - Files: `ShopeeStats/results.js`
  - Pre-commit: N/A (no tests)

---

- [x] 2. Update Status Colors in results.css

  **What to do**:
  - Separate `.status-7` and `.status-8` into individual rules
  - Status 7: Use `--warning-bg` (#fef3c7) and `--warning` (#d97706) for yellow
  - Status 8: Keep `--info-bg` (#dbeafe) and `--info` (#3b82f6) for blue
  - Status 12: New orange-red colors (#fed7aa bg, #ea580c text)
  - Status 0: Add new gray fallback (.status-0 or .status-unknown)
  - Verify icon inherits color via `stroke: currentColor`

  **Must NOT do**:
  - Do NOT change badge padding, border-radius, font-size
  - Do NOT add hover effects or animations
  - Do NOT modify other CSS outside status badge section

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS-only change, straightforward rule modifications
  - **Skills**: `[]` (no special skills needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 2 of 3)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `ShopeeStats/results.css:938-976` - Current status badge CSS rules
  - `ShopeeStats/results.css:27-35` - CSS variables for colors (--success, --info, etc.)

  **WHY Each Reference Matters**:
  - `results.css:938-976`: The EXACT CSS to modify. Status rules are here.
  - `results.css:27-35`: Color variable definitions. Use existing vars where possible.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify status 7 has yellow color (not blue)
    Tool: Playwright (playwright skill)
    Preconditions: Page has order with status 7 (Chờ vận chuyển)
    Steps:
      1. Navigate to: chrome-extension://[id]/results.html
      2. Wait for: .status-badge.status-7
      3. Computed style: window.getComputedStyle(el).backgroundColor
      4. Assert: backgroundColor === "rgb(254, 243, 199)" (yellow #fef3c7)
      5. Computed style: window.getComputedStyle(el).color
      6. Assert: color === "rgb(217, 119, 6)" (amber #d97706)
      7. Screenshot: .sisyphus/evidence/task-2-status-7-yellow.png
    Expected Result: Status 7 badge is yellow, not blue
    Evidence: .sisyphus/evidence/task-2-status-7-yellow.png

  Scenario: Verify status 8 has blue color (unchanged)
    Tool: Playwright (playwright skill)
    Preconditions: Page has order with status 8 (Đang giao)
    Steps:
      1. Query: .status-badge.status-8
      2. Computed style: backgroundColor
      3. Assert: backgroundColor === "rgb(219, 234, 254)" (blue #dbeafe)
      4. Computed style: color
      5. Assert: color === "rgb(59, 130, 246)" (blue #3b82f6)
      6. Screenshot: .sisyphus/evidence/task-2-status-8-blue.png
    Expected Result: Status 8 badge is blue
    Evidence: .sisyphus/evidence/task-2-status-8-blue.png

  Scenario: Verify status 0 has gray fallback
    Tool: Playwright (playwright skill)
    Preconditions: Edge case - may need to inspect CSS directly if no status-0 orders
    Steps:
      1. Inject test element: <span class="status-badge status-0">Test</span>
      2. Computed style: backgroundColor
      3. Assert: backgroundColor === "rgb(243, 244, 246)" (gray #f3f4f6)
      4. Computed style: color
      5. Assert: color === "rgb(107, 114, 128)" (gray #6b7280)
    Expected Result: Status 0 fallback is gray
    Evidence: Console verification or DOM injection
  ```

  **Commit**: YES
  - Message: `feat(ui): differentiate status 7/8 colors, add gray fallback`
  - Files: `ShopeeStats/results.css`
  - Pre-commit: N/A

---

- [x] 3. Manual QA - Visual Verification

  **What to do**:
  - Load extension in Chrome
  - Open results.html with real or cached Shopee data
  - Verify all status badges display correctly
  - Take before/after screenshots for documentation
  - Check icon alignment, color contrast, text readability

  **Must NOT do**:
  - Do NOT skip any status type verification
  - Do NOT approve without checking all 7 statuses

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification only, no code changes
  - **Skills**: `["playwright"]`
    - `playwright`: Required for browser automation and screenshot capture

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 3 of 3, final)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - All previous task outputs
  - `ShopeeStats/results.html` - Dashboard page to test

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Complete visual verification of all status badges
    Tool: Playwright (playwright skill)
    Preconditions: Tasks 1 and 2 completed, extension reloaded
    Steps:
      1. Navigate to: chrome-extension://[id]/results.html
      2. Wait for: #tableBody to have content
      3. For each status (3, 4, 7, 8, 9, 12):
         a. Find a row with that status (if present in data)
         b. Screenshot the badge
         c. Verify SVG icon is visible
         d. Verify colors match specification
      4. Full page screenshot: .sisyphus/evidence/task-3-final-overview.png
      5. Compare visually to original (if available)
    Expected Result: All badges have correct icons and colors
    Evidence: .sisyphus/evidence/task-3-final-overview.png

  Scenario: Verify icon-text alignment
    Tool: Playwright (playwright skill)
    Steps:
      1. Inspect .status-badge with DevTools
      2. Assert: display is inline-flex or flex
      3. Assert: align-items is center
      4. Visual check: icon and text are vertically centered
    Expected Result: Icons vertically aligned with badge text
    Evidence: DevTools screenshot

  Scenario: Verify color contrast (accessibility)
    Tool: Playwright (playwright skill)
    Steps:
      1. For status 7 (yellow): Text #d97706 on bg #fef3c7
         - Calculate contrast ratio (should be >= 4.5:1 for WCAG AA)
      2. For status 0 (gray): Text #6b7280 on bg #f3f4f6
         - Calculate contrast ratio
      3. Assert: All contrasts meet WCAG AA (4.5:1 minimum)
    Expected Result: All status badges meet accessibility contrast
    Evidence: Contrast ratio calculations logged
  ```

  **Commit**: NO (no code changes, just verification)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(ui): add Heroicons SVG icons to status badges` | results.js | Visual check |
| 2 | `feat(ui): differentiate status 7/8 colors, add gray fallback` | results.css | Visual check |
| 3 | N/A (QA only) | N/A | Final approval |

---

## Success Criteria

### Verification Commands
```bash
# Load extension in Chrome
# Navigate to chrome-extension://[extension-id]/results.html
# Inspect .status-badge elements in DevTools
```

### Final Checklist
- [x] All 7 status types have SVG icons (3, 4, 7, 8, 9, 12, 0)
- [x] Status 7 is yellow, Status 8 is blue (visually distinct)
- [x] Status 12 is orange-red (not conflicting with yellow)
- [x] Status 0 has gray fallback styling
- [x] Icons are 16px and vertically aligned
- [x] All badges maintain pastel background + colored text style
- [x] No icons added outside status badges
- [x] No hover effects or animations added
