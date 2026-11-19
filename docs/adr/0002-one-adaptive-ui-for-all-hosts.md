# Một UI thích ứng theo container cho tab, side panel và popup

Dashboard sẽ chạy ở tab Chrome, side panel (~320–480px) và popup. Thay vì mỗi nơi một layout, ta làm một UI thích ứng theo chiều rộng container (container query): tab điều hướng luôn ở trên (khi hẹp thì có hàng riêng dưới logo), bảng đơn hàng chuyển thành danh sách thẻ dưới ~640px. Tab, side panel và popup chỉ là các "host" khác nhau; việc thêm `side_panel` vào manifest là việc riêng, làm sau.

Đổi lại, mọi component phải được thiết kế và kiểm thử ở cả khổ rộng lẫn ~360px.

Cập nhật 2026-11: ban đầu tab chuyển thành thanh dưới cùng khi hẹp (kiểu ứng dụng điện thoại). Khi dashboard thực sự chạy trong side panel, người dùng thao tác bằng chuột trên máy tính nên không cần vùng bấm cho ngón cái; thanh dưới tách điều hướng khỏi phần đầu trang và khác bố cục khổ rộng. Vì vậy tab được đưa lên hàng riêng ngay dưới logo, gạch chân tab đang mở; chiều cao dành cho nội dung gần như không đổi.
