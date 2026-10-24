# Một UI thích ứng theo container cho tab, side panel và popup

Dashboard sẽ chạy ở tab Chrome, side panel (~320–480px) và popup. Thay vì mỗi nơi một layout, ta làm một UI thích ứng theo chiều rộng container (container query): tab điều hướng trên cùng chuyển thành thanh dưới cùng khi hẹp, bảng đơn hàng chuyển thành danh sách thẻ dưới ~640px. Tab, side panel và popup chỉ là các "host" khác nhau; việc thêm `side_panel` vào manifest là việc riêng, làm sau.

Đổi lại, mọi component phải được thiết kế và kiểm thử ở cả khổ rộng lẫn ~360px.
