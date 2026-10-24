# Tính năng người dùng thấy được của ShopeeStatX

Danh sách này là mốc đối chiếu khi review hoặc viết yêu cầu «không bớt tính năng», mô tả giao diện sau redesign và phân biệt tính năng đang có với thay đổi được chủ ý chấp nhận.

## Popup

- Popup hiển thị lời chào cùng tên và ảnh đại diện khi có thông tin tài khoản, hoặc giới thiệu ngắn khi chưa có thông tin này.
- Nút «Bắt đầu phân tích» mở dashboard ở tab mới để lấy lịch sử đơn hàng từ phiên đăng nhập Shopee đang có.
- Popup chỉ cho bắt đầu khi URL tab hiện tại dùng HTTP(S) và hostname là `shopee.vn` hoặc tên miền con của nó; chuỗi `shopee.vn` trong đường dẫn, query hoặc hostname giả không đủ. Khi chưa ở trang phù hợp, popup hiển thị lời nhắc mở Shopee, đăng nhập cùng nút mở Shopee.
- Popup có liên kết ủng hộ, GitHub, đánh giá tiện ích, hướng dẫn và chính sách bảo mật.
- Popup có bộ chọn giao diện Tự động, Sáng và Tối.

## Dashboard và khoảng thời gian

- Dashboard chia thành ba màn hình Tổng quan, Phân tích và Đơn hàng, với thanh điều hướng và công cụ luôn nằm ngoài vùng nội dung cuộn.
- Ở khổ trung gian, bộ lọc thời gian và nút làm mới có hàng riêng để không che các tab điều hướng; chỉ ghép lên một hàng khi có đủ chiều rộng.
- Thanh đầu hiển thị thông tin tài khoản khi có dữ liệu và thời điểm cập nhật gần nhất.
- Bộ chọn khoảng thời gian có Tất cả, 7 ngày gần nhất, tháng này, tháng trước, 3 tháng gần nhất, năm nay, theo năm, theo tháng và khoảng ngày tùy chọn.
- Khoảng thời gian lọc đơn hàng theo ngày giao và được giữ khi chuyển giữa ba màn hình.
- Các chỉ số theo tháng, năm, nhận xét tự động, shop thân thiết, biểu đồ nhiệt, dự đoán và ngân sách có phạm vi riêng được mô tả ở các mục tương ứng thay vì luôn bị cắt theo khoảng ngày.
- Dashboard có thể hiển thị lịch sử đơn hàng đã lưu cục bộ và có nút làm mới để cập nhật dữ liệu.
- Mỗi lần bắt đầu phân tích từ popup, kết quả mới thay thế cache, kể cả hồ sơ tài khoản cũ; khi kết quả mới không có hồ sơ, tiện ích không gán tên tài khoản cũ cho lịch sử mới. Làm mới giữ các đơn cũ, trừ khi xác định được khác tài khoản: ưu tiên so sánh `userId`, sau đó `uid` khi cả hai hồ sơ cùng có loại ID đó; chỉ so sánh username khi cả hai đều không có ID. Nếu thiếu hồ sơ hoặc không có ID cùng loại để so sánh, làm mới giữ cache để tránh mất lịch sử do chuyển nguồn hồ sơ.
- Khi lấy dữ liệu lần đầu, dashboard hiển thị khung chờ, trạng thái kết nối, số đơn hàng đã lấy khi có tiến độ và lời nhắc khi chờ lâu.
- Khi làm mới, dashboard giữ nội dung đang xem, hiển thị tiến độ rồi thông báo số đơn hàng mới hoặc chưa có đơn hàng mới.
- Khi làm mới thất bại, dashboard giữ dữ liệu đang có và hiển thị thông báo lỗi.
- Khi tải ban đầu thất bại hoặc chưa có dữ liệu, dashboard giải thích trạng thái và cung cấp hành động thử lại hoặc lấy dữ liệu.
- Khi khoảng thời gian không có đơn hàng, cả ba màn hình có trạng thái rỗng và nút «Xem tất cả».
- Khi dữ liệu cũ thiếu thông tin cần thiết, Tổng quan và Phân tích hiển thị lời nhắc phân tích lại để bổ sung Hoàn tiền, Tiết kiệm ước tính và chi tiết sản phẩm.

## Tổng quan

