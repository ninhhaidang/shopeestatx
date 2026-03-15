# Plan: Bổ sung Keyword & Category

## Overview
Mở rộng keyword và thêm category mới để tăng độ chính xác của phân loại sản phẩm.

## Current Status
- **Priority**: Medium
- **Files**: `src/dashboard/categories.ts`
- **Status**: ✅ Completed

## Requirements

### Functional
- Thêm category mới phổ biến: Mẹ & Bé, Thú cưng, Xe cộ, Đồ chơi
- Mở rộng keyword cho category hiện có
- Tránh false positive bằng keyword dài (2-3 từ)
- Đảm bảo priority order đúng

### Non-Functional
- Không làm chậm performance
- Dễ maintain mở rộng

## Architecture

### Category Structure
```typescript
const RULES: Record<string, string[]> = {
  // Priority: cụ thể trước, chung sau
  'Mẹ & Bé': [...],
  'Thú cưng': [...],
  'Xe cộ': [...],
  'Đồ chơi': [...],
  // Giữ nguyên các category hiện có
  'Sách & Văn phòng': [...],
  'Điện tử': [...],
  // ...
};
```

## Related Files
- `src/dashboard/categories.ts` - Sửa trực tiếp

## Implementation Steps

### Phase 1: Thêm category mới
1.1. Thêm category "Mẹ & Bé" với keywords: bỉm, tã, sữa, bình sữa, xe đẩy, đồ chơi trẻ em, quần áo trẻ em, etc.
1.2. Thêm category "Thú cưng" với keywords: thức ăn cho chó, thức ăn cho mèo, đồ chơi thú cưng, chuồng, vòng cổ, etc.
1.3. Thêm category "Xe cộ" với keywords: xe máy, xe đạp, phụ tùng xe, nhông xích, lốp, dầu nhớt, etc.
1.4. Thêm category "Đồ chơi" với keywords: lego, đồ chơi trẻ em, puzzle, board game, game, etc.

### Phase 2: Mở rộng keyword hiện có
2.1. Mở rộng "Sách & Văn phòng": thêm sách tiếng Anh, văn phòng phẩm
2.2. Mở rộng "Điện tử": thêm smart home, accessories
2.3. Mở rộng "Thời trang": thêm phụ kiện, đồ lót, etc.
2.4. Mở rộng "Sắc đẹp": thêm makeup, skincare variants

### Phase 3: Tối ưu tránh false positive
3.1. Thay keyword ngắn bằng keyword dài hơn
3.2. Kiểm tra và điều chỉnh priority order

## Phases
- Phase 1: Thêm category mới → **Completed**
- Phase 2: Mở rộng keyword hiện có → **Completed**
- Phase 3: Tối ưu tránh false positive → **Completed**

## Todo List
- [ ] Phase 1: Thêm category mới (Mẹ & Bé, Thú cưng, Xe cộ, Đồ chơi)
- [ ] Phase 2: Mở rộng keyword category hiện có
- [ ] Phase 3: Tối ưu tránh false positive
- [ ] Test: Build và kiểm tra không có lỗi

## Success Criteria
- Build thành công không lỗi
- Tăng độ chính xác phân loại (ít "Khác" hơn)
- Không có false positive rõ ràng

## Risk Assessment
- **Low**: Thay đổi đơn giản, không ảnh hưởng logic
- **Mitigation**: Test sau khi sửa

## Result
✅ Build thành công. Đã thêm 4 category mới và mở rộng keyword cho tất cả category.

## Next Steps
Sau khi merge: Đánh giá độ chính xác và bổ sung thêm nếu cần
