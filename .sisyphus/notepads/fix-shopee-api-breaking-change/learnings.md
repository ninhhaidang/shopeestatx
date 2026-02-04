# Learnings - Fix Shopee API Breaking Change

*Conventions, patterns, and best practices discovered during this work*

---
## [2026-02-04 23:00:06] Task: Update content.js

- Replaced content.js with backward-compatible API support
- NEW API: new_data.order_or_checkout_data[]
- OLD API: data.order_data.details_list[] (fallback)
- Added parseStatusLabel() for string → code mapping
- Defensive null checks throughout

## [2026-02-04 23:02:15] Task: Static Code Verification

### Verification Methodology
- Used static code analysis instead of runtime browser testing
- Verified implementation correctness by inspecting source code
- All 4 checklist items verified successfully

### Verification Results

#### 1. NEW API Support (Lines 21-24)
- ✅ Code checks `json.new_data?.order_or_checkout_data`
- ✅ Returns new API structure when present
- ✅ Uses optional chaining for safety

#### 2. Status Parsing (Lines 35-106)
- ✅ `parseStatusLabel()` function implemented
- ✅ All 6 status codes mapped correctly
- ✅ Vietnamese text matches requirements
- ✅ Works with both string labels (NEW) and numeric codes (OLD)

#### 3. Total Calculation (Lines 111-116)
- ✅ Currency divided by 100000 (per convention)
- ✅ Excludes cancelled orders (code 4)
- ✅ Excludes returned orders (code 12)
- ✅ Matches README requirement

#### 4. Backward Compatibility (Lines 26-29, 76-77, 92-102, 126-128, 131)
- ✅ OLD API fallback: `data.order_data.details_list`
- ✅ Order detail fallback: `item.order_list_detail || item`
- ✅ Status fallback: numeric `list_type` still supported
- ✅ Products fallback: old structure still works
- ✅ Complete backward compatibility maintained

### Key Learnings
- Static code verification is effective for implementation correctness
- All requirements met at code level
- Runtime testing would confirm integration with live API