- Tổng quan hiển thị nổi bật Chi tiêu ròng của khoảng thời gian đang chọn và không tính đơn bị loại do hủy hoặc trả hàng vào chi tiêu.
- Tổng quan hiển thị số đơn hàng không bị loại và Chi tiêu ròng trung bình mỗi đơn hàng trong khoảng đang chọn.
- Tổng quan hiển thị Hoàn tiền cùng số đơn bị loại và Tiết kiệm ước tính, hoặc dấu thiếu dữ liệu khi lịch sử cũ chưa đủ thông tin.
- Tiết kiệm ước tính là chênh lệch giữa giá các món sau giảm giá của món và số tiền thực trả, không tách riêng voucher với miễn phí vận chuyển và có thể thấp hơn thực tế khi có phí giao hàng.
- Tổng quan hiển thị chi tiêu của tháng được đối chiếu và phần trăm tăng hoặc giảm so với tháng trước, kèm tên cả hai tháng hoặc thông báo thiếu dữ liệu đối chiếu.
- Tổng quan hiển thị chi tiêu của năm được đối chiếu và phần trăm tăng hoặc giảm so với năm trước, kèm tên cả hai năm hoặc thông báo thiếu dữ liệu đối chiếu.
- So sánh tháng và năm dùng toàn bộ lịch sử, lấy mốc ở cuối khoảng đang chọn nhưng không vượt quá ngày hiện tại.
- Biểu đồ cột hiển thị Chi tiêu ròng theo tháng trong khoảng đang chọn và có bảng số liệu thay thế có thể mở hoặc đóng.
- Danh sách năm shop có Chi tiêu ròng cao nhất hiển thị thứ hạng, tên shop, số đơn hàng, số tiền và thanh so sánh trong khoảng đang chọn.
- Nút tạo ảnh chia sẻ nằm ở màn hình Tổng quan.

## Phân tích

- Phân tích hiển thị thứ trong tuần và khung giờ có nhiều đơn hàng nhất, chuỗi tháng liên tiếp có đơn hàng dài nhất và Chi tiêu ròng trung bình mỗi ngày trong khoảng đang chọn.
- Ở khổ rộng, nhận xét và ngân sách chia một hàng; thói quen mua sắm và hai danh sách sản phẩm chia đều hàng tiếp theo, còn biểu đồ nhiệt và shop thân thiết dùng toàn chiều rộng. Khổ hẹp xếp các khối theo một cột.
- Các thói quen theo ngày và giờ dựa trên ngày giao ghi trong lịch sử, không phải thời điểm đặt đơn hàng.
- Phân tích xếp hạng sản phẩm mua nhiều theo số lượng và sản phẩm đắt nhất theo đơn giá trong khoảng đang chọn.
- Nhận xét tự động dùng toàn bộ lịch sử để nêu chi tiêu tháng hiện tại, thay đổi so với tháng trước khi có dữ liệu, shop mua nhiều nhất, số đơn hàng trung bình mỗi tháng, ngày chi nhiều nhất tháng hiện tại và giá trị đơn bị loại khi phù hợp, với tối đa năm nhận xét.
- Biểu đồ nhiệt hiển thị số đơn hàng theo ngày trong cửa sổ 12 tháng kết thúc ở mốc cuối khoảng đang chọn, không vượt quá ngày hiện tại.
- Biểu đồ nhiệt dùng màu để phân biệt mức độ, có nhãn ngày và số đơn hàng, vùng cuộn ngang cùng bảng số liệu thay thế có thể mở hoặc đóng.
- Shop thân thiết dùng toàn bộ lịch sử và hiển thị tối đa mười shop có ít nhất ba đơn hàng không bị loại, ưu tiên shop có nhiều đơn hàng nhất.
- Bảng shop thân thiết hiển thị số đơn hàng, Chi tiêu ròng, Chi tiêu ròng trung bình mỗi đơn hàng, tần suất đơn hàng mỗi tháng và ngày mua gần nhất.
- Khi chưa có sản phẩm, shop thân thiết hoặc nhận xét phù hợp, Phân tích hiển thị lời giải thích thay cho danh sách trống.

## Đơn hàng

