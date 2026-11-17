---
title: Chính sách bảo mật — ShopeeStatX
---

<!-- Public copy of src/privacy/Privacy.tsx, served by GitHub Pages at /privacy.html (the Chrome Web Store privacy URL). Keep the two identical. -->

# Chính sách bảo mật

*Cập nhật lần cuối: 05/03/2026 · Privacy Policy / Politique de confidentialité*

## 1. Tổng quan (Overview)

ShopeeStatX là Chrome Extension giúp người dùng phân tích lịch sử chi tiêu trên Shopee. Extension hoạt động hoàn toàn cục bộ — không có server, không có cơ sở dữ liệu bên ngoài, không thu thập hay truyền dữ liệu cá nhân ra bên ngoài.

*ShopeeStatX is a Chrome Extension that helps users analyze their Shopee spending history. The extension runs entirely locally — no server, no external database, no collection or transmission of personal data.*

## 2. Dữ liệu được truy cập (Data Accessed)

Extension chỉ truy cập dữ liệu khi người dùng chủ động nhấn "Bắt đầu phân tích":

- Lịch sử đơn hàng Shopee (qua API Shopee, sử dụng session trình duyệt)
- Thông tin đơn hàng: mã đơn, tên sản phẩm, ngày giao, trạng thái, tổng tiền, tên shop

Dữ liệu này **chỉ được lưu trên máy người dùng** trong `chrome.storage.local` và **không bao giờ được gửi đến server hay bên thứ ba nào**.

## 3. Quyền truy cập và lý do (Permissions)

| Quyền | Lý do sử dụng |
| --- | --- |
| `activeTab` | Đọc URL tab hiện tại để kiểm tra người dùng đang ở shopee.vn trước khi bắt đầu |
| `storage` | Lưu cache lịch sử đơn hàng trên máy người dùng để tránh phải tải lại mỗi lần mở extension |
| `scripting` | Inject script vào tab Shopee để gọi API Shopee với cookie trình duyệt — đây là cách duy nhất để lấy dữ liệu mà không cần tài khoản riêng hay server trung gian |
| `https://shopee.vn/*` | Giới hạn host permission — extension chỉ có thể inject script vào shopee.vn, không có quyền trên bất kỳ trang web nào khác |

## 4. Dữ liệu không được chia sẻ (No Data Sharing)

ShopeeStatX **không**:

- Gửi dữ liệu đến server nào
- Sử dụng analytics hay tracking
- Thu thập thông tin cá nhân
- Tạo tài khoản người dùng
- Chia sẻ dữ liệu với bên thứ ba

**Toàn bộ dữ liệu đơn hàng chỉ tồn tại trên máy của bạn và bị xóa hoàn toàn khi bạn gỡ cài đặt extension.**

## 5. Lưu trữ dữ liệu (Data Storage)

Dữ liệu được lưu tại `chrome.storage.local` — bộ nhớ cục bộ của Chrome, chỉ truy cập được từ extension này, không đồng bộ lên cloud. Xóa khi:

- Gỡ cài đặt extension
- Xóa dữ liệu Chrome tại `chrome://settings/clearBrowserData`
- Nhấn "Làm mới dữ liệu" trong extension (xóa cache cũ, tải lại)

## 6. Tuyên bố miễn trừ (Disclaimer)

ShopeeStatX là dự án mã nguồn mở độc lập, **không liên kết chính thức với Shopee**. Extension sử dụng API Shopee theo cách tương tự trình duyệt web bình thường (dùng session đăng nhập sẵn có).

## 7. Liên hệ (Contact)

Nếu có câu hỏi về chính sách bảo mật:

- GitHub Issues: [github.com/ninhhaidang/shopeestatx/issues](https://github.com/ninhhaidang/shopeestatx/issues)
- GitHub: [github.com/ninhhaidang](https://github.com/ninhhaidang)

---

ShopeeStatX · MIT License · [GitHub](https://github.com/ninhhaidang/shopeestatx)
