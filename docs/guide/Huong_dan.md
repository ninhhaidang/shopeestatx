# Hướng dẫn sử dụng ShopeeStatX

## 📊 Xem tổng quan chi tiêu

### Để biết bạn đã chi tiêu bao nhiêu
Sau khi tải xong, bạn sẽ thấy ngay:
- **Số đơn hàng**: Tổng số đơn đã mua
- **Tổng sản phẩm**: Tổng số sản phẩm trong các đơn
- **Tổng tiền đã tiêu**: Tổng chi tiêu (chỉ tính đơn hoàn thành)

### Để so sánh xu hướng chi tiêu
- **Tháng này vs Tháng trước**: Xem bạn chi nhiều hơn hay ít hơn
- **Năm nay vs Năm ngoái**: Theo dõi xu hướng chi tiêu dài hạn
- **Giá trung bình/đơn**: Biết mỗi lần mua hàng chi bao nhiêu

---

## 🔍 Tìm kiếm & Lọc dữ liệu

### Để tìm một đơn hàng cụ thể
- Gõ **mã đơn hàng**, **tên sản phẩm**, hoặc **tên shop** vào ô tìm kiếm
- Kết quả hiển thị ngay lập tức (không cần nhấn Enter)
- **Phím tắt**: Nhấn `/` → focus vào ô tìm kiếm, `Escape` → xóa tìm kiếm

### Để xem chi tiêu theo thời gian
**Theo năm:**
- Chọn năm trong dropdown → Hiển thị tất cả đơn hàng của năm đó

**Theo tháng:**
- Chọn tháng → Xem chi tiết đơn hàng trong tháng
- Biểu đồ tự động chuyển sang hiển thị theo ngày

**Theo ngày (drill-down):**
- Sau khi lọc theo tháng, click vào cột ngày trên biểu đồ
- Biểu đồ vẫn hiển thị đầy đủ các ngày, ngày được chọn highlight màu cam
- Bảng dữ liệu chỉ hiển thị đơn hàng của ngày đó
- Click lại để bỏ chọn

### Để xem theo trạng thái đơn hàng
Chọn trạng thái trong dropdown:
- Hoàn thành
- Đã hủy
- Vận chuyển
- Đang giao
- Chờ thanh toán
- Trả hàng

### Để xóa bộ lọc
- Click nút **×** trên chip bộ lọc → Xóa từng cái
- Click "Xóa tất cả" → Reset toàn bộ

---

## 📈 Phân tích bằng biểu đồ

### Để xem xu hướng chi tiêu theo thời gian
**Biểu đồ cột:**
- Mặc định hiển thị chi tiêu theo **tháng**
- Khi lọc theo tháng, tự động chuyển sang hiển thị theo **ngày**

**Tương tác với biểu đồ:**
- **Click vào cột** → Tự động lọc theo tháng/ngày đó
  - Click cột tháng → Lọc theo tháng (biểu đồ chuyển sang hiển thị theo ngày)
  - Click cột ngày → Lọc chi tiết theo ngày cụ thể
  - Ngày được chọn highlight màu cam
- **Hover** → Xem chi tiết số tiền
- Biểu đồ tự động cập nhật khi thay đổi bộ lọc

### Để biết shop nào bạn mua nhiều nhất
**Biểu đồ tròn Top Shop:**
- Mặc định hiển thị **Top 5** shop

**Tùy chọn số lượng shop:**
- Chọn dropdown bên phải tiêu đề: **3**, **5**, **10**, hoặc **15** shops
- Số lượng trên tiêu đề tự động cập nhật

**Tùy chọn kiểu thống kê:**
- **Tổng tiền**: Shop bạn chi nhiều tiền nhất
- **Số đơn hàng**: Shop bạn mua nhiều đơn nhất
- **Số sản phẩm**: Shop bạn mua nhiều sản phẩm nhất

**Tương tác:**
- **Click vào phần của shop** → Tự động tìm kiếm và lọc tất cả đơn hàng từ shop đó
- **Hover** → Xem chi tiết (tổng tiền/số đơn/số sản phẩm tùy theo kiểu thống kê đã chọn)

---

## 📋 Quản lý bảng dữ liệu

### Để sắp xếp đơn hàng
- Click tiêu đề cột: **Ngày giao**, **Trạng thái**, hoặc **Tổng tiền**
- Click lần nữa → Đảo ngược thứ tự
- Mũi tên trên tiêu đề cột cho biết hướng sắp xếp hiện tại

### Để xem chi tiết đơn hàng
- Click vào bất kỳ dòng nào trong bảng
- Sẽ hiển thị đầy đủ thông tin:
  - Mã đơn hàng
  - Tên sản phẩm
  - Số lượng sản phẩm
  - Tổng tiền
  - Trạng thái (có thể click để lọc)
  - Người bán (có thể click để lọc)
  - Ngày giao hàng (có thể click để lọc)
  - Chi tiết sản phẩm

### Để lọc nhanh từ chi tiết đơn hàng
Khi xem chi tiết đơn hàng, click vào các thông tin sau để tự động áp dụng bộ lọc:
- **Trạng thái**: Click để lọc tất cả đơn hàng có trạng thái tương tự
- **Người bán**: Click để tìm kiếm tất cả đơn hàng từ shop đó
- **Ngày giao hàng**: Click để lọc đơn hàng giao vào ngày đó