- Danh sách đơn hàng hiển thị mã đơn hàng, ngày giao, trạng thái, sản phẩm, số lượng sản phẩm và số tiền của từng đơn hàng trong khoảng đang chọn.
- Bảng khổ rộng giữ chiều rộng cho mã đơn, ngày, trạng thái, số lượng và số tiền; tên sản phẩm được xuống dòng trong phần còn lại, không bị cắt bằng dấu ba chấm. Nút mở chi tiết nằm cùng dòng với mã đơn và nhãn «Đơn bị loại» không bị bẻ đôi.
- Ô tìm kiếm lọc ngay theo mã đơn hàng, tên sản phẩm, tên shop, mô tả sản phẩm hoặc trạng thái và không phân biệt chữ hoa với chữ thường.
- Bộ lọc trạng thái hỗ trợ tất cả, hoàn thành, đã hủy, chờ vận chuyển, đang giao, chờ thanh toán và trả hàng.
- Bộ lọc shop thu hẹp danh sách theo một shop có đơn hàng trong khoảng đang chọn.
- Người dùng có thể sắp xếp tăng hoặc giảm theo ngày giao, trạng thái hoặc số tiền bằng tiêu đề cột ở khổ rộng và bộ chọn ở khổ hẹp.
- Người dùng có thể chọn 20, 50, 100 hoặc tất cả đơn hàng mỗi trang và chuyển trang trong danh sách kết quả.
- Danh sách hiển thị số kết quả và có trạng thái không tìm thấy cùng nút đặt lại bộ lọc khi tìm kiếm hoặc lọc không khớp đơn hàng nào.
- Mã đơn hàng là liên kết mở chi tiết đơn hàng trên Shopee trong tab mới.
- Mỗi đơn hàng có thể mở hoặc đóng chi tiết ngay trong danh sách để xem shop, ngày giờ giao, số tiền và tên, số lượng, đơn giá của từng sản phẩm khi có dữ liệu.
- Đơn bị loại có nhãn riêng và phần chi tiết giải thích việc không tính vào chi tiêu cùng giá trị Hoàn tiền hoặc giá trị đơn hàng khi thiếu thông tin Hoàn tiền.
- Khi khổ hẹp, bảng đơn hàng chuyển thành thẻ nhưng vẫn giữ tìm kiếm, bộ lọc, sắp xếp, phân trang, liên kết Shopee và chi tiết đơn hàng.

## Xuất dữ liệu

- Màn hình Đơn hàng cho tải dữ liệu Excel định dạng XLSX hoặc CSV.
- Excel và CSV chứa mã đơn hàng, ngày giao, trạng thái, sản phẩm, số lượng, số tiền, shop và mô tả sản phẩm.
- Mô tả sản phẩm nằm ở cột `Details`; CSV giữ dấu phẩy, dấu ngoặc kép và xuống dòng trong một ô, đồng thời vô hiệu hóa văn bản có thể bị bảng tính hiểu thành công thức.
- Nút «In / PDF» mở hộp thoại in của trình duyệt với bản in danh sách đơn hàng và cho lưu PDF bằng chức năng của trình duyệt.
- Cả ba cách xuất dùng toàn bộ kết quả theo khoảng thời gian, tìm kiếm, trạng thái, shop và thứ tự sắp xếp hiện tại, không chỉ trang đang xem.
- Các nút xuất bị vô hiệu hóa khi không có kết quả phù hợp.

## Chia sẻ ảnh

- Nút tạo ảnh tải về ảnh PNG gồm Chi tiêu ròng, Hoàn tiền, Tiết kiệm ước tính, thứ có nhiều đơn hàng nhất và chuỗi tháng có đơn hàng dài nhất của khoảng đang chọn.
- Ảnh chia sẻ chỉ chứa số liệu tổng hợp, không chứa tên tài khoản, tên shop, mã đơn hàng hoặc tên sản phẩm.
- Ảnh chia sẻ dùng thương hiệu ShopeeStatX và diện mạo sáng cố định, không đổi theo chế độ giao diện đang chọn.
- Tạo ảnh chỉ tải ảnh về máy, không tự đăng hoặc gửi dữ liệu lên mạng xã hội.

## Ngân sách và dự đoán

