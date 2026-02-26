# Plan: Fix Future Date in Order ID Timestamp Fallback

**Goal**: Fix bug where orders with no shipping info show wrong future dates (e.g., "14/4/2030") because the `order_id` fallback extracts a timestamp that passes the `<= 2030` year check. After fix, such orders show "Chưa có" instead.

**Scope**:
- **IN**: `ShopeeStatX/content.js` line 162 only — tighten the year validation
- **OUT**: Everything else. No changes to results.js, table.js, export.js, etc.

**Root Cause**: `content.js:162` validates the order_id-derived timestamp with:
```js
if (testDate.getFullYear() >= 2020 && testDate.getFullYear() <= 2030) {
```
For order `190239125204423`, the first 10 digits `1902391252` convert to April 14, **2030** — which passes the `<= 2030` check. The fix is to reject any future timestamps.

---

## Execution Tasks

#### Task 1: Fix timestamp validation in content.js

**File**: `ShopeeStatX/content.js`
**Line**: 162

**Current code (line 160-164)**:
```js
              // Check if it's a reasonable timestamp (year 2020-2030)
              const testDate = new Date(possibleTimestamp * 1000);
              if (testDate.getFullYear() >= 2020 && testDate.getFullYear() <= 2030) {
                orderTime = possibleTimestamp;
              }
```

**Replace with**:
```js
              // Check if it's a reasonable timestamp (year >= 2020 and not in the future)
              const testDate = new Date(possibleTimestamp * 1000);
              if (testDate.getFullYear() >= 2020 && testDate.getTime() <= Date.now()) {
                orderTime = possibleTimestamp;
              }
```

**What changed**: Replace `testDate.getFullYear() <= 2030` with `testDate.getTime() <= Date.now()`

**Why this is better**:
- `<= 2030` is a hardcoded upper bound that will break in 2031 anyway
- `Date.now()` dynamically rejects any future timestamps — an order cannot have been delivered in the future
- For the specific bug case: `1902391252000` (Apr 2030) > `Date.now()` (Feb 2026) → REJECTED → falls through to `null` → shows "Chưa có" ✅
- For valid order IDs with embedded timestamps (pre-2024 format): still pass both checks ✅

**QA**:
1. Verify line 162 now reads `testDate.getTime() <= Date.now()`
2. Verify the comment on line 160 updated to reflect the new logic
3. No other lines changed in content.js
4. Manual test: reload extension, check that order `190239125204423` shows "Chưa có" instead of "14/4/2030"
5. Manual test: verify other orders with valid timestamps still show correct dates

---

## Final Verification Wave

1. `git diff ShopeeStatX/content.js` — should show exactly 2 lines changed (comment + condition)
2. No other files modified
3. Commit with message: `fix: reject future dates in order_id timestamp fallback`
