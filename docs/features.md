# Tính năng người dùng thấy được của ShopeeStatX

Danh sách này là mốc đối chiếu khi review hoặc viết yêu cầu «không bớt tính năng», mô tả giao diện sau redesign và phân biệt tính năng đang có với thay đổi được chủ ý chấp nhận.

## Popup

- Popup hiển thị lời chào cùng tên và ảnh đại diện khi có thông tin tài khoản, hoặc giới thiệu ngắn khi chưa có thông tin này.
- Nút «Bắt đầu phân tích» mở dashboard trong bảng bên (side panel) của Chrome, cạnh trang Shopee, để lấy lịch sử đơn hàng từ phiên đăng nhập Shopee đang có; nếu Chrome không mở được bảng bên thì mở ở tab mới. Mỗi lần bấm chỉ quét một lần: tải lại hay mở lại bảng bên sau đó đọc dữ liệu đã lưu.
- Trong bảng bên, nút «Mở toàn màn hình» (biểu tượng ↗ cạnh bộ chọn giao diện) mở dashboard ở tab mới và đóng bảng bên.
- Popup chỉ cho bắt đầu khi URL tab hiện tại dùng HTTPS và hostname đúng là `shopee.vn` (không nhận HTTP hay tên miền con, vì bộ thu thập chỉ đọc được từ origin này); chuỗi `shopee.vn` trong đường dẫn, query hoặc hostname giả không đủ. Khi chưa ở trang phù hợp, popup hiển thị lời nhắc mở Shopee, đăng nhập và thay nút bắt đầu bằng nút mở Shopee.
- Khi đã có dữ liệu lưu trên máy, popup hiện số đơn (đếm như ô «Số đơn» của dashboard, không tính đơn huỷ, trả hàng, chưa thanh toán) cùng thời điểm cập nhật, và có nút «Mở dashboard (dữ liệu đã lưu)» mở dashboard (bảng bên, hoặc tab mới nếu không mở được) trên dữ liệu đó mà không quét lại Shopee, kể cả khi tab hiện tại không phải Shopee.
- Popup có liên kết ủng hộ, GitHub, đánh giá tiện ích, hướng dẫn và chính sách bảo mật, xếp thành danh sách: › mở trang trong tiện ích, ↗ mở trang ngoài.
- Popup có bộ chọn giao diện Sáng và Tối.

## Dashboard và khoảng thời gian

