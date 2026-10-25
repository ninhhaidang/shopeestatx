# ShopeeStatX

**Hiểu rõ bạn đã chi bao nhiêu trên Shopee.**

ShopeeStatX là tiện ích Chrome giúp tổng hợp lịch sử mua hàng trên **Shopee Việt Nam**, xem xu hướng chi tiêu và quản lý ngân sách — ngay trong trình duyệt, không cần tạo tài khoản riêng.

[**Cài từ Chrome Web Store**](https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim) · [Hướng dẫn sử dụng](docs/guide/Huong_dan.md) · [English](docs/guide/README-en.md)

![Tổng quan ShopeeStatX: chi tiêu ròng, so sánh tháng, hoàn tiền, tiết kiệm ước tính và biểu đồ chi tiêu](store-assets/screenshots/01-summary-cards.png)

*Ảnh chụp giao diện mới dùng dữ liệu minh họa, không phải lịch sử mua hàng thật. Bản trên Chrome Web Store có thể khác bản mã nguồn hiện tại.*

## Từ lịch sử đơn hàng đến bức tranh chi tiêu

### Biết tiền đi đâu

- Xem **chi tiêu ròng**, số đơn và giá trị trung bình mỗi đơn; loại đơn hủy và trả hàng khỏi chi tiêu.
- Đối chiếu tháng, năm; xem biểu đồ theo tháng và những shop bạn chi nhiều nhất.
- Theo dõi hoàn tiền và **tiết kiệm ước tính** khi đơn hàng có đủ dữ liệu.

### Nhận ra thói quen, chủ động ngân sách

- Xem sản phẩm mua nhiều, sản phẩm có đơn giá cao và những shop thường xuyên quay lại.
- Khám phá số đơn theo ngày qua biểu đồ nhiệt, cùng các nhận xét từ lịch sử mua hàng.
- Đặt hạn mức tháng, chọn ngưỡng cảnh báo và xem dự đoán chi tiêu cuối tháng.

![Màn Phân tích: nhận xét chi tiêu, ngân sách tháng, thói quen mua sắm và các sản phẩm nổi bật](store-assets/screenshots/02-charts.png)

### Tìm lại đơn hàng và mang dữ liệu ra ngoài

- Tìm theo mã đơn, sản phẩm, shop hoặc mô tả; lọc theo thời gian, trạng thái và shop.
- Sắp xếp, phân trang và mở chi tiết từng đơn ngay trong danh sách.
- Xuất **Excel, CSV hoặc In / PDF** theo toàn bộ kết quả đang lọc, không chỉ trang đang xem.
- Tạo ảnh chia sẻ chỉ chứa số liệu tổng hợp, không chứa tên tài khoản hay chi tiết đơn hàng.

![Chi tiết đơn hàng: người bán, ngày giao, tổng tiền và từng sản phẩm trong đơn](store-assets/screenshots/03-order-details.png)

<details>
<summary>Xem thêm: danh sách đơn hàng và popup</summary>

**Danh sách đơn hàng** — bộ lọc, sắp xếp và xuất dữ liệu ở cùng một nơi.

![Danh sách đơn hàng đã lọc theo trạng thái Hoàn thành và sắp xếp theo tổng tiền](store-assets/screenshots/04-orders-table.png)

**Popup** — bắt đầu phân tích từ tab Shopee đang đăng nhập.

![Popup ShopeeStatX với nút Bắt đầu phân tích; đây là trạng thái demo](store-assets/screenshots/05-popup.png)

</details>

Giao diện có **Sáng, Tối và Tự động** theo hệ thống. Khi vùng hiển thị hẹp, bảng đơn chuyển thành thẻ; các bộ lọc và chi tiết đơn vẫn dùng được.

## Bắt đầu trong ba bước

