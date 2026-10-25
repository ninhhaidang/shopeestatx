# Thêm `display-style` (fintech | warm) như một trục độc lập với `theme`

Dashboard sẽ có thêm một kiểu hiển thị thứ hai cho cả 3 tab (Tổng quan, Phân tích, Đơn hàng), dựa trên Variant B ("warm") đã dựng trong `prototype/overview` (xem verdict ở ADR 0001/0002 và commit `55395c1`). Ta làm `display-style` (`fintech | warm`) là một trục lựa chọn hoàn toàn độc lập với `theme` (`light | dark | auto`) hiện có, không gộp hai khái niệm lại, và mỗi `display-style` có cặp token sáng/tối riêng để không phá quy tắc contrast đang áp cho `fintech`.

Phương án đã bị loại: gộp `warm` vào làm thêm một giá trị của `theme`, hoặc bỏ hẳn `theme` tối để chỉ còn 2 lựa chọn sáng cố định. Cả hai bị loại vì `theme` tối là tính năng đã công khai ở `docs/features.md` và dùng thật (dark mode cho extension dùng buổi tối); gộp trục sẽ buộc người dùng đánh đổi lựa chọn màu để lấy lựa chọn phong cách, trong khi hai nhu cầu này độc lập với nhau.

Variant B hiện mới có bản dựng cho Tổng quan; Phân tích và Đơn hàng ở `warm` (kèm `warm-dark`) chưa có thiết kế, cần `/prototype` riêng trước khi lên spec.
