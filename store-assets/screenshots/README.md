# Store Screenshots

Five **1280×800px PNG** screenshots show the 3.1 UI with representative mock orders. Never capture real account or order data.

## Capture

1. Run `npm run dev` and open `http://localhost:5173/dashboard-app/dashboard.html` (mock orders load automatically outside the extension).
2. Set the browser viewport to 1280×800 and choose the Light theme for consistent screenshots.
3. Capture each state below at 1280×800; the popup image may place the popup on a neutral canvas at that size, but must not suggest a live Shopee session when using mock data.
4. Inspect the five PNG files visually and confirm names, values, and controls match the current UI before publishing.

| Filename | State to capture |
|----------|------------------|
| `01-summary-cards.png` | Tổng quan: chi tiêu ròng, các ô số liệu, biểu đồ theo tháng và Top shop |
| `02-charts.png` | Phân tích: nhận xét, thói quen mua sắm, ngân sách và biểu đồ nhiệt |
| `03-order-details.png` | Đơn hàng: mở chi tiết một đơn có sản phẩm |
| `04-orders-table.png` | Đơn hàng: tìm kiếm, lọc, sắp xếp và danh sách đơn |
| `05-popup.png` | Popup: trạng thái ở Shopee với nút Bắt đầu phân tích; nếu chụp từ mock, ghi rõ đó là demo |

Use a development mock of the popup host for its screenshot; loading a real Shopee tab is unnecessary and risks including personal data.