### Để điều hướng giữa các trang
- Chọn số items/trang: **20**, **50**, **100**, hoặc **Tất cả**
- Dùng nút: **«** (trang đầu), **‹** (trang trước), **›** (trang sau), **»** (trang cuối)
- Click số trang → Nhảy đến trang cụ thể

---

## 📥 Xuất dữ liệu

### Để lưu lịch sử mua hàng ra file Excel
1. Click nút **"Xuất file xlsx"** ở góc trên bên phải
2. File sẽ tự động tải về với tên `shopee-stats-YYYY-MM-DD.xlsx`
3. Dữ liệu bao gồm:
   - STT, Mã đơn hàng, Ngày giao hàng
   - Trạng thái, Tên sản phẩm, Số lượng
   - Tổng tiền, Người bán, Chi tiết

> **Lưu ý**: File Excel chỉ xuất dữ liệu đã được lọc, không xuất toàn bộ

---

## 🔄 Cập nhật dữ liệu

### Để tải lại dữ liệu mới nhất từ Shopee
- Click nút **↻** (Làm mới) ở góc trên
- Hoặc nhấn phím `r` trên bàn phím
- Dữ liệu sẽ được tải lại từ đầu

---

## 💡 Mẹo sử dụng hiệu quả

### Phân tích xu hướng chi tiêu
- Xem biểu đồ theo tháng → Biết **tháng nào chi tiêu nhiều nhất**
- **Click vào cột tháng** → Tự động lọc và xem chi tiết các đơn hàng
- Biểu đồ tự động chuyển sang hiển thị theo ngày
- **Click tiếp vào cột ngày** → Xem đơn hàng của ngày cụ thể
- So sánh với tháng trước → **Kiểm soát chi tiêu** tốt hơn

### Tìm shop ưa thích
- Xem biểu đồ **Top Shop** với các kiểu thống kê khác nhau:
  - **Tổng tiền**: Shop chi tiêu nhiều tiền nhất → Quản lý ngân sách
  - **Số đơn hàng**: Shop mua thường xuyên nhất → Biết shop quen thuộc
  - **Số sản phẩm**: Shop mua nhiều items nhất → Phân tích thói quen
- Tăng số lượng shop lên **10** hoặc **15** → Xem overview rộng hơn
- **Click vào phần của shop** → Tự động lọc và xem tất cả đơn hàng từ shop đó

### Lọc nhanh từ chi tiết đơn hàng
- Click vào **bất kỳ đơn hàng nào** → Xem chi tiết đầy đủ
- Các thông tin **có thể click** (hiển thị gạch chân màu cam):
  - **Trạng thái**: Click → Lọc theo trạng thái đó
  - **Người bán**: Click → Tìm kiếm shop
  - **Ngày giao hàng**: Click → Lọc theo ngày cụ thể
- Giúp phân tích nhanh mà không cần chọn bộ lọc thủ công

### Lưu trữ lịch sử
- Xuất file xlsx → Lưu trữ dài hạn
- Dễ dàng so sánh giữa các khoảng thời gian
- Mở trên Excel/Google Sheets → Phân tích thêm

### Xem chi tiết một ngày cụ thể
**Cách 1: Từ biểu đồ**
- Click vào cột tháng trên biểu đồ → Lọc theo tháng
- Biểu đồ tự động chuyển sang hiển thị theo ngày
- Click vào cột ngày → Lọc theo ngày cụ thể

**Cách 2: Từ chi tiết đơn hàng**
- Click vào đơn hàng bất kỳ → Xem chi tiết
- Click vào **Ngày giao hàng** → Tự động lọc theo ngày đó

### Phím tắt
- **/** → Focus vào ô tìm kiếm
- **Escape** → Xóa tìm kiếm
- **r** → Làm mới dữ liệu

---

## ❓ Câu hỏi thường gặp

### Extension không hoạt động?
**Nguyên nhân:**
- Chưa đăng nhập Shopee
- Đang ở trang không phải Shopee

**Giải pháp:**
- Đảm bảo đã đăng nhập [shopee.vn](https://shopee.vn)
- Thử làm mới trang Shopee và extension

### Dữ liệu không đầy đủ?
**Giải pháp:**
- Click nút **↻** → Tải lại dữ liệu
- Kiểm tra kết nối internet
- Đảm bảo đã đăng nhập đúng tài khoản

### Tổng tiền không khớp với số tiền mình nhớ?
**Lý do:**
- Extension **chỉ tính đơn hoàn thành**
- Đơn **đã hủy** và **trả hàng** không được tính
- Tổng tiền đã bao gồm **giảm giá** và **voucher**

### Dữ liệu có bị lưu trữ ở đâu không?
- **Không**, dữ liệu chỉ hiển thị trong session hiện tại
- Extension không lưu trữ hoặc gửi dữ liệu đi đâu
- Mỗi lần mở lại cần tải dữ liệu từ Shopee

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề hoặc có góp ý, vui lòng tạo issue tại [GitHub](https://github.com/ninhhaidang/shopee-orders-statics)