- Dashboard chia thành ba màn hình Tổng quan, Phân tích và Đơn hàng, với thanh điều hướng và công cụ luôn nằm ngoài vùng nội dung cuộn.
- Các tab điều hướng luôn ở phía trên. Khổ hẹp (như bảng bên) chúng chiếm một hàng riêng ngay dưới logo, chia đều bề ngang, tab đang mở có gạch chân màu nhấn; không có thanh tab ở đáy màn hình.
- Ở khổ trung gian, bộ lọc thời gian và nút làm mới có hàng riêng để không che các tab điều hướng; chỉ ghép lên một hàng khi có đủ chiều rộng.
- Thanh đầu hiển thị thông tin tài khoản khi có dữ liệu và thời điểm cập nhật gần nhất.
- Bộ chọn khoảng thời gian có Tất cả, 7 ngày gần nhất, tháng này, tháng trước, 3 tháng gần nhất, năm nay, theo năm, theo tháng và khoảng ngày tùy chọn. Nếu nhập ngày Từ sau ngày Đến, hai đầu được hiểu đảo lại thay vì lọc ra khoảng rỗng.
- Khoảng thời gian lọc đơn hàng theo ngày giao và được giữ khi chuyển giữa ba màn hình.
- Ngày giao không biết được giữ là chưa có ngày, không suy ra từ mã đơn hàng hoặc thời điểm cập nhật trạng thái. Giá trị thời gian 0 của nguồn (hiện ra 1970-01-01) cũng là chưa có ngày, không phải một ngày giao thật. Đơn chưa có ngày hoặc có chuỗi ngày không hợp lệ vẫn có trong Tất cả và Chi tiêu ròng toàn thời gian, nhưng không tham gia khoảng có ngày, tần suất theo lịch hoặc nhận xét trung bình theo tháng. Ngày không hợp lệ được hiển thị, in và xuất như đơn chưa có ngày, và khi sắp xếp ngày giao thì thuộc cùng nhóm với đơn chưa có ngày.
- Các chỉ số theo tháng, năm, nhận xét tự động, shop thân thiết, biểu đồ nhiệt, dự đoán và ngân sách có phạm vi riêng được mô tả ở các mục tương ứng thay vì luôn bị cắt theo khoảng ngày.
- Dashboard có thể hiển thị lịch sử đơn hàng đã lưu cục bộ và có nút làm mới để cập nhật dữ liệu. Tải lại trang dashboard đọc dữ liệu đã lưu thay vì quét lại; nếu lượt quét lúc mở thất bại mà đã có dữ liệu lưu, dashboard hiển thị dữ liệu đó kèm thông báo lỗi.
- Mỗi lần bắt đầu phân tích từ popup, kết quả mới thay thế cache, kể cả hồ sơ tài khoản cũ; khi kết quả mới không có hồ sơ, tiện ích không gán tên tài khoản cũ cho lịch sử mới. Làm mới giữ các đơn cũ, trừ khi xác định được khác tài khoản: ưu tiên so sánh `userId`, sau đó `uid` khi cả hai hồ sơ cùng có loại ID đó; chỉ so sánh username khi cả hai đều không có ID. Nếu thiếu hồ sơ hoặc không có ID cùng loại để so sánh, làm mới giữ cache để tránh mất lịch sử do chuyển nguồn hồ sơ.
- Quét theo cursor Shopee trả về và chỉ tính mỗi mã đơn hàng một lần. Nhiều dashboard làm mới đồng thời không được làm mất đơn hoặc ghi đè trạng thái đơn mới hơn; lần phân tích thay thế vô hiệu hóa các kết quả cũ đang chờ, và chính nó bị từ chối nếu về sau một lượt mới hơn đã lưu. Khi phát hiện đổi tài khoản giữa lúc quét, tiện ích không lưu kết quả một phần. Nếu hồ sơ không đủ để nhận diện thay đổi, tiện ích không tuyên bố có thể phát hiện mọi lần đổi tài khoản.
- Khi lấy dữ liệu lần đầu, dashboard hiển thị khung chờ, trạng thái kết nối, số đơn hàng đã lấy khi có tiến độ và lời nhắc khi chờ lâu.
- Khi làm mới, dashboard giữ nội dung đang xem, hiển thị tiến độ rồi thông báo số đơn hàng mới hoặc chưa có đơn hàng mới.
- Tiến độ đếm đơn hợp lệ, duy nhất đã đọc xong; bản ghi trùng hoặc bị bỏ qua không làm số đếm tăng ảo rồi giảm ở trang cuối. Tiến độ và lời nhắc chờ lâu thuộc từng lượt quét, không bị sự kiện từ tab hay lượt quét khác thay đổi.
- Khi làm mới thất bại, dashboard giữ dữ liệu đang có và hiển thị thông báo lỗi.
- Khi tải ban đầu thất bại hoặc chưa có dữ liệu, dashboard giải thích trạng thái và cung cấp hành động thử lại hoặc lấy dữ liệu.
- Khi khoảng thời gian không có đơn hàng, cả ba màn hình có trạng thái rỗng và nút «Xem tất cả».
- Khi dữ liệu cũ thiếu thông tin cần thiết, Tổng quan và Phân tích hiển thị lời nhắc phân tích lại để bổ sung Hoàn tiền, Tiết kiệm ước tính và chi tiết sản phẩm.
- Các mốc ngày/tháng và thời gian cập nhật tương đối tự tiến khi dashboard mở lâu, không cần lấy lại lịch sử; đồng hồ cập nhật trong vòng một phút khi đang hoạt động hoặc khi quay lại tab.

## Tổng quan

