# Hướng dẫn sử dụng ShopeeStatX

Dashboard có ba màn hình ở thanh điều hướng phía trên: **Tổng quan**, **Phân tích** và **Đơn hàng**. Khi cửa sổ hẹp, thanh này chuyển xuống dưới cùng và bảng đơn hàng chuyển thành danh sách thẻ. Giao diện có ba chế độ màu **Tự động / Sáng / Tối**, chọn ở góc trên.

## 🚀 Bắt đầu

1. Đăng nhập [shopee.vn](https://shopee.vn); các tên miền Shopee khác hiện chưa được cấu hình để lấy đơn.
2. Bấm biểu tượng ShopeeStatX trên thanh công cụ Chrome, rồi **Bắt đầu phân tích**.
3. Dashboard mở ở tab mới, hiện tiến độ số đơn đã tải. Dữ liệu được lưu cục bộ trong trình duyệt.

## 🗓️ Chọn khoảng thời gian

Bộ chọn **Khoảng thời gian** ở đầu trang áp dụng cho cả ba màn hình: chọn nhanh (Tất cả, 7 ngày gần nhất, tháng này, tháng trước, 3 tháng gần nhất, năm nay), chọn theo năm hoặc theo tháng, hoặc nhập **Từ ngày / Đến ngày**. Nếu khoảng đã chọn không có đơn, bấm **Xem tất cả** để quay lại.

## 📊 Tổng quan

- **Chi tiêu ròng**: tổng chi tiêu của các đơn hợp lệ, kèm mức tăng/giảm so với tháng trước và năm trước.
- Bốn ô số liệu: **Số đơn**, **Trung bình/đơn**, **Hoàn tiền**, **Tiết kiệm ước tính**.
- Biểu đồ **Chi tiêu theo tháng** (bấm **Xem bảng số liệu** để xem dạng bảng) và danh sách **Top shop**.
- **Khoe với bạn bè (tạo ảnh)** tạo ảnh PNG chỉ gồm số liệu tổng hợp, không có tên shop, mã đơn hay tên sản phẩm.

> Đơn **đã hủy**, **trả hàng** và **chờ thanh toán** không tính vào chi tiêu. **Tiết kiệm ước tính** là tổng giá sản phẩm trừ số đã trả; Shopee không cho biết riêng voucher hay freeship (xem [docs/shopee-order-api.md](../shopee-order-api.md)).

Nếu thấy "—" ở **Hoàn tiền** hoặc **Tiết kiệm**, dữ liệu đã lưu từ phiên bản cũ: bấm **Phân tích lại** để cập nhật.

## 📋 Đơn hàng

- **Tìm kiếm** theo mã đơn, tên sản phẩm hoặc shop (kết quả hiện ngay).
- Lọc theo **trạng thái** và **shop**; **sắp xếp** theo ngày giao, trạng thái hoặc tổng tiền.
- Phân trang; bấm một đơn để xem chi tiết sản phẩm. Đơn bị loại được ghi rõ cùng giá trị gốc.
- **Xuất dữ liệu**: Excel (.xlsx), CSV hoặc In / PDF. File xuất đúng theo khoảng thời gian và bộ lọc đang áp dụng.

## 🔎 Phân tích

- **Biểu đồ nhiệt** số đơn mỗi ngày (tối đa 12 tháng gần nhất của khoảng đã chọn), có thể cuộn ngang.
- **Thói quen mua sắm**: ngày trong tuần và giờ mua nhiều nhất, chuỗi tháng liên tiếp, sản phẩm mua nhiều nhất và đắt nhất, cùng bảng **shop thân thiết**.
- **Nhận xét** tự động từ dữ liệu của bạn.
- **Dự đoán và ngân sách**: đặt hạn mức hàng tháng và ngưỡng cảnh báo; ShopeeStatX dự kiến chi tiêu cuối tháng và báo nếu có thể vượt ngân sách.

## 🔄 Cập nhật dữ liệu

Bấm **Làm mới** để lấy đơn mới từ Shopee; các đơn mới được gộp vào dữ liệu đã lưu và có thông báo "Đã thêm n đơn hàng mới". Cần giữ tab Shopee đã đăng nhập đang mở. Tải lại trang dashboard chỉ đọc dữ liệu đã lưu, không quét lại.

## ❓ Câu hỏi thường gặp

### Extension không hoạt động?
- Đảm bảo đã đăng nhập Shopee và popup được mở khi đang ở tab `https://shopee.vn` (không phải tên miền con như trang người bán).
- Nếu tiến độ đứng yên lâu, tải lại trang Shopee rồi thử lại.

### Tổng tiền không khớp với số tiền mình nhớ?
- Đơn đã hủy, trả hàng và chờ thanh toán không được tính; số tiền đã gồm giảm giá và voucher.

### Dữ liệu được lưu ở đâu?
- Chỉ trong `chrome.storage.local` của trình duyệt bạn. Extension không gửi dữ liệu đi đâu. Xem **Chính sách bảo mật** trong popup.

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề hoặc có góp ý, vui lòng tạo issue tại [GitHub](https://github.com/ninhhaidang/shopeestatx/issues).
