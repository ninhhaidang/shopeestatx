# ShopeeStatX

Thống kê chi tiêu Shopee của một người mua, tính từ lịch sử đơn hàng trong tài khoản của chính họ.

## Language

**Đơn hàng**:
Một đơn mua trên Shopee của người dùng, thuộc đúng một shop và có một trạng thái.
_Avoid_: Giao dịch, purchase

**Đơn bị loại**:
Đơn hàng bị huỷ hoặc trả hàng, không tính vào chi tiêu.
_Avoid_: Đơn lỗi, đơn thất bại

**Chi tiêu ròng**:
Tổng tiền người dùng thực trả cho các đơn hàng, đã trừ hoàn tiền. Đây là con số "Tổng chi tiêu" hiển thị.
_Avoid_: Tổng tiền, doanh thu

**Hoàn tiền**:
Số tiền Shopee trả lại cho người dùng từ một đơn bị loại.
_Avoid_: Refund (trong giao diện tiếng Việt)

**Tiết kiệm ước tính**:
Chênh lệch giữa giá các món trong đơn (sau giảm giá của món) và số tiền thực trả. Không tách được voucher với miễn phí vận chuyển, và thấp hơn thực tế khi đơn có phí ship.
_Avoid_: Giảm giá, discount, Tiết kiệm (không kèm "ước tính")