- Tổng quan hiển thị nổi bật Chi tiêu ròng của khoảng thời gian đang chọn và không tính đơn bị loại (hủy, trả hàng hoặc chờ thanh toán) vào chi tiêu.
- Tổng quan hiển thị số đơn hàng không bị loại và Chi tiêu ròng trung bình mỗi đơn hàng trong khoảng đang chọn.
- Tổng quan hiển thị Hoàn tiền cùng số đơn bị loại và Tiết kiệm ước tính, hoặc dấu thiếu dữ liệu khi lịch sử cũ chưa đủ thông tin.
- Tiết kiệm ước tính là chênh lệch giữa giá các món sau giảm giá của món và số tiền thực trả, không tách riêng voucher với miễn phí vận chuyển và có thể thấp hơn thực tế khi có phí giao hàng.
- Tổng quan hiển thị chi tiêu của tháng được đối chiếu và phần trăm tăng hoặc giảm so với tháng trước, kèm tên cả hai tháng hoặc thông báo thiếu dữ liệu đối chiếu.
- Tổng quan hiển thị chi tiêu của năm được đối chiếu và phần trăm tăng hoặc giảm so với năm trước, kèm tên cả hai năm hoặc thông báo thiếu dữ liệu đối chiếu.
- So sánh tháng và năm dùng toàn bộ lịch sử, lấy mốc ở cuối khoảng đang chọn nhưng không vượt quá ngày hiện tại.
- Khi tháng hoặc năm của mốc chưa hết, so sánh tính cùng kỳ: chỉ cộng đến ngày của mốc ở cả hai bên (ví dụ «Tháng 11/2026, đến ngày 17 … so với cùng kỳ tháng 10/2026», «Năm 2026, đến 17/11 … so với cùng kỳ năm 2025»); ngày vượt quá tháng ngắn hơn dừng ở ngày cuối tháng đó. Tháng hoặc năm đã hết so với cả tháng hoặc cả năm trước. Nhận xét tự động ở Phân tích dùng cùng quy tắc.
- Biểu đồ cột hiển thị Chi tiêu ròng theo tháng của toàn bộ lịch sử: cột thuộc khoảng đang chọn tô đậm, cột ngoài khoảng tô nhạt, tháng không có đơn nằm giữa vẫn có cột bằng 0, các năm được tách dải và ghi nhãn, tháng cao nhất có nhãn số, và một đường nét đứt có nhãn «Trung bình …/tháng» đánh dấu chi tiêu trung bình mỗi tháng của mọi tháng trên biểu đồ (kể cả tháng bằng 0). Biểu đồ cao tối thiểu như cũ và giãn theo chiều cao khối. Mỗi cột là tổng cả tháng, kể cả khi khoảng đang chọn chỉ chạm một phần tháng đó. Rê chuột hoặc dùng phím mũi tên hiện số tiền của tháng; bấm cột hoặc Enter chọn riêng tháng đó (tương đương «Theo tháng» trong bộ chọn khoảng thời gian), chọn lại tháng đang chọn trở về Tất cả.
- Nút chuyển «Biểu đồ / Bảng số liệu» đổi biểu đồ thành bảng năm × 12 tháng kèm tổng cả năm ngay tại chỗ, không kéo dài trang.
- Danh sách năm shop có Chi tiêu ròng cao nhất hiển thị thứ hạng, tên shop, số đơn hàng, số tiền và thanh so sánh trong khoảng đang chọn.
- Mỗi shop trong Top shop là một nút: bấm mở tab Đơn hàng đã lọc sẵn theo shop đó (cùng khoảng thời gian) và đưa focus về tab Đơn hàng. Rê chuột hoặc focus bằng bàn phím làm sáng cả dòng và thay «N đơn» bằng «Xem đơn hàng ›». Vào tab Đơn hàng bằng thanh tab thì không lọc sẵn.
- Shop được nhóm theo định danh shop khi có, nếu thiếu dùng định danh người bán trong lịch sử cũ (đơn cũ thiếu định danh shop được gán định danh của đơn khác cùng người bán khi có); tên hiển thị trùng nhau không làm gộp hai người bán và tên chứa dấu phân cách được giữ đầy đủ.
- Nút «Tạo ảnh chia sẻ» nằm trong khối Top shop của màn hình Tổng quan và mở hộp chọn mẫu, tỉ lệ kèm xem trước.

## Phân tích

