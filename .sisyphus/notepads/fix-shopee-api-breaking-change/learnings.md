# Learnings - Fix Shopee API Breaking Change

*Conventions, patterns, and best practices discovered during this work*

---
## [2026-02-04 23:00:06] Task: Update content.js

- Replaced content.js with backward-compatible API support
- NEW API: new_data.order_or_checkout_data[]
- OLD API: data.order_data.details_list[] (fallback)
- Added parseStatusLabel() for string → code mapping
- Defensive null checks throughout