- Phân tích dự đoán Chi tiêu ròng cuối tháng khi có dữ liệu chi tiêu tháng hiện tại và hiển thị số tiền dự kiến vượt ngân sách khi phù hợp.
- Ngân sách và dự đoán luôn dùng tháng hiện tại trên toàn bộ lịch sử, độc lập với khoảng thời gian đang chọn.
- Người dùng có thể thiết lập hoặc chỉnh sửa hạn mức ngân sách tháng theo từng đồng (ví dụ 150.000₫), bật hoặc tắt ngân sách và chọn ngưỡng cảnh báo từ 50% đến 95%.
- Người dùng có thể lưu cấu hình ngân sách để dùng lại hoặc đóng biểu mẫu mà không lưu thay đổi.
- Nếu lưu cấu hình ngân sách thất bại, biểu mẫu giữ lại giá trị đã nhập và hiển thị thông báo lỗi.
- Khi bật ngân sách, Phân tích hiển thị Chi tiêu ròng tháng hiện tại so với hạn mức, tỷ lệ đã dùng và thanh tiến độ đổi màu theo mức sử dụng.
- Khi chạm ngưỡng cảnh báo, Phân tích hiển thị cảnh báo ngân sách ngay trong màn hình.
- Khi ngân sách chưa bật, Phân tích hiển thị trạng thái chưa thiết lập cùng nút thiết lập ngân sách.

## Giao diện và khả năng tiếp cận

- Popup, dashboard, trang chào mừng và chính sách bảo mật đều có lựa chọn Tự động, Sáng và Tối.
- Chế độ mặc định là Tự động, theo màu hệ thống và cập nhật khi hệ thống đổi giữa sáng với tối.
- Lựa chọn giao diện được lưu để áp dụng ở lần mở sau và được áp dụng trước khi hiển thị nội dung.
- Dashboard tự xếp lại theo chiều rộng vùng hiển thị, chuyển thanh điều hướng xuống dưới và giữ các chỉ số thành lưới gọn khi khổ hẹp.
- Người dùng có thể thao tác bằng bàn phím với trạng thái focus rõ ràng, chuyển tab bằng phím mũi tên hoặc phím đầu và cuối, và dùng nhãn điều khiển dành cho trình đọc màn hình.
- Biểu đồ chi tiêu và biểu đồ nhiệt có bảng số liệu thay thế để không buộc người dùng đọc dữ liệu chỉ qua màu sắc hoặc hình vẽ.
- Giao diện giảm chuyển động theo thiết lập hệ thống và định dạng số tiền, ngày giờ theo cách hiển thị tiếng Việt.

## Trang chào mừng

- Trang chào mừng giới thiệu việc lấy lịch sử đơn hàng, phân tích chi tiêu và xuất dữ liệu.
- Trang chào mừng giải thích các quyền truy cập được yêu cầu và việc lưu dữ liệu cục bộ.
- Trang chào mừng hướng dẫn đăng nhập Shopee, mở tiện ích, bắt đầu phân tích và khám phá dữ liệu.
- Trang chào mừng có nút mở Shopee cùng liên kết chính sách bảo mật và GitHub.
- Phiên bản trên trang chào mừng lấy trực tiếp từ manifest để luôn trùng phiên bản tiện ích.

## Quyền riêng tư

- Trang chính sách bảo mật trình bày dữ liệu tài khoản và đơn hàng được truy cập, quyền truy cập, nơi lưu dữ liệu, cách xóa dữ liệu và kênh liên hệ.
- ShopeeStatX dùng phiên đăng nhập Shopee sẵn có, không yêu cầu tạo tài khoản riêng hoặc nhập mật khẩu Shopee vào tiện ích.
- Lịch sử đơn hàng được xử lý và lưu cục bộ, không đồng bộ lên đám mây hoặc gửi tới máy chủ của ShopeeStatX hay bên thứ ba.
- Chính sách bảo mật nêu rõ không dùng công cụ theo dõi hoặc phân tích hành vi và dữ liệu tiện ích bị xóa khi gỡ cài đặt.
- Chính sách bảo mật nêu rõ ShopeeStatX là dự án độc lập, không liên kết chính thức với Shopee.

## Thay đổi chủ ý trong redesign và giới hạn hiện tại

- Các theme màu cũ đã bị loại bỏ có chủ ý và được thay bằng ba lựa chọn Tự động, Sáng và Tối.
- Bố cục dashboard một trang cuộn dài đã được thay có chủ ý bằng ba màn hình Tổng quan, Phân tích và Đơn hàng, không phải bỏ các chức năng được liệt kê ở trên.
- Popup được giữ gọn như nơi khởi chạy phân tích và truy cập liên kết, thay vì lặp lại dashboard.
- Khả năng thích ứng với vùng hẹp không đồng nghĩa đã có nút mở side panel, vì tùy chọn mở side panel chưa thuộc giao diện hiện tại.
- Ngoài những thay đổi chủ ý nêu trên, tính năng chưa thấy trong danh sách không tự động được coi là đã được chấp thuận loại bỏ.