- Phân tích hiển thị thứ trong tuần và khung giờ có nhiều đơn hàng nhất (nhãn «Ngày hay nhận hàng», «Giờ hay nhận hàng», vì dữ liệu chỉ có thời điểm giao/nhận hàng, không có thời điểm đặt; ảnh chia sẻ dùng cùng nhãn), chuỗi tháng liên tiếp có đơn hàng dài nhất và Chi tiêu ròng trung bình mỗi ngày trong khoảng đang chọn.
- Phân tích không còn hai tiêu đề nhóm theo phạm vi; thay vào đó thẻ nào không theo khoảng đang chọn có nhãn nhỏ cạnh tiêu đề («Toàn bộ lịch sử» cho nhận xét và shop thân thiết, «Tháng này» cho dự đoán và ngân sách, «12 tháng» cho biểu đồ nhiệt). Ở khổ rộng trang xếp ba hàng, mỗi hàng một thẻ rộng và một thẻ hẹp: nhận xét cạnh dự đoán và ngân sách, biểu đồ nhiệt cạnh thói quen mua sắm (ở khổ rất rộng; hẹp hơn thì thói quen là một dải bốn số bên dưới biểu đồ nhiệt), shop thân thiết cạnh sản phẩm. Khổ hẹp xếp các khối theo một cột.
- Hai danh sách sản phẩm hiện tên đầy đủ tối đa hai dòng kèm thanh so sánh. Bấm một sản phẩm mở tab Đơn hàng với ô tìm kiếm điền sẵn tên sản phẩm; rê chuột hoặc focus thay dòng phụ bằng «Xem đơn hàng ›».
- Các thói quen theo ngày và giờ dựa trên ngày giao ghi trong lịch sử, không phải thời điểm đặt đơn hàng.
- Phân tích xếp hạng sản phẩm mua nhiều theo số lượng và sản phẩm đắt nhất theo đơn giá trong khoảng đang chọn. Hai bảng xếp hạng dùng chung một thẻ «Sản phẩm» với nút đổi «Mua nhiều nhất / Đắt nhất»; thẻ hiện năm dòng đầu và có nút «Xem cả …» để mở đủ danh sách, «Thu gọn» để đóng lại.
- Nhận xét tự động dùng toàn bộ lịch sử để nêu chi tiêu tháng hiện tại, thay đổi so với tháng trước khi có dữ liệu và mức thay đổi khác 0, shop mua nhiều nhất, số đơn hàng trung bình mỗi tháng, ngày chi nhiều nhất tháng hiện tại và giá trị đơn bị loại khi phù hợp, với tối đa năm nhận xét.
- Số đơn trung bình mỗi tháng chỉ dùng đơn có ngày hợp lệ ở cả tử số và tập tháng; chỉ sinh nhận xét khi có hơn một tháng thực sự. Giá trị đơn bị loại lấy từ giá trị gốc đã lưu, không được diễn đạt như giao dịch hoàn tiền đã xác minh hoặc Tiết kiệm ước tính.
- Biểu đồ nhiệt hiển thị số đơn hàng theo ngày trong cửa sổ 12 tháng kết thúc ở mốc cuối khoảng đang chọn, không vượt quá ngày hiện tại.
- Biểu đồ nhiệt dùng màu để phân biệt mức độ, có chú giải Ít–Nhiều, nhãn ngày và số đơn hàng khi rê chuột, tự giãn theo chiều rộng khối và không cuộn ngang: khi khối hẹp (như bảng bên), 12 tháng được chia thành hai hoặc ba dải xếp chồng, dải sau ghi cả tên tháng đang dở ở đầu. Không có bảng số liệu hiển thị; số đơn từng ngày đọc qua nhãn khi rê chuột, và trình đọc màn hình có một bảng ẩn liệt kê các ngày có đơn.
- Shop thân thiết dùng toàn bộ lịch sử và hiển thị tối đa mười shop có ít nhất ba đơn hàng không bị loại, ưu tiên shop có nhiều đơn hàng nhất; shop cùng số đơn xếp theo Chi tiêu ròng, nhiều hơn trước.
- Mỗi dòng shop thân thiết mở tab Đơn hàng lọc sẵn theo shop đó: tên shop là nút (cho bàn phím và trình đọc màn hình), bấm chỗ khác trên dòng cũng vậy; dòng sáng lên khi rê chuột và có dấu › ở cuối (khổ rộng).
- Bảng shop thân thiết hiển thị số đơn hàng, Chi tiêu ròng, Chi tiêu ròng trung bình mỗi đơn hàng, tần suất đơn hàng mỗi tháng và ngày mua gần nhất. Tần suất chỉ tính trên đơn có ngày giao; shop không có đơn nào có ngày hiển thị dấu thiếu dữ liệu. Khổ hẹp (như bảng bên) không cuộn ngang: mỗi shop là một khối gồm tên shop và Chi tiêu ròng trên một dòng, các số liệu còn lại kèm nhãn ở dòng dưới.
- Khi chưa có sản phẩm, shop thân thiết hoặc nhận xét phù hợp, Phân tích hiển thị lời giải thích thay cho danh sách trống.

