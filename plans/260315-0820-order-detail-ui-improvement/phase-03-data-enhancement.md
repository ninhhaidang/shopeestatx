# Phase 3: Data Enhancement (Backend Changes)

**Priority:** MEDIUM (Separate Task)
**Estimated Effort:** 1-2 days
**Requires:** Parser updates, type definitions

---

## Overview

Add new data fields to order detail view. Requires changes to parser and type definitions.

---

## New Fields Required

| Field | Type | Purpose |
|-------|------|---------|
| `orderDate` | Date | Full order date (not just month/year) |
| `discount` | Number | Discount/coupon value |
| `shippingFee` | Number | Shipping cost |
| `paymentMethod` | String | COD / Online / Wallet |

---

## Implementation Steps

### 3.1 Update Order Type (src/types/index.ts)
```typescript
export interface Order {
  // Existing fields...
  orderDate: string | null;  // NEW: Full order date
  discount: number;          // NEW: Discount amount
  shippingFee: number;       // NEW: Shipping fee
  paymentMethod: string;     // NEW: COD/Online/Wallet
}
```

### 3.2 Update Parser (src/content-parser.ts)
- Extract new fields from Shopee HTML
- Add parsing logic for discount, shipping, payment

### 3.3 Update UI (src/dashboard/table.ts)
- Add new fields to detail display
- Add to appropriate column (Order Info)

### 3.4 Add i18n Keys
- "Discount" / "Giảm giá"
- "Shipping Fee" / "Phí vận chuyển"
- "Payment Method" / "Phương thức thanh toán"

---

## Dependencies

- Must complete parser changes first
- UI changes depend on type definitions

---

## Success Criteria

- [ ] New fields display in order detail
- [ ] Data parsed correctly from Shopee
- [ ] Responsive with additional fields
- [ ] i18n support for all new labels
