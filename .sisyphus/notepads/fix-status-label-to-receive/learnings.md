# Learnings - Fix Status Label to_receive

*Conventions, patterns, and best practices discovered during this work*

---
## [2026-02-04 16:25] Task: Fix parseStatusLabel() for to_receive

- Fixed missing `label_to_receive` check for code 8 (Đang giao)
- Removed `received` from `completed` check to avoid conflict
- Added comments documenting actual Shopee API labels
- Status labels from Shopee: cancelled, to_ship, to_receive, return_refund_requested, completed