## Đơn hàng

- Danh sách đơn hàng hiển thị ngày giao, sản phẩm (dòng chính, tối đa hai dòng) với shop và mã đơn hàng (dòng phụ bên dưới), trạng thái và số tiền của từng đơn hàng trong khoảng đang chọn. Không còn cột số lượng: đơn có từ hai sản phẩm trở lên ghi «N sản phẩm» ở dòng phụ. Ngày giao trong danh sách viết đủ hai chữ số ngày và tháng để thẳng cột.
- Mặc định danh sách xếp theo ngày giao, mới nhất trước, và chia theo tháng: mỗi tháng có dòng tiêu đề kèm số đơn và chi tiêu của cả tháng trong kết quả đang lọc (kể cả phần nằm ở trang khác). Đơn chưa có ngày giao nằm cuối, dưới tiêu đề «Chưa có ngày giao». Khi sắp xếp theo trạng thái hoặc số tiền thì không chia theo tháng.
- Bảng khổ rộng nằm trong một thẻ, tiêu đề cột dính ở đầu khi cuộn, và giữ chiều rộng cho ngày, trạng thái, số lượng và số tiền; tên sản phẩm được xuống dòng trong phần còn lại, không bị cắt bằng dấu ba chấm. Nút mở chi tiết nằm ở cuối hàng. Khổ hẹp mỗi đơn là một thẻ mở đầu bằng tên sản phẩm.
- Ô tìm kiếm lọc ngay theo mã đơn hàng, tên sản phẩm, tên shop, mô tả sản phẩm hoặc trạng thái và không phân biệt chữ hoa với chữ thường.
- Bộ lọc trạng thái là một hàng nút kèm số đơn, gồm «Tất cả» và mỗi trạng thái có trong khoảng đang chọn (hoàn thành, đã hủy, chờ vận chuyển, đang giao, chờ thanh toán, trả hàng). Số đơn trên mỗi nút tính theo ô tìm kiếm và bộ lọc shop hiện tại; mỗi nút mang chấm màu của trạng thái đó nên hàng nút cũng là chú giải màu. Khổ hẹp hàng nút nằm trên một dòng cuộn ngang thay vì xuống nhiều dòng; ô tìm kiếm đi cùng nút «Xuất dữ liệu», bộ lọc shop và bộ chọn sắp xếp chia đôi hàng bên dưới.
- Bộ lọc shop thu hẹp danh sách theo một shop có đơn hàng trong khoảng đang chọn. Tên shop dài không đẩy bộ lọc vượt vùng nội dung; danh sách lựa chọn vẫn giữ đầy đủ tên.
- Người dùng có thể sắp xếp tăng hoặc giảm theo ngày giao, trạng thái hoặc số tiền bằng tiêu đề cột ở khổ rộng (cột sắp xếp được luôn có mũi tên mờ) và bộ chọn ở khổ hẹp. Không còn lựa chọn «Mặc định» theo thứ tự Shopee trả về.
- Người dùng có thể chọn 20, 50, 100 hoặc tất cả đơn hàng mỗi trang và chuyển trang trong danh sách kết quả.
- Danh sách hiển thị số kết quả, và dòng cuối bảng ghi «Tổng N đơn» cùng tổng tiền của mọi đơn đang lọc, chữ đậm, thẳng cột số tiền (không tính đơn bị loại; có ghi chú khi kết quả có đơn bị loại). Khi tìm kiếm hoặc lọc không khớp đơn hàng nào, có trạng thái không tìm thấy cùng nút đặt lại bộ lọc.
- Mã đơn hàng là liên kết mở chi tiết đơn hàng trên Shopee trong tab mới.
- Mỗi đơn hàng có thể mở hoặc đóng chi tiết ngay trong danh sách, bằng nút mở chi tiết hoặc bấm vào bất kỳ chỗ nào trên dòng (trừ liên kết mã đơn), để xem ngày giờ giao và tên, số lượng, đơn giá, thành tiền của từng sản phẩm khi có dữ liệu. Shop và số tiền không lặp lại vì dòng phía trên đã có. Khi tiền hàng lớn hơn số tiền đơn (và đơn không bị loại), chi tiết ghi thêm Tiền hàng, Tổng tiền và Tiết kiệm ước tính của đơn đó kèm phần trăm.
- Trạng thái đơn là nhãn màu kèm chữ, mỗi trạng thái một màu riêng: hoàn thành xanh lá, đang giao xanh dương, chờ vận chuyển hổ phách, đã hủy đỏ, trả hàng tím, chờ thanh toán xám; màu không phải kênh thông tin duy nhất.
- Đơn bị loại có số tiền gạch ngang kèm chữ «Đơn bị loại» bên dưới, và phần chi tiết giải thích việc không tính vào chi tiêu cùng giá trị Hoàn tiền hoặc giá trị đơn hàng khi thiếu thông tin Hoàn tiền.
- Khi khổ hẹp, bảng đơn hàng chuyển thành thẻ nhưng vẫn giữ tìm kiếm, bộ lọc, sắp xếp, phân trang, liên kết Shopee và chi tiết đơn hàng.

