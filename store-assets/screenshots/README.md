# Store Screenshots

Required: 5 screenshots at **1280×800px** PNG format.

## Capture Instructions

1. Run demo mode: `npm run dev`
2. Open `http://localhost:3000/results.html` (loads mock data automatically)
3. Set browser window to exactly 1280×800
4. Capture each state below

## Required Screenshots

| Filename | State to capture |
|----------|-----------------|
| `01-summary-cards.png` | Trang kết quả — summary cards hiển thị tổng chi tiêu, số đơn, trung bình/đơn, so sánh tháng/năm |
| `02-charts.png` | Biểu đồ cột chi tiêu theo tháng + biểu đồ tròn top shop |
| `03-order-details.png` | Bảng đơn hàng với 1 row mở rộng hiển thị chi tiết sản phẩm |
| `04-orders-table.png` | Bảng đơn hàng đầy đủ với danh sách các đơn |
| `05-popup.png` | Popup extension khi đang ở shopee.vn (nút "Bắt đầu phân tích" active) |

## Tips

- Use mock data (demo mode) to avoid showing real personal order data
- Ensure charts have visible data (mock-data.js has representative orders)
- For popup screenshot: load as unpacked extension, navigate to shopee.vn, then click icon
