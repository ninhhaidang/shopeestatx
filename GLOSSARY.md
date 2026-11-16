# ShopeeStatX

Thống kê chi tiêu Shopee của một người mua, tính từ lịch sử đơn hàng trong tài khoản của chính họ.

## Language

**Đơn hàng**:
Một đơn mua trên Shopee của người dùng, thuộc đúng một shop và có một trạng thái.
_Avoid_: Giao dịch, purchase

**Đơn bị loại**:
Đơn hàng bị huỷ, trả hàng hoặc đang chờ thanh toán, không tính vào chi tiêu.
_Avoid_: Đơn lỗi, đơn thất bại

**Chi tiêu ròng**:
Tổng tiền của các đơn hàng không bị loại. Đây là con số «Chi tiêu ròng» hiển thị nổi bật ở Tổng quan.
_Avoid_: Tổng tiền, doanh thu

**Hoàn tiền**:
Giá trị gốc của các đơn bị huỷ hoặc trả hàng. Nguồn dữ liệu không xác nhận khoản hoàn tiền thật, nên đây không phải giao dịch hoàn tiền đã kiểm chứng.
_Avoid_: Refund (trong giao diện tiếng Việt)

**Tiết kiệm ước tính**:
Chênh lệch giữa giá các món trong đơn (sau giảm giá của món) và số tiền thực trả. Không tách được voucher với miễn phí vận chuyển, và thấp hơn thực tế khi đơn có phí ship.
_Avoid_: Giảm giá, discount, Tiết kiệm (không kèm "ước tính")
