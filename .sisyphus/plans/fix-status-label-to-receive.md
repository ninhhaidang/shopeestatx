# Fix Status Label "to_receive" Missing

## TL;DR

> **Mục tiêu**: Fix trạng thái "Đang giao" hiển thị sai thành "Không rõ"
> 
> **Deliverables**:
> - `ShopeeStats/content.js` - Thêm check `to_receive` vào `parseStatusLabel()`
> 
> **Estimated Effort**: Quick (5 phút)
> **Root Cause**: Shopee dùng `label_to_receive` cho đơn đang giao, nhưng code chỉ check `shipping/transit/delivery`

---

## Context

### Bug Report
- Trạng thái đơn hàng đang vận chuyển hiển thị là "Không rõ" thay vì "Đang giao"

### Root Cause Analysis
User chạy fetch trực tiếp trong Console và phát hiện các status labels thực tế:

```javascript
// Actual labels from Shopee API:
['label_cancelled', 'label_to_ship', 'label_to_receive', 'label_return_refund_requested', 'label_completed']
```

**Vấn đề**: Code chỉ check `shipping`, `transit`, `delivery` cho status "Đang giao" (code 8), nhưng Shopee dùng `label_to_receive`!

| Status | API Label | Code cũ check | Kết quả |
|--------|-----------|--------------|---------|
| Đang giao | `label_to_receive` | `shipping, transit, delivery` | ❌ Không match → "Không rõ" |

---

## TODOs

- [x] 1. Update parseStatusLabel() để thêm check `to_receive`

  **What to do**:
  Sửa function `parseStatusLabel()` trong `ShopeeStats/content.js` (lines 34-58).
  
  **Thay thế code cũ:**
  ```javascript
  // Map status label string to status code and Vietnamese text
  function parseStatusLabel(statusLabel) {
    const label = (statusLabel || '').toLowerCase();

    if (label.includes('completed') || label.includes('received')) {
      return { code: 3, text: 'Hoàn thành' };
    }
    if (label.includes('cancelled') || label.includes('cancel')) {
      return { code: 4, text: 'Đã hủy' };
    }
    if (label.includes('to_ship') || label.includes('preparing') || label.includes('process')) {
      return { code: 7, text: 'Chờ vận chuyển' };
    }
    if (label.includes('shipping') || label.includes('transit') || label.includes('delivery')) {
      return { code: 8, text: 'Đang giao' };
    }
    if (label.includes('pay') || label.includes('unpaid')) {
      return { code: 9, text: 'Chờ thanh toán' };
    }
    if (label.includes('return') || label.includes('refund')) {
      return { code: 12, text: 'Trả hàng' };
    }

    return { code: 0, text: 'Không rõ' };
  }
  ```

  **Bằng code mới:**
  ```javascript
  // Map status label string to status code and Vietnamese text
  // Actual labels from Shopee API: label_cancelled, label_to_ship, label_to_receive, 
  // label_return_refund_requested, label_completed
  function parseStatusLabel(statusLabel) {
    const label = (statusLabel || '').toLowerCase();

    // label_completed → Hoàn thành (must check before 'to_receive' since 'completed' contains no 'receive')
    if (label.includes('completed')) {
      return { code: 3, text: 'Hoàn thành' };
    }
    // label_cancelled → Đã hủy
    if (label.includes('cancelled') || label.includes('cancel')) {
      return { code: 4, text: 'Đã hủy' };
    }
    // label_to_ship → Chờ vận chuyển (seller preparing)
    if (label.includes('to_ship') || label.includes('preparing') || label.includes('process')) {
      return { code: 7, text: 'Chờ vận chuyển' };
    }
    // label_to_receive → Đang giao (in transit, waiting for customer to receive)
    if (label.includes('to_receive') || label.includes('shipping') || label.includes('transit') || label.includes('delivery')) {
      return { code: 8, text: 'Đang giao' };
    }
    // Chờ thanh toán
    if (label.includes('pay') || label.includes('unpaid')) {
      return { code: 9, text: 'Chờ thanh toán' };
    }
    // label_return_refund_requested → Trả hàng/Hoàn tiền
    if (label.includes('return') || label.includes('refund')) {
      return { code: 12, text: 'Trả hàng' };
    }

    return { code: 0, text: 'Không rõ' };
  }
  ```

  **Key changes:**
  1. ✅ Thêm `to_receive` vào check cho code 8 (Đang giao)
  2. ✅ Bỏ `received` khỏi check code 3 (tránh conflict với `to_receive`)
  3. ✅ Thêm comments document các labels thực tế

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["git-master"]`

  **References**:
  - `ShopeeStats/content.js:34-58` - Function parseStatusLabel()

  **Acceptance Criteria**:
  - [ ] `label_to_receive` → Code 8, "Đang giao"
  - [ ] `label_completed` → Code 3, "Hoàn thành"  
  - [ ] `label_return_refund_requested` → Code 12, "Trả hàng"
  - [ ] Reload extension và verify không còn "Không rõ"

  **Commit**: YES
  - Message: `fix: add to_receive status label for shipping orders`
  - Files: `ShopeeStats/content.js`

---

## Success Criteria

### Verification
1. Reload extension
2. Run "Bắt đầu phân tích"
3. Đơn hàng đang vận chuyển phải hiển thị "Đang giao" (không phải "Không rõ")

### Final Checklist
- [x] `label_to_receive` được parse đúng thành "Đang giao"
- [x] Không còn đơn nào hiển thị "Không rõ" (trừ trường hợp thật sự không xác định)