## Xuất dữ liệu

- Màn hình Đơn hàng có menu «Xuất dữ liệu» chứa ba lựa chọn Excel (XLSX), CSV và In / PDF.
- Excel và CSV chứa mã đơn hàng, ngày giao, trạng thái, sản phẩm, số lượng, số tiền, shop và mô tả sản phẩm.
- XLSX lưu mã đơn hàng dưới dạng văn bản để giữ nguyên mã dài. CSV giữ nguyên ký tự mã nhưng không quy định kiểu ô: khi mở bằng Excel, nhập cột mã đơn dưới dạng Text hoặc dùng XLSX. Mã đã bị làm tròn trước khi lưu không thể tự khôi phục.
- Mô tả sản phẩm nằm ở cột `Details`; CSV giữ dấu phẩy, dấu ngoặc kép và xuống dòng trong một ô, đồng thời vô hiệu hóa văn bản có thể bị bảng tính hiểu thành công thức.
- Nút «In / PDF» mở hộp thoại in của trình duyệt với bản in danh sách đơn hàng và cho lưu PDF bằng chức năng của trình duyệt.
- Cả ba cách xuất dùng toàn bộ kết quả theo khoảng thời gian, tìm kiếm, trạng thái, shop và thứ tự sắp xếp hiện tại, không chỉ trang đang xem.
- Các nút xuất bị vô hiệu hóa khi không có kết quả phù hợp.

## Chia sẻ ảnh

- Hộp tạo ảnh cho chọn một trong ba mẫu (Vận đơn, Cam, Đêm) và một trong bốn tỉ lệ: vuông 1080×1080, dọc 1080×1350, story 1080×1920, ngang 1200×630, rồi tải về ảnh PNG. Ảnh gồm Chi tiêu ròng, Hoàn tiền, Tiết kiệm ước tính, thứ có nhiều đơn hàng nhất và chuỗi tháng có đơn hàng dài nhất của khoảng đang chọn; các tỉ lệ dọc có thêm dải cột chi tiêu theo tháng (chỉ hình, không có số).
- Khi lịch sử cũ thiếu số liệu Hoàn tiền hoặc Tiết kiệm ước tính, ảnh cũng hiển thị dấu thiếu dữ liệu thay vì 0₫.
- Ảnh chia sẻ chỉ chứa số liệu tổng hợp, không chứa tên tài khoản, tên shop, mã đơn hàng hoặc tên sản phẩm.
- Ảnh chia sẻ dùng thương hiệu ShopeeStatX; mỗi mẫu có diện mạo cố định, không đổi theo chế độ giao diện đang chọn.
- Tạo ảnh chỉ tải ảnh về máy, không tự đăng hoặc gửi dữ liệu lên mạng xã hội.

## Ngân sách và dự đoán