1. [Cài ShopeeStatX từ Chrome Web Store](https://chromewebstore.google.com/detail/shopeestatx/hhcfonmapcabjmaghpapehegbmhdceim).
2. Mở [shopee.vn](https://shopee.vn) và đăng nhập tài khoản Shopee của bạn.
3. Bấm biểu tượng tiện ích → **Bắt đầu phân tích**. Dashboard mở ở tab mới và hiển thị tiến độ lấy đơn hàng.

Sau lần phân tích, bạn có thể xem lại dữ liệu đã lưu hoặc bấm **Làm mới** để cập nhật. Nếu đổi tài khoản Shopee, hãy bắt đầu một lần phân tích mới từ popup.

Cần chỉ dẫn chi tiết? Xem [hướng dẫn sử dụng](docs/guide/Huong_dan.md).

## Dữ liệu của bạn được xử lý thế nào?

- Tiện ích dùng **phiên đăng nhập Shopee đang có**. Bạn không cần nhập mật khẩu vào ShopeeStatX.
- Lịch sử đơn hàng được xử lý trong trình duyệt và lưu bằng `chrome.storage.local`, không đồng bộ lên máy chủ của ShopeeStatX.
- Không có tài khoản ShopeeStatX, công cụ theo dõi hay phân tích hành vi người dùng.
- File xuất và ảnh chia sẻ được tạo trên máy; việc gửi chúng cho người khác là do bạn quyết định.
- Gỡ tiện ích sẽ xóa dữ liệu mà tiện ích đã lưu. Những file bạn đã tải xuống vẫn nằm trên máy.

Mở **Chính sách bảo mật** trong popup của tiện ích để đọc chi tiết về dữ liệu được truy cập, quyền cần thiết và cách xóa dữ liệu.

## Những điều cần biết

- **Phạm vi:** hiện hỗ trợ `shopee.vn`, yêu cầu Chrome 116 trở lên và phiên Shopee đã đăng nhập.
- **Nguồn dữ liệu:** kết quả phụ thuộc dữ liệu Shopee trả về. Thay đổi từ Shopee hoặc phiên hết hạn có thể khiến việc lấy đơn thất bại.
- **Mốc thời gian:** các bộ lọc và thói quen mua sắm dùng ngày giao/nhận hàng có trong lịch sử, không phải lúc đặt đơn.
- **Số liệu ước tính:** tiết kiệm không tách riêng voucher với phí vận chuyển; dự đoán cuối tháng không phải cam kết hay tư vấn tài chính.
- **Ngân sách:** luôn tính tháng hiện tại trên toàn bộ lịch sử, độc lập với khoảng thời gian đang chọn.
- **Vùng hẹp:** giao diện đã thích ứng, nhưng chưa có nút mở Chrome Side Panel.
- **Mã đơn khi xuất:** XLSX giữ mã dưới dạng văn bản. Khi nhập CSV vào Excel, đặt cột mã đơn là Text để tránh tự làm tròn mã dài; dữ liệu đã bị làm tròn trước đó không thể tự khôi phục.

## Chạy từ mã nguồn

Yêu cầu **Node.js 24+**, npm và Chrome 116+.

```bash
git clone https://github.com/ninhhaidang/shopeestatx.git
cd shopeestatx
npm ci
npm run build
```

Mở `chrome://extensions`, bật **Developer mode**, chọn **Load unpacked** rồi trỏ đến thư mục **`dist/`** vừa tạo — không chọn thư mục mã nguồn.

### Phát triển với dữ liệu demo

```bash
npm run dev
```

Mở [dashboard demo](http://localhost:5173/dashboard-app/dashboard.html). Chế độ này không cần extension hay tài khoản Shopee và không gọi API Shopee. Nếu Vite dùng cổng khác, thay cổng trong URL.

Để kiểm tra bố cục, dùng [preview khổ tab](http://localhost:5173/dev-preview?width=tab&theme=light) hoặc [container 400px](http://localhost:5173/dev-preview?width=400&theme=dark). Preview chỉ có ở dev server, không nằm trong gói extension.

### Kiểm tra trước khi đóng góp

```bash
npm ci
npm run verify
```

`verify` chạy typecheck, kiểm tra code thừa bằng Knip, tests với coverage, production build và kiểm tra injected scripts — cùng pipeline với CI.

React 19, Tailwind CSS v4 và Vite dựng giao diện; Chart.js hiển thị biểu đồ, ExcelJS tạo file XLSX. Logic thống kê và Chrome host được tách khỏi các component giao diện.

- [Danh sách tính năng và giới hạn đã thống nhất](docs/features.md)
- [Quyết định kiến trúc](docs/adr/)
- [Nguồn dữ liệu và ràng buộc Shopee API](docs/shopee-order-api.md)
- [Quy cách ảnh chụp sản phẩm](store-assets/screenshots/README.md)

### Khắc phục audit — issue #46

- Thu thập theo cursor trả về, loại đơn trùng và giữ ngày giao chưa biết thay vì đoán từ mã đơn.
- Phối hợp nhiều lượt quét để không mất cập nhật cache, phát hiện thay đổi tài khoản có thể nhận diện và tách tiến độ theo từng lượt.
- Sửa identity shop, mốc ngày địa phương, thống kê bỏ ngày không hợp lệ và cửa sổ biểu đồ nhiệt năm nhuận.
- Khôi phục đầy đủ số liệu/bảng thay thế ở Ấm áp, sửa phân trang, biểu đồ một tháng, bố cục hẹp và đồng hồ khi mở tab lâu.
- Giữ mã đơn XLSX dạng text, số liệu chưa biết trên ảnh chia sẻ, lỗi lưu ngân sách và URL chính sách bảo mật.
- [Bằng chứng và giới hạn điều tra origin/dependency](docs/shopee-order-api.md#origin-investigation-2026-10-25); chưa thay phạm vi origin, quyền truy cập hay dependency khi chưa có quyết định phù hợp.

## Góp ý và hỗ trợ

Gặp lỗi? [Tạo GitHub issue](https://github.com/ninhhaidang/shopeestatx/issues/new) kèm phiên bản tiện ích, phiên bản Chrome và các bước tái hiện. Không đăng cookie, token, thông tin tài khoản hay lịch sử mua hàng cá nhân; hãy che dữ liệu nhạy cảm trong ảnh chụp.

Phát triển bởi [Ninh Hải Đăng](https://github.com/ninhhaidang). Bạn có thể [ủng hộ dự án](https://www.buymeacoffee.com/ninhhaidang).

ShopeeStatX là dự án độc lập, không liên kết hay được bảo trợ bởi Shopee. Mã nguồn được phát hành theo [giấy phép MIT](LICENSE).
