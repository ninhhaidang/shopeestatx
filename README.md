# ShopeeStatX - Thống kê đơn hàng Shopee

<div align="center">

![Language](https://img.shields.io/badge/Language-gray?style=for-the-badge&logo=googletranslate&logoColor=white)
[![Tiếng Việt](https://img.shields.io/badge/Tiếng_Việt-red?style=for-the-badge)](#)
[![English](https://img.shields.io/badge/English-blue?style=for-the-badge)](Documents/README-en.md)

---

[![GitHub stars](https://img.shields.io/github/stars/ninhhaidang/shopee-orders-statics?style=for-the-badge&logo=github&label=Star%20this%20repo)](https://github.com/ninhhaidang/shopee-orders-statics/stargazers)

</div>

> **Version 2.1** - Giao diện tối giản, biểu đồ thông minh

Extension Chrome giúp theo dõi và phân tích chi tiêu trên Shopee một cách chi tiết và trực quan.

## Tính năng chính

### 📊 Thống kê tổng quan
- Tổng số đơn hàng và sản phẩm
- Tổng chi tiêu (bao gồm giảm giá, voucher)
- So sánh tháng này/năm nay với tháng/năm trước
- Giá trung bình mỗi đơn hàng

### 🔍 Bộ lọc
- Tìm kiếm theo đơn hàng, sản phẩm, shop
- Lọc theo năm, tháng, ngày (drill-down)
- Lọc theo trạng thái: Hoàn thành, Đã hủy, Vận chuyển, Đang giao, Chờ thanh toán, Trả hàng
- Xóa nhanh từng bộ lọc hoặc xóa tất cả

### 📈 Biểu đồ
- Tự động hiển thị theo tháng hoặc ngày (tùy bộ lọc)
- Click cột tháng để drill-down, click cột ngày để lọc chi tiết
- Ngày được chọn highlight màu cam, toggle bằng cách click lại
- Top 5 shop mua nhiều nhất (biểu đồ tròn)
- Hover để xem chi tiết

### 📋 Bảng dữ liệu
- Hiển thị đầy đủ: STT, Mã đơn, Ngày giao, Trạng thái, Sản phẩm, Tổng tiền
- Sắp xếp theo cột
- Click để xem chi tiết
- Pagination: 20/50/100 items/trang

### 📥 Xuất dữ liệu
- Xuất file xlsx với 1 click
- Giữ nguyên dữ liệu đã lọc

---

## ⚙️ Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/shopee-orders-statics.git
```

2. Mở Chrome, vào `chrome://extensions/`

3. Bật "Chế độ nhà phát triển"

4. Click "Tải chưa giải nén" và chọn thư mục `ShopeeStats`

## 📖 Hướng dẫn sử dụng

Xem hướng dẫn chi tiết tại [Hướng dẫn](/Documents/Huong_dan.md)

**Tóm tắt:**
1. Đăng nhập tài khoản [Shopee](https://shopee.vn)
2. Bật tiện ích ShopeeStatX trên thanh công cụ Chrome
3. Click "Bắt đầu phân tích"
4. Sử dụng bộ lọc và biểu đồ để phân tích chi tiêu

## 🛠️ Công nghệ

- Chrome Extension API (Manifest V3)
- Vanilla JavaScript
- Chart.js
- SheetJS (XLSX)
- Shopee API: `v4/order/get_all_order_and_checkout_list`

## ⚠️ Lưu ý

- Extension chỉ hoạt động khi đã đăng nhập Shopee
- Dữ liệu lấy trực tiếp từ API Shopee
- Ngày giao hàng: Thời điểm giao/nhận hàng thành công
- Đơn đã hủy: Không có ngày giao hàng
- Tổng chi tiêu không tính đơn đã hủy và trả hàng
- Dữ liệu chỉ hiển thị trong session, không lưu trữ

## License

[MIT License](LICENSE)

## 👨‍💻 Tác giả

<div align="center">

**Phát triển bởi [Ninh Hải Đăng](https://github.com/ninhhaidang)**

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://ninhhaidang.dev)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ninhhaidang)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/ninhhaidang)

</div>

---

**Lưu ý**: Extension này không liên quan đến Shopee chính thức. Đây là công cụ độc lập để phân tích dữ liệu cá nhân của bạn.