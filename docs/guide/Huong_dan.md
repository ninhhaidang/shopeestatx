# Hướng dẫn sử dụng ShopeeStatX

Dashboard có ba màn hình ở thanh điều hướng phía trên: **Tổng quan**, **Phân tích** và **Đơn hàng**. Khi cửa sổ hẹp (như bảng bên), thanh này nằm trên một hàng riêng ngay dưới logo và bảng đơn hàng chuyển thành danh sách thẻ. Giao diện có hai chế độ màu **Sáng** (mặc định) và **Tối**, chọn ở góc trên.

## 🚀 Bắt đầu

1. Đăng nhập [shopee.vn](https://shopee.vn); các tên miền Shopee khác hiện chưa được cấu hình để lấy đơn.
2. Bấm biểu tượng ShopeeStatX trên thanh công cụ Chrome, rồi **Bắt đầu phân tích**.
3. Dashboard mở ở tab mới, hiện tiến độ số đơn đã tải. Dữ liệu được lưu cục bộ trong trình duyệt.

## 🗓️ Chọn khoảng thời gian

Bộ chọn **Khoảng thời gian** ở đầu trang áp dụng cho cả ba màn hình: chọn nhanh (Tất cả, 7 ngày gần nhất, tháng này, tháng trước, 3 tháng gần nhất, năm nay), chọn theo năm hoặc theo tháng, hoặc nhập **Từ ngày / Đến ngày**. Nếu khoảng đã chọn không có đơn, bấm **Xem tất cả** để quay lại.

## 📸 Tạo ảnh khoe

- Màn **Tổng quan** có sẵn thẻ **Tổng kết Shopee** của năm gần nhất: bấm **Lưu ảnh** là xong, hoặc **Tuỳ chỉnh…** để đổi mẫu, tỉ lệ.
- Bấm **Tạo ảnh khoe** trên thanh công cụ của dashboard, hoặc trong popup khi đã có dữ liệu lưu; trong hộp có thể chọn ảnh theo năm hoặc theo khoảng thời gian đang xem.
- Chọn mẫu và tỉ lệ, rồi **Lưu ảnh** để tải về máy, hoặc **Sao chép ảnh** để dán thẳng vào Zalo, Messenger hay bài đăng.
- Ảnh có nhãn **Đạt chuẩn hạng Bạc/Vàng/Kim Cương** khi đơn hàng đạt điều kiện hạng thành viên Shopee công bố (ước tính, hạng thật trên Shopee có thể khác), và mã QR dẫn tới ShopeeStatX trên Chrome Web Store.
- Ảnh chỉ gồm số liệu tổng hợp, không có tên shop, mã đơn hay tên sản phẩm; ô bằng 0 hoặc thiếu dữ liệu không được in lên ảnh.

## 📊 Tổng quan

- **Chi tiêu ròng**: tổng chi tiêu của các đơn hợp lệ, kèm mức tăng/giảm so với tháng trước và năm trước.
- Bốn ô số liệu: **Số đơn**, **Trung bình/đơn**, **Hoàn tiền**, **Tiết kiệm ước tính**.
- Biểu đồ **Chi tiêu theo tháng** với đường trung bình mỗi tháng; bấm một cột để xem riêng tháng đó, hoặc chọn **Bảng số liệu** để xem dạng bảng.
- **Top shop**: bấm một shop để mở danh sách đơn của shop đó.

> Đơn **đã hủy**, **trả hàng** và **chờ thanh toán** không tính vào chi tiêu. **Tiết kiệm ước tính** là tổng giá sản phẩm trừ số đã trả; Shopee không cho biết riêng voucher hay freeship (xem [docs/shopee-order-api.md](../shopee-order-api.md)).

Nếu thấy "—" ở **Hoàn tiền** hoặc **Tiết kiệm**, dữ liệu đã lưu từ phiên bản cũ: bấm **Phân tích lại** để cập nhật.

## 📋 Đơn hàng

- **Tìm kiếm** theo mã đơn, tên sản phẩm hoặc shop (kết quả hiện ngay).
- Lọc theo **trạng thái** (hàng nút kèm số đơn) và **shop**; **sắp xếp** theo ngày giao, trạng thái hoặc tổng tiền.
- Đơn được nhóm theo tháng, có tổng tiền ở cuối danh sách; phân trang; bấm một đơn để xem chi tiết sản phẩm và tiết kiệm ước tính của đơn. Đơn bị loại được ghi rõ cùng giá trị gốc.
- Menu **Xuất dữ liệu**: Excel (.xlsx), CSV hoặc In / PDF. File xuất đúng theo khoảng thời gian và bộ lọc đang áp dụng.

## 🔎 Phân tích

- **Biểu đồ nhiệt** số đơn mỗi ngày (tối đa 12 tháng gần nhất của khoảng đã chọn), có thể cuộn ngang.
- **Thói quen mua sắm**: ngày trong tuần và giờ mua nhiều nhất, chuỗi tháng liên tiếp, sản phẩm mua nhiều nhất và đắt nhất, cùng bảng **shop thân thiết**; bấm một shop hoặc sản phẩm để mở các đơn liên quan.
- **Nhận xét** tự động từ dữ liệu của bạn.
- **Dự đoán và ngân sách**: so chi tiêu tháng này với một tháng trung bình; đặt hạn mức hàng tháng và ngưỡng cảnh báo; ShopeeStatX dự kiến chi tiêu cuối tháng và báo nếu có thể vượt ngân sách.

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