- Phân tích dự đoán Chi tiêu ròng cuối tháng khi có dữ liệu chi tiêu tháng hiện tại và hiển thị số tiền dự kiến vượt ngân sách khi phù hợp.
- Ngân sách và dự đoán luôn dùng tháng hiện tại trên toàn bộ lịch sử, độc lập với khoảng thời gian đang chọn.
- Người dùng có thể thiết lập hoặc chỉnh sửa hạn mức ngân sách tháng theo từng đồng (ví dụ 150.000₫, tối thiểu 1₫, không được để trống), bật hoặc tắt ngân sách và chọn ngưỡng cảnh báo từ 50% đến 95%.
- Người dùng có thể lưu cấu hình ngân sách để dùng lại hoặc đóng biểu mẫu mà không lưu thay đổi.
- Nếu lưu cấu hình ngân sách thất bại, biểu mẫu giữ lại giá trị đã nhập và hiển thị thông báo lỗi.
- Khi bật ngân sách, Phân tích hiển thị Chi tiêu ròng tháng hiện tại so với hạn mức, tỷ lệ đã dùng và thanh tiến độ đổi màu theo mức sử dụng.
- Khi chưa bật ngân sách, thẻ vẫn hiển thị «Đã chi 1–N/tháng» (Chi tiêu ròng tháng hiện tại đến hôm nay), «Dự kiến cuối tháng» khi có, và một thanh so với tháng trung bình: phần đậm là đã chi, phần nhạt là dự kiến, vạch dọc là tháng trung bình (cùng con số với đường trung bình trên biểu đồ tháng ở Tổng quan), kèm câu «Dự kiến cao hơn/thấp hơn tháng trung bình N%». Nút «Thiết lập» ngân sách vẫn ở dưới.
- Khi chạm ngưỡng cảnh báo, Phân tích hiển thị cảnh báo ngân sách ngay trong màn hình.
- Nếu không đọc được cấu hình ngân sách đã lưu, Phân tích báo lỗi thay vì hiển thị như chưa thiết lập.
- Khi ngân sách chưa bật, Phân tích hiển thị trạng thái chưa thiết lập cùng nút thiết lập ngân sách.

## Giao diện và khả năng tiếp cận

- Mọi màn hình và ảnh chia sẻ dùng phông Be Vietnam Pro đóng gói sẵn trong tiện ích, không tải phông từ mạng.
- Popup, dashboard, trang chào mừng và chính sách bảo mật đều có lựa chọn Sáng và Tối.
- Chế độ mặc định là Sáng, kể cả khi hệ thống đang dùng màu tối.
- Lựa chọn giao diện được lưu để áp dụng ở lần mở sau và được áp dụng trước khi hiển thị nội dung.
- Dashboard tự xếp lại theo chiều rộng vùng hiển thị, chuyển thanh điều hướng xuống dưới và giữ các chỉ số thành lưới gọn khi khổ hẹp.
- Người dùng có thể thao tác bằng bàn phím với trạng thái focus rõ ràng, chuyển tab bằng phím mũi tên hoặc phím đầu và cuối, và dùng nhãn điều khiển dành cho trình đọc màn hình.
- Biểu đồ chi tiêu có bảng số liệu thay thế và biểu đồ nhiệt có bảng chỉ dành cho trình đọc màn hình, để không buộc người dùng đọc dữ liệu chỉ qua màu sắc hoặc hình vẽ.
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

- Các theme màu cũ đã bị loại bỏ có chủ ý và được thay bằng hai lựa chọn Sáng và Tối (mặc định Sáng, không có chế độ tự động theo hệ thống).
- Kiểu hiển thị Ấm áp và bộ chọn Fintech/Ấm áp đã bị loại bỏ có chủ ý; dashboard chỉ còn một kiểu hiển thị (trước đây gọi là Fintech), vẫn có hai lựa chọn màu Sáng và Tối.
- Bố cục dashboard một trang cuộn dài đã được thay có chủ ý bằng ba màn hình Tổng quan, Phân tích và Đơn hàng, không phải bỏ các chức năng được liệt kê ở trên.
- Popup được giữ gọn như nơi khởi chạy phân tích và truy cập liên kết, thay vì lặp lại dashboard.
- Khả năng thích ứng với vùng hẹp không đồng nghĩa đã có nút mở side panel, vì tùy chọn mở side panel chưa thuộc giao diện hiện tại.
- Ngoài những thay đổi chủ ý nêu trên, tính năng chưa thấy trong danh sách không tự động được coi là đã được chấp thuận loại bỏ.
